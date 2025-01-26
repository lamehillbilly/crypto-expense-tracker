import { prisma } from '../lib/prisma'

async function main() {
  try {
    console.log('\n=== Database Contents ===\n')
    
    // Check Trades
    const trades = await prisma.trade.findMany()
    console.log('Trades:', trades.length)
    if (trades.length > 0) {
      console.log('Sample trade:', {
        id: trades[0].id,
        tokenSymbol: trades[0].tokenSymbol,
        status: trades[0].status
      })
    }
    
    // Check Claims
    const claims = await prisma.claim.findMany()
    console.log('\nClaims:', claims.length)
    if (claims.length > 0) {
      console.log('Sample claim:', {
        id: claims[0].id,
        date: claims[0].date
      })
    }
    
    // Check Entries
    const entries = await prisma.entry.findMany()
    console.log('\nEntries:', entries.length)
    
    // Check other related tables
    const pnlRecords = await prisma.pnlRecord.findMany()
    console.log('PnlRecords:', pnlRecords.length)
    
    const tokenAmounts = await prisma.tokenAmount.findMany()
    console.log('TokenAmounts:', tokenAmounts.length)
    
    const tradeHistory = await prisma.tradeHistory.findMany()
    console.log('TradeHistory:', tradeHistory.length)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main() 