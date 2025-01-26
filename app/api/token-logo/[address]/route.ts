import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  const address = params.address;
  
  try {
    // Try to fetch the logo from Ramses
    const response = await fetch(
      `https://raw.githubusercontent.com/RamsesExchange/ramses-assets/main/blockchains/avalanche/assets/${address}/logo.png`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );

    if (!response.ok) {
      // If Ramses logo fails, return a 404
      return new NextResponse(null, { status: 404 });
    }

    // Get the image data
    const imageData = await response.arrayBuffer();
    
    // Return the image with proper headers
    return new NextResponse(imageData, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error fetching token logo:', error);
    return new NextResponse(null, { status: 404 });
  }
} 