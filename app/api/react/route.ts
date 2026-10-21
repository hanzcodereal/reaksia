import { NextRequest, NextResponse } from 'next/server';
import { react, syncVipKeys } from '@/lib/rch';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 10;

export async function POST(req: NextRequest) {
  try {
    const { url, emoji, sync } = await req.json();
    if (!url || !emoji) {
      return NextResponse.json(
        { status: false, error: 'URL dan emoji wajib.' },
        { status: 400 }
      );
    }

    if (sync === true) {
      await syncVipKeys();
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

export async function GET() {
  const keys = await syncVipKeys();
  return NextResponse.json({
    status: !!keys,
    count: keys ? keys.length : 0,
    keys: keys || []
  });
}
