import { DurableObject } from "cloudflare:workers";

/**
 * RateLimiter Durable Object
 * Provides persistent, distributed rate limiting per IP address
 * 
 * This survives Worker restarts and is shared globally across all regions.
 * Each IP gets its own Durable Object instance with persistent storage.
 */

interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  requestsPerMinute: 10,   // 10 requests per minute per IP
  requestsPerHour: 100,    // 100 requests per hour per IP
  requestsPerDay: 500,     // 500 requests per day per IP (protects against sustained abuse)
};

export class RateLimiter extends DurableObject {
  private config: RateLimitConfig;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.config = DEFAULT_CONFIG;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Check if request should be allowed
    if (url.pathname === "/check") {
      const allowed = await this.checkRateLimit();
      
      if (!allowed) {
        return new Response(
          JSON.stringify({ 
            allowed: false, 
            error: "Rate limit exceeded",
            retryAfter: 60 
          }), 
          { 
            status: 429,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      return new Response(
        JSON.stringify({ allowed: true }), 
        { 
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Get current rate limit stats
    if (url.pathname === "/stats") {
      const stats = await this.getStats();
      return new Response(
        JSON.stringify(stats), 
        { 
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    return new Response("Not found", { status: 404 });
  }

  /**
   * Check if request should be rate limited
   * Returns true if allowed, false if rate limited
   */
  private async checkRateLimit(): Promise<boolean> {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    // Get stored timestamps
    let minuteRequests: number[] = (await this.ctx.storage.get("minute")) || [];
    let hourRequests: number[] = (await this.ctx.storage.get("hour")) || [];
    let dayRequests: number[] = (await this.ctx.storage.get("day")) || [];

    // Clean up old timestamps
    minuteRequests = minuteRequests.filter(ts => ts > oneMinuteAgo);
    hourRequests = hourRequests.filter(ts => ts > oneHourAgo);
    dayRequests = dayRequests.filter(ts => ts > oneDayAgo);

    // Check all limits
    if (minuteRequests.length >= this.config.requestsPerMinute) {
      console.warn(`Rate limit exceeded: ${minuteRequests.length} requests in last minute`);
      return false;
    }

    if (hourRequests.length >= this.config.requestsPerHour) {
      console.warn(`Rate limit exceeded: ${hourRequests.length} requests in last hour`);
      return false;
    }

    if (dayRequests.length >= this.config.requestsPerDay) {
      console.warn(`Rate limit exceeded: ${dayRequests.length} requests in last day`);
      return false;
    }

    // Request is allowed - add current timestamp
    minuteRequests.push(now);
    hourRequests.push(now);
    dayRequests.push(now);

    // Persist to storage (survives restarts)
    await this.ctx.storage.put("minute", minuteRequests);
    await this.ctx.storage.put("hour", hourRequests);
    await this.ctx.storage.put("day", dayRequests);

    return true;
  }

  /**
   * Get current rate limit statistics
   */
  private async getStats(): Promise<{
    requestsLastMinute: number;
    requestsLastHour: number;
    requestsLastDay: number;
    limits: RateLimitConfig;
  }> {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    let minuteRequests: number[] = (await this.ctx.storage.get("minute")) || [];
    let hourRequests: number[] = (await this.ctx.storage.get("hour")) || [];
    let dayRequests: number[] = (await this.ctx.storage.get("day")) || [];

    minuteRequests = minuteRequests.filter(ts => ts > oneMinuteAgo);
    hourRequests = hourRequests.filter(ts => ts > oneHourAgo);
    dayRequests = dayRequests.filter(ts => ts > oneDayAgo);

    return {
      requestsLastMinute: minuteRequests.length,
      requestsLastHour: hourRequests.length,
      requestsLastDay: dayRequests.length,
      limits: this.config,
    };
  }
}
