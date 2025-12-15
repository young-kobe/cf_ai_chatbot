import { corsHeaders } from "./cors";

/**
 * Get client identifier (IP address) from request
 * Uses Cloudflare headers to get the real client IP
 */
export function getClientIdentifier(request: Request): string {
  // Cloudflare provides the real client IP in this header
  const cfConnectingIP = request.headers.get("CF-Connecting-IP");
  if (cfConnectingIP) return cfConnectingIP;

  // Fallback to X-Forwarded-For
  const xForwardedFor = request.headers.get("X-Forwarded-For");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }

  // Last resort: use X-Real-IP
  const xRealIP = request.headers.get("X-Real-IP");
  if (xRealIP) return xRealIP;

  // If all else fails, return a generic identifier
  return "unknown";
}

/**
 * Check if request is rate limited using Durable Objects
 * Returns true if allowed, false if rate limited
 */
export async function checkRateLimit(
  request: Request,
  env: Env
): Promise<{ allowed: boolean; clientId: string }> {
  const clientId = getClientIdentifier(request);

  // Get the RateLimiter Durable Object for this IP
  const rateLimiterId = env.RATE_LIMITER.idFromName(clientId);
  const rateLimiterStub = env.RATE_LIMITER.get(rateLimiterId);

  // Check if this IP is rate limited
  const response = await rateLimiterStub.fetch("http://internal/check");
  const result = await response.json() as { allowed: boolean };

  return {
    allowed: result.allowed,
    clientId,
  };
}

/**
 * Create rate limit error response
 */
export function rateLimitResponse(clientId?: string): Response {
  const message = clientId 
    ? `Rate limit exceeded for IP: ${clientId}. Please try again later.`
    : "Rate limit exceeded. Please try again later.";

  return new Response(
    JSON.stringify({
      error: message,
      retryAfter: 60, // seconds
      code: "RATE_LIMIT_EXCEEDED",
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": "60",
      },
    }
  );
}

/**
 * Get rate limit stats for a client (for debugging)
 */
export async function getRateLimitStats(
  clientId: string,
  env: Env
): Promise<any> {
  const rateLimiterId = env.RATE_LIMITER.idFromName(clientId);
  const rateLimiterStub = env.RATE_LIMITER.get(rateLimiterId);

  const response = await rateLimiterStub.fetch("http://internal/stats");
  return await response.json();
}
