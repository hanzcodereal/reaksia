import { NextRequest, NextResponse } from 'next/server';
import { react } from '@/lib/rch';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 10;

export async function POST(req: NextRequest) {
  try {
    const { url, emoji } = await req.json();
    if (!url || !emoji) {
      return NextResponse.json(
        { status: false, error: 'URL dan emoji wajib.' },
        { status: 400 }
      );
    }
    const result = await react(String(url), String(emoji));
    return NextResponse.json(result, { status: result.status ? 200 : 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown';
    return NextResponse.json(
      { status: false, error: message },
      { status: 500 }
    );
  }
                               }
