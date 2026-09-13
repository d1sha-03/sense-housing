import { NextRequest } from "next/server";

// Per-key fixed-window rate limiter, backed by a plain module-level Map.
//
// This intentionally lives inside a route handler's own module rather than
// proxy.ts: Next.js's docs explicitly warn that proxy "may be deployed to
// your CDN for fast redirect/rewrite handling" and to "not attempt relying
// on shared modules or globals" there — confirmed in practice, a counter
// kept in proxy.ts never persisted across requests. Route handlers run in
// the regular long-lived Node.js server process, where module-level state
// behaves as expected.
//
// It's still in-memory only: state resets on restart and isn't shared
// across server instances. That's an acceptable limit for this app's
// current single-instance deployment — it stops the common case (one
// abusive client hammering an endpoint) even though it can't stop a
// distributed attacker spread across many IPs.
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

// Caps unbounded memory growth from an attacker cycling through IPs. A hard
// reset under sustained pressure is an acceptable trade for staying
// bounded — it briefly gives everyone a fresh window rather than leaking.
const MAX_TRACKED_KEYS = 5_000;

export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]!.trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

export interface RateLimitResult {
  limited: boolean;
  retryAfterSeconds: number;
}

export function checkRateLimit(
  key: string,
  rule: { windowMs: number; max: number }
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_TRACKED_KEYS) {
      buckets.clear();
    }
    buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
    return { limited: false, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  const limited = bucket.count > rule.max;
  return { limited, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
}
