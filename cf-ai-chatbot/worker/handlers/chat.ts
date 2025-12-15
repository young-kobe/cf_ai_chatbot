import { errorResponse } from "../utils/cors";
import { streamAIResponse } from "../utils/streaming";
import { checkRateLimit, rateLimitResponse } from "../utils/rateLimit";

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

    const { message, conversationId } = (await request.json()) as {
      message: string;
      conversationId: string;
    };

    // Validate request
    if (!message || !conversationId) {
      return errorResponse("Missing message or conversationId", 400);
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
    const systemMessage = state.summary
      ? `You are a helpful AI assistant. Previous conversation summary: ${state.summary}`
      : "You are a helpful AI assistant.";

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
