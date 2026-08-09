import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Verify Vercel Cron Secret if set
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      const url = new URL(request.url);
      const key = url.searchParams.get('key');
      if (key !== cronSecret) {
        return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
      }
    }

    const backendUrl =
      process.env.BACKEND_URL ??
      process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/api\/?$/, '') ??
      'http://localhost:4000';

    const targetUrl = `${backendUrl}/api/cron`;

    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {}),
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        {
          status: 'error',
          message: `Backend cron failed with HTTP ${res.status}`,
          targetUrl,
          details: errText,
        },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({
      status: 'ok',
      triggeredAt: new Date().toISOString(),
      backendResponse: data,
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to invoke backend cron ping',
        error: err.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
