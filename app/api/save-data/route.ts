import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const dataDirectory = path.join(process.cwd(), 'data');
    await fs.mkdir(dataDirectory, { recursive: true });

    const { entries, trades } = data;
    
    await fs.writeFile(
      path.join(dataDirectory, 'entries.json'),
      JSON.stringify(entries, null, 2)
    );
    
    await fs.writeFile(
      path.join(dataDirectory, 'trades.json'),
      JSON.stringify(trades, null, 2)
    );

    return NextResponse.json({ message: 'Data saved successfully' });
  } catch (error) {
    console.error('Error saving data:', error);
    return NextResponse.json({ message: 'Error saving data' }, { status: 500 });
  }
}