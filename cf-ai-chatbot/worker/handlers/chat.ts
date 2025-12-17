import { errorResponse } from "../utils/cors";
import { streamAIResponse } from "../utils/streaming";
import { checkRateLimit, rateLimitResponse } from "../utils/rateLimit";
import { validateMessage, validateConversationId, calculateSuspicionScore } from "../utils/validation";
import { getAssistantPrompt } from "../utils/prompts";

/**
 * Handle chat requests with streaming AI responses
 * POST /api/chat
 * 
 * @param request - HTTP request with message and conversationId
 * @param env - Worker environment bindings
 * @param summarizeThreshold - Number of messages before triggering summarization
 * @returns Streaming response with AI tokens
 */
export async function handleChat(
  request: Request,
  env: Env,
  summarizeThreshold: number
): Promise<Response> {
  try {
    // Rate limiting check - FIRST LINE OF DEFENSE
    const { allowed, clientId } = await checkRateLimit(request, env);
    
    if (!allowed) {
      console.warn(`Rate limit exceeded for client: ${clientId}`);
      return rateLimitResponse(clientId);
    }

    const body = (await request.json()) as {
      message: unknown;
      conversationId: unknown;
    };

    // SECURITY: Validate message input
    const messageValidation = validateMessage(body.message);
    if (!messageValidation.valid) {
      console.error('Invalid message input', {
        error: messageValidation.error,
        clientId,
        timestamp: new Date().toISOString(),
      });
      return errorResponse(messageValidation.error!, 400);
    }

    // SECURITY: Validate conversation ID
    const conversationIdValidation = validateConversationId(body.conversationId);
    if (!conversationIdValidation.valid) {
      console.error('Invalid conversation ID', {
        error: conversationIdValidation.error,
        clientId,
        timestamp: new Date().toISOString(),
      });
      return errorResponse(conversationIdValidation.error!, 400);
    }

    const message = messageValidation.sanitized!;
    const conversationId = body.conversationId as string;

    // SECURITY: Check for suspicious content (prompt injection attempts)
    if (messageValidation.isSuspicious) {
      const suspicionScore = calculateSuspicionScore(message);
      const patterns = messageValidation.suspiciousPatterns || [];
      
      // Log to Cloudflare Analytics/Logs (visible in dashboard)
      console.warn('SECURITY: Suspicious input detected', {
        suspicionScore,
        patternCount: patterns.length,
        patterns: patterns.slice(0, 5), // First 5 patterns
        clientId,
        conversationId,
        messageLength: message.length,
        timestamp: new Date().toISOString(),
        userAgent: request.headers.get('User-Agent'),
        cfRay: request.headers.get('CF-Ray'), // Cloudflare trace ID
        cfCountry: request.headers.get('CF-IPCountry'),
      });

      // SECURITY POLICY: Reject high-risk inputs
      if (suspicionScore > 80) {
        console.error('SECURITY: High-risk input REJECTED', {
          suspicionScore,
          patternCount: patterns.length,
          clientId,
          timestamp: new Date().toISOString(),
        });
        return errorResponse('Input validation failed: suspicious content detected', 400);
      }

      // SECURITY POLICY: Warn for medium-risk inputs but allow
      if (suspicionScore > 50) {
        console.warn('SECURITY: Medium-risk input ALLOWED with monitoring', {
          suspicionScore,
          clientId,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Get Durable Object for this conversation
    const id = env.CHAT_MEMORY.idFromName(conversationId);
    const stub = env.CHAT_MEMORY.get(id);

    // Add user message to memory
    await stub.fetch("http://internal/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "user", content: message }),
    });

    // Get conversation state
    const stateResponse = await stub.fetch("http://internal/state");
    const state = (await stateResponse.json()) as {
      messages: Array<{ role: string; content: string }>;
      summary: string;
      messageCount: number;
    };

    // Build context for Llama (include summary if available)
    const systemMessage = getAssistantPrompt(state.summary);

    const messages = [
      { role: "system", content: systemMessage },
      ...state.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    // Get streaming response from Llama 3.3
    const aiResponse = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages,
      stream: true,
    });

    // Stream response to client
    return streamAIResponse(
      aiResponse,
      stub,
      conversationId,
      message,
      state,
      env,
      summarizeThreshold
    );
  } catch (error) {
    console.error("Chat error:", error);
    return errorResponse(error instanceof Error ? error : String(error), 500);
  }
}
