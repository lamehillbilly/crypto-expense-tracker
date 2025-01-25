import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    console.log('Incoming trade data:', body);

    // Validate required fields
    if (!body.tokenId || !body.tokenSymbol || !body.tokenName || 
        !body.purchasePrice || !body.quantity || !body.purchaseDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let tokenInfo = null;
    let retries = 3;
    
    while (retries > 0) {
      try {
        const tokenInfoResponse = await fetch(
          `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(body.tokenId)}?localization=false&tickers=false&community_data=false&developer_data=false`,
          {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'CryptoTracker'
            },
            cache: 'no-store'
          }
        );

        if (tokenInfoResponse.status === 429) {
          await sleep(1000);
          retries--;
          continue;
        }

        const responseText = await tokenInfoResponse.text();
        
        if (!responseText) {
          throw new Error('Empty response from CoinGecko');
        }

        try {
          tokenInfo = JSON.parse(responseText);
          if (tokenInfo) break; // Success, exit the retry loop
        } catch (parseError) {
          console.warn('Failed to parse CoinGecko response:', responseText);
          throw new Error('Invalid JSON response from CoinGecko');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.warn(`Attempt ${3 - retries + 1} failed:`, errorMessage);
        retries--;
        
        if (retries === 0) {
          console.warn('All CoinGecko API attempts failed, proceeding with basic trade info');
        } else {
          await sleep(1000);
        }
      }
    }

    // Create the trade with available info
    const trade = await prisma.trade.create({
      data: {
        tokenId: body.tokenId,
        tokenSymbol: body.tokenSymbol.toUpperCase(),
        tokenName: body.tokenName,
        tokenImage: body.tokenImage || tokenInfo?.image?.small || null,
        marketCapRank: tokenInfo?.market_cap_rank ? parseInt(tokenInfo.market_cap_rank.toString()) : null,
        purchasePrice: Number(body.purchasePrice),
        quantity: Number(body.quantity),
        purchaseDate: new Date(body.purchaseDate),
        status: 'open',
        currentPrice: Number(body.purchasePrice),
        unrealizedPnl: 0,
        realizedPnl: 0
      },
    });

    return NextResponse.json({ success: true, trade });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorDetails = error instanceof Error ? error.stack : null;
    
    console.error('Trade creation failed:', { message: errorMessage, details: errorDetails });
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: errorDetails
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // First get all trades with their history
    const trades = await prisma.trade.findMany({
      where: status ? { status } : undefined,
      orderBy: { purchaseDate: 'desc' },
      include: {
        tradeHistory: {
          orderBy: {
            date: 'desc'
          }
        }
      }
    });

    // Calculate totals from all trades
    const totals = await prisma.trade.aggregate({
      _sum: {
        realizedPnl: true
      }
    });

    // For open trades, fetch current prices and calculate unrealized P/L
    const updatedTrades = await Promise.all(trades.map(async (trade) => {
      if (trade.status === 'closed') {
        return {
          ...trade,
          realizedPnl: trade.realizedPnl || 0
        };
      }

      try {
        // Fetch current price from CoinGecko
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${trade.tokenId}&vs_currencies=usd`,
          {
            headers: {
              'Accept': 'application/json'
            }
          }
        );

        if (!response.ok) {
          console.error(`Failed to fetch price for ${trade.tokenId}:`, await response.text());
          throw new Error('Failed to fetch price');
        }

        const data = await response.json();
        const currentPrice = data[trade.tokenId]?.usd;

        if (!currentPrice) {
          throw new Error(`No price data for ${trade.tokenId}`);
        }

        // Calculate unrealized P/L
        const unrealizedPnl = (currentPrice - trade.purchasePrice) * trade.quantity;

        return {
          ...trade,
          currentPrice,
          unrealizedPnl,
        };
      } catch (error) {
        console.error(`Error fetching price for ${trade.tokenId}:`, error);
        // Return trade with purchase price as current price if API call fails
        return {
          ...trade,
          currentPrice: trade.purchasePrice,
          unrealizedPnl: 0,
        };
      }
    }));

    // Calculate total realized P/L and estimated tax
    const totalRealizedPnL = totals._sum.realizedPnl || 0;
    const totalTaxEstimate = totalRealizedPnL > 0 ? totalRealizedPnL * 0.35 : 0;

    return NextResponse.json({
      trades: updatedTrades,
      totalRealizedPnL,
      totalTaxEstimate
    });
  } catch (error) {
    console.error('Error fetching trades:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch trades' },
      { status: 500 }
    );
  }
} 