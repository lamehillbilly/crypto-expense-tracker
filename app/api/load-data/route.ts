import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const dataDirectory = path.join(process.cwd(), 'data');
    
    let entries = [];
    let trades = [];

    try {
      const entriesContent = await fs.readFile(
        path.join(dataDirectory, 'entries.json'),
        'utf8'
      );
      entries = JSON.parse(entriesContent);
    } catch {
      console.log('No existing entries file');
    }

    try {
      const tradesContent = await fs.readFile(
        path.join(dataDirectory, 'trades.json'),
        'utf8'
      );
      trades = JSON.parse(tradesContent);
    } catch {
      console.log('No existing trades file');
    }

    return NextResponse.json({ entries, trades });
  } catch {
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 });
  }
}

export async function POST() {
  try {
    // ... existing code ...
  } catch {
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}