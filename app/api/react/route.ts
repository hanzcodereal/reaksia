import { NextRequest, NextResponse } from 'next/server';
import { reactStream, syncVipKeys } from '@/lib/rch';

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

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const ev of reactStream(String(url), String(emoji))) {
            controller.enqueue(encoder.encode(JSON.stringify(ev) + '\n'));
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown';
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'done',
                result: { time: '0ms', status: false, error: message }
              }) + '\n'
            )
          );
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no'
      }
    });
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
