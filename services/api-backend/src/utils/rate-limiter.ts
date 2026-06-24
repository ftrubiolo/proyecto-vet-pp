const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;

const counters = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string): { allowed: boolean; remaining: number; resetInMs: number } {
    const now = Date.now();
    const entry = counters.get(key);

    if (!entry || now > entry.resetAt) {
        counters.set(key, { count: 1, resetAt: now + WINDOW_MS });
        return { allowed: true, remaining: MAX_REQUESTS - 1, resetInMs: WINDOW_MS };
    }

    entry.count++;

    if (entry.count > MAX_REQUESTS) {
        return { allowed: false, remaining: 0, resetInMs: entry.resetAt - now };
    }

    return { allowed: true, remaining: MAX_REQUESTS - entry.count, resetInMs: entry.resetAt - now };
}

setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of counters) {
        if (now > entry.resetAt) counters.delete(key);
    }
}, 60_000);
