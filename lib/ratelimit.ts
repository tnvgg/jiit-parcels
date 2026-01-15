const requestMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  identifier: string,
  limit = 5,
  windowMs = 15 * 60 * 1000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = requestMap.get(identifier);

  if (!record || now > record.resetAt) {
    requestMap.set(identifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: limit - record.count };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestMap.entries()) {
    if (now > value.resetAt) {
      requestMap.delete(key);
    }
  }
}, 60 * 60 * 1000);