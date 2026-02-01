import { NextResponse, type NextRequest } from 'next/server';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 60;

type RateEntry = { count: number; resetAt: number };
const rateMap = new Map<string, RateEntry>();

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? 'unknown';
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp;
  return req.ip ?? 'unknown';
}

function pruneExpired(now: number) {
  for (const [key, entry] of rateMap.entries()) {
    if (entry.resetAt <= now) rateMap.delete(key);
  }
}

export function middleware(req: NextRequest) {
  const now = Date.now();
  if (rateMap.size > 10_000) pruneExpired(now);

  const ip = getClientIp(req);
  const entry = rateMap.get(ip);

  if (!entry || entry.resetAt <= now) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  } else {
    entry.count += 1;
    rateMap.set(ip, entry);
    if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
      const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSec),
            'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(entry.resetAt),
          },
        }
      );
    }
  }

  const response = NextResponse.next();
  const current = rateMap.get(ip);
  if (current) {
    response.headers.set('X-RateLimit-Limit', String(RATE_LIMIT_MAX_REQUESTS));
    response.headers.set('X-RateLimit-Remaining', String(Math.max(0, RATE_LIMIT_MAX_REQUESTS - current.count)));
    response.headers.set('X-RateLimit-Reset', String(current.resetAt));
  }
  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
