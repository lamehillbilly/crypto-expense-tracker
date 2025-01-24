// app/api/claims/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ClaimDetails, DailyClaimAggregate, TokenClaim } from '@/types';
import { Prisma } from '@prisma/client';

interface TokenDetail {
  tokenSymbol: string;
  amount: number;
}

interface ClaimRequestBody {
  date: string;
  tokenDetails: TokenDetail[];
  totalAmount: number;
  heldForTaxes: boolean;
  taxAmount?: number;
  txn?: string;
}

interface JsonClaimDetails {
  tokenClaims: TokenClaim[];
  taxAmount?: number;
  heldForTaxes: boolean;
  date: string;
}

interface DbClaim {
  id: number;
  type: string;
  amount: number;
  date: Date;
  txn: string | null;
  expenseDetails: Prisma.JsonValue;
  claimDetails: Prisma.JsonValue;
  purchaseAmount: number;
  purchaseDate: Date;
  status: string;
}

// Get all claims with daily aggregation


// Helper function to convert ClaimDetails to a plain object
function toJsonObject(claimDetails: ClaimDetails) {
  return JSON.parse(JSON.stringify(claimDetails));
}

// Create new claim with daily aggregation
export async function POST(request: Request) {
  try {
    const body: ClaimRequestBody = await request.json();
    const { date, tokenDetails, totalAmount, heldForTaxes, taxAmount, txn } = body;
    console.log('Received claim request:', { date, tokenDetails, totalAmount, taxAmount, txn });

    // Check if there's an existing claim for this date
    const existingClaim = await prisma.entry.findFirst({
      where: {
        type: 'Claims',
        date: {
          gte: new Date(date + 'T00:00:00.000Z'),
          lt: new Date(date + 'T23:59:59.999Z')
        }
      }
    });

    if (existingClaim) {
      // Merge with existing claim
      const existingDetails = existingClaim.claimDetails as unknown as JsonClaimDetails;
      const existingTokenClaims = existingDetails?.tokenClaims || [];
      const newTokenClaims = tokenDetails.map((token: TokenDetail) => ({
        tokenSymbol: token.tokenSymbol,
        amount: Number(token.amount)
      }));
      // Combine token claims
      const mergedTokenClaims = mergeTokenClaims(
        existingTokenClaims as TokenClaim[], 
        newTokenClaims as TokenClaim[]
      );
      const mergedTotal = mergedTokenClaims.reduce((sum, token) => sum + token.amount, 0);

      const updatedClaim = await prisma.entry.update({
        where: { id: existingClaim.id },
        data: {
          amount: mergedTotal,
          claimDetails: toJsonObject({
            tokenClaims: mergedTokenClaims,
            taxAmount: (existingDetails?.taxAmount || 0) + (taxAmount || 0),
            heldForTaxes: heldForTaxes || existingDetails?.heldForTaxes,
            date: date + 'T12:00:00.000Z',
            taxPercentage: 0,
            tokenTags: mergedTokenClaims.map(t => t.tokenSymbol),
            totalAmount: mergedTotal
          }),
        }
      });

      return NextResponse.json(transformClaimResponse(updatedClaim));
    }

    // Create new claim if no existing one
    const tokenClaims = tokenDetails.map((token: TokenDetail) => ({
      tokenSymbol: token.tokenSymbol,
      amount: Number(token.amount)
    }));

    const claim = await prisma.entry.create({
      data: {
        type: 'Claims',
        date: new Date(`${date}T12:00:00.000-00:00`),
        txn: txn || null,
        amount: totalAmount,
        claimDetails: {
          tokenClaims,
          taxAmount,
          heldForTaxes,
          date: `${date}T12:00:00.000-00:00`
        },
        purchaseAmount: 0,
        purchaseDate: new Date(),
        status: 'open'
      },
    });

    return NextResponse.json(transformClaimResponse(claim));
  } catch (error) {
    console.error('Detailed error creating claim:', error);
    return NextResponse.json({ 
      error: 'Failed to create claim',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper function to merge token claims
function mergeTokenClaims(existing: TokenClaim[], newClaims: TokenClaim[]): TokenClaim[] {
  const merged = new Map<string, number>();
  
  // Add existing claims
  existing.forEach(claim => {
    merged.set(claim.tokenSymbol, (merged.get(claim.tokenSymbol) || 0) + claim.amount);
  });
  
  // Add new claims
  newClaims.forEach(claim => {
    merged.set(claim.tokenSymbol, (merged.get(claim.tokenSymbol) || 0) + claim.amount);
  });
  
  // Convert back to array
  return Array.from(merged.entries()).map(([tokenSymbol, amount]) => ({
    tokenSymbol,
    amount,
    tokenId: tokenSymbol,
    tokenClaims: false,
    totalAmount: amount
  }));
}

// Helper function to transform claim response
function transformClaimResponse(claim: any) {
  const claimDetails = claim.claimDetails as unknown as JsonClaimDetails;
  const tokenTotals: Record<string, number> = {};
  let calculatedTotal = 0;

  if (claimDetails?.tokenClaims) {
    claimDetails.tokenClaims.forEach((token: { tokenSymbol: string; amount: number; }) => {
      tokenTotals[token.tokenSymbol] = token.amount;
      calculatedTotal += token.amount;
    });
  }

  return {
    id: claim.id,
    date: claim.date.toISOString(),
    totalAmount: calculatedTotal,
    tokenTotals,
    taxAmount: claimDetails?.taxAmount,
    txn: claim.txn || undefined,
  };
}

export async function GET() {
  try {
    console.log('Fetching claims...');
    
    const claims = await prisma.entry.findMany({
      where: {
        type: 'Claims'
      },
      orderBy: {
        date: 'desc'
      },
    }).catch(error => {
      console.error('Prisma error:', error);
      throw error;
    });

    console.log('Raw claims from DB:', claims);

    // Transform the data to include calculated totals
    const transformedClaims = claims.map(claim => {
      const tokenTotals: Record<string, number> = {};
      let totalAmount = 0;

      const claimDetails = claim.claimDetails as unknown as JsonClaimDetails;
      if (claimDetails?.tokenClaims) {
        claimDetails.tokenClaims.forEach(token => {
          tokenTotals[token.tokenSymbol] = token.amount;
          totalAmount += token.amount;
        });
      }

      return {
        id: claim.id,
        date: claim.date.toISOString(),
        totalAmount,
        tokenTotals,
        taxAmount: claimDetails?.taxAmount,
        txn: claim.txn || undefined,
      };
    });

    console.log('Transformed claims:', transformedClaims);

    return NextResponse.json(transformedClaims);
  } catch (error) {
    console.error('Detailed error in GET /api/claims:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch claims',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}