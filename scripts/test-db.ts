import { prisma } from '../lib/prisma'

async function main() {
  try {
    // Test connection
    await prisma.$connect()
    console.log('Database connection successful')
    
    // Count and show trades
    const tradesCount = await prisma.trade.count()
    console.log(`Found ${tradesCount} trades`)
    
    // Count and show claims
    const claimsCount = await prisma.claim.count()
    console.log(`Found ${claimsCount} claims`)
    
    // Get sample data
    const sampleTrade = await prisma.trade.findFirst()
    const sampleClaim = await prisma.claim.findFirst()
    
    console.log('\nSample trade:', sampleTrade)
    console.log('\nSample claim:', sampleClaim)
  } catch (error) {
    console.error('Database error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main() 