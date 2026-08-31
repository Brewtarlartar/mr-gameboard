import { NextRequest, NextResponse } from 'next/server';

// CORS for the Capacitor shells ONLY. The native WebView origins are fixed by
// Capacitor's default schemes (iOS: capacitor://localhost, Android:
// https://localhost) and their API calls authenticate with a bearer token, so
// Access-Control-Allow-Credentials is deliberately omitted. Web traffic is
// same-origin and never sends these Origin values, so this middleware is a
// no-op for browsers.
const NATIVE_ORIGINS = new Set(['capacitor://localhost', 'https://localhost']);

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

export function middleware(req: NextRequest) {
  const origin = req.headers.get('origin');
  const allowed = origin !== null && NATIVE_ORIGINS.has(origin);

  if (req.method === 'OPTIONS' && allowed) {
    return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
  }

  const res = NextResponse.next();
  if (allowed) {
    for (const [key, value] of Object.entries(corsHeaders(origin))) {
      res.headers.set(key, value);
    }
  }
  return res;
}

export const config = {
  matcher: '/api/:path*',
};
