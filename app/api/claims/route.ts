// app/api/claims/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ClaimDetails, DailyClaimAggregate, TokenClaim } from '@/types';
import { Prisma } from '@prisma/client';

// Create a proper type for the JSON claim details
interface JsonClaimDetails {
  tokenClaims?: TokenClaim[];
  totalAmount?: number;
  heldForTaxes?: boolean;
  taxAmount?: number;
  date?: string;
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
export async function GET() {
  try {
    const claims = await prisma.entry.findMany({
      where: { type: 'Claims' },
      orderBy: { date: 'desc' }
    });

    // Aggregate claims by date
    const dailyAggregates: { [date: string]: DailyClaimAggregate } = {};

    claims.forEach((claim: DbClaim) => {
      const dateStr = new Date(claim.date).toISOString().split('T')[0];
      
      if (!dailyAggregates[dateStr]) {
        dailyAggregates[dateStr] = {
          date: dateStr,
          claims: [],
          totalAmount: 0,
          tokenTotals: {}
        };
      }

      const aggregate = dailyAggregates[dateStr];
      aggregate.totalAmount += claim.amount;

      // Safely parse the JSON claimDetails
      const claimDetails = claim.claimDetails as JsonClaimDetails;
      if (claimDetails && typeof claimDetails === 'object' && !Array.isArray(claimDetails)) {
        const parsedClaim = claimDetails as ClaimDetails;
        if (parsedClaim.tokenClaims) {
          parsedClaim.tokenClaims.forEach((tokenClaim: TokenClaim) => {
            aggregate.tokenTotals[tokenClaim.tokenSymbol] = 
              (aggregate.tokenTotals[tokenClaim.tokenSymbol] || 0) + tokenClaim.amount;
          });
        }
        aggregate.claims.push(parsedClaim);
      }
    });

    return NextResponse.json(Object.values(dailyAggregates));
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching claims:', error.message);
    }
    return NextResponse.json(
      { error: 'Failed to fetch claims' },
      { status: 500 }
    );
  }
}

// Helper function to convert ClaimDetails to a plain object
function toJsonObject(claimDetails: ClaimDetails) {
  return JSON.parse(JSON.stringify(claimDetails));
}

// Create new claim with daily aggregation
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { date, tokenDetails, totalAmount, heldForTaxes, taxAmount, txn } = data;

    const existingClaim = await prisma.entry.findFirst({
      where: {
        type: 'Claims',
        date: new Date(date)
      }
    });

    if (existingClaim) {
      const claimDetails = existingClaim.claimDetails as JsonClaimDetails;
      const existingTokenClaims = Array.isArray(claimDetails?.tokenClaims) 
        ? claimDetails.tokenClaims 
        : [];
      const newTokenClaims = Array.isArray(tokenDetails) ? tokenDetails : [];

      const updatedClaimDetails: ClaimDetails = {
        tokenTags: [],
        tokenClaims: [...existingTokenClaims, ...newTokenClaims],
        totalAmount: claimDetails?.totalAmount + totalAmount || totalAmount,
        heldForTaxes: heldForTaxes || false,
        taxAmount: heldForTaxes ?
            (claimDetails?.taxAmount || 0) + (taxAmount || 0)
            : undefined,
        date,
        taxPercentage: undefined
      };

      const updatedClaim = await prisma.entry.update({
        where: { id: existingClaim.id },
        data: {
          amount: updatedClaimDetails.totalAmount,
          claimDetails: toJsonObject(updatedClaimDetails),
          txn: txn || null  // Update txn field
        }
      });

      return NextResponse.json(updatedClaim);
    }

    const newClaimDetails: ClaimDetails = {
      tokenTags: [],
      tokenClaims: Array.isArray(tokenDetails) ? tokenDetails : [],
      totalAmount,
      heldForTaxes: heldForTaxes || false,
      taxAmount,
      date,
      taxPercentage: undefined
    };

    const newClaim = await prisma.entry.create({
      data: {
        type: 'Claims',
        date: new Date(date),
        amount: totalAmount,
        claimDetails: toJsonObject(newClaimDetails),
        txn: txn || null,  // Include txn field
        purchaseAmount: 0,
        purchaseDate: new Date(),
        status: 'open'
      }
    });

    return NextResponse.json(newClaim);
  } catch (error) {
    console.error('Error creating claim:', error);
    return NextResponse.json({ error: 'Failed to create claim' }, { status: 500 });
  }
}