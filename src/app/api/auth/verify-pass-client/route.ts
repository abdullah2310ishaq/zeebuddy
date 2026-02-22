import { NextResponse } from 'next/server';

/**
 * API route for verify-pass-client
 * This route can be extended if needed
 */
export async function GET() {
  return NextResponse.json(
    { message: 'This endpoint is not implemented' },
    { status: 501 }
  );
}

export async function POST() {
  return NextResponse.json(
    { message: 'This endpoint is not implemented' },
    { status: 501 }
  );
}

