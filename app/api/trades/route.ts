import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { isCustomToken, ...tradeData } = body;
    
    console.log('Incoming trade data:', body);

    // Validate required fields
    if (!tradeData.tokenId || !tradeData.tokenSymbol || !tradeData.tokenName || 
        !tradeData.purchasePrice || !tradeData.quantity || !tradeData.purchaseDate) {
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
          `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(tradeData.tokenId)}?localization=false&tickers=false&community_data=false&developer_data=false`,
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
        ...tradeData,
        tokenImage: tradeData.tokenImage || tokenInfo?.image?.small || null,
        marketCapRank: tokenInfo?.market_cap_rank ? parseInt(tokenInfo.market_cap_rank.toString()) : null,
        status: 'open',
        currentPrice: Number(tradeData.purchasePrice),
        unrealizedPnl: 0,
        realizedPnl: 0,
        isCustomToken: isCustomToken || false,
      },
    });

    return NextResponse.json(trade);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('Database error:', {
        code: error.code,
        message: error.message,
        meta: error.meta
      });
    } else {
      console.error('Unknown error:', error);
    }

    return NextResponse.json(
      { 
        error: 'Failed to create trade',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await prisma.$connect();

    const trades = await prisma.trade.findMany({
      include: {
        TradeHistory: {
          orderBy: {
            date: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Map the trades to include tradeHistory
    const tradesWithHistory = trades.map(trade => ({
      ...trade,
      tradeHistory: trade.TradeHistory
    }));

    const totalRealizedPnL = trades.reduce((sum, trade) => sum + (trade.realizedPnl || 0), 0);
    const totalTaxEstimate = Math.max(0, totalRealizedPnL * 0.30);

    return NextResponse.json({
      trades: tradesWithHistory,
      totalRealizedPnL,
      totalTaxEstimate
    });
  } catch (error) {
    // More detailed error logging
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('Database error:', {
        code: error.code,
        message: error.message,
        meta: error.meta
      });
    } else {
      console.error('Unknown error:', error);
    }

    return NextResponse.json(
      { 
        error: 'Failed to fetch trades',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 