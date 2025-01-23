import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

async function readJsonFile(filePath: string) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return null;
  }
}

async function migrateData() {
  try {
    // Read existing JSON files
    const entriesData = await readJsonFile(path.join(process.cwd(), 'data', 'entries.json'));
    const tradesData = await readJsonFile(path.join(process.cwd(), 'data', 'trades.json'));

    if (!entriesData && !tradesData) {
      console.log('No data files found to migrate.');
      return;
    }

    // Begin transaction
    await prisma.$transaction(async (tx) => {
      // Clear existing data (optional - remove if you want to keep existing DB data)
      await tx.entry.deleteMany({});
      await tx.trade.deleteMany({});

      // Migrate entries
      if (entriesData) {
        for (const entry of entriesData) {
          await tx.entry.create({
            data: {
              type: entry.type,
              amount: entry.amount,
              date: new Date(entry.date),
              txn: entry.txn || null,
              tokenName: entry.tokenName || null,
              pnl: entry.pnl || null,
              daysHeld: entry.daysHeld || null,
              expenseDetails: entry.expenseDetails || null,
              claimDetails: entry.claimDetails || null,
              purchaseAmount: entry.purchaseAmount || 0,
              purchaseDate: new Date(entry.purchaseDate || entry.date).toISOString(),
              status: entry.status || 'open'
            }
          });
          console.log(`Migrated entry: ${entry.type} - ${entry.date}`);
        }
      }

      // Migrate trades
      if (tradesData) {
        for (const trade of tradesData) {
          await tx.trade.create({
            data: {
              tokenName: trade.tokenName,
              purchaseAmount: trade.purchaseAmount,
              purchaseDate: new Date(trade.purchaseDate).toISOString(),
              status: trade.status,
              closeAmount: trade.closeAmount || null,
              closeDate: trade.closeDate ? new Date(trade.closeDate).toISOString() : null,
              pnl: trade.pnl || null,
              daysHeld: trade.daysHeld || null
            }
          });
          console.log(`Migrated trade: ${trade.tokenName}`);
        }
      }
    });

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateData();