import { NextResponse } from 'next/server';

export async function GET() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="46" fill="#0D1528" stroke="#19D89A" stroke-width="6"/>
    <circle cx="50" cy="50" r="30" fill="none" stroke="#E5232F" stroke-width="4" stroke-dasharray="8 6"/>
    <text x="50" y="64" font-size="40" fill="#19D89A" text-anchor="middle" font-family="sans-serif">🏏</text>
  </svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
