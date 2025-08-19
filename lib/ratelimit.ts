// lib/ratelimit.ts
const buckets = new Map<string, { count: number; ts: number }>();
export function allow(ip: string, limit = 30, windowMs = 60_000) {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || now - b.ts > windowMs) {
    buckets.set(ip, { count: 1, ts: now });
    return true;
  }
  if (b.count >= limit) return false;
  b.count++;
  return true;
}
