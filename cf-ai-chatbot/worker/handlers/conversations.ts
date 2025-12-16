import { corsHeaders, errorResponse } from "../utils/cors";
import { getConversationId, getConversationStub } from "../utils/conversation";

/**
 * Get conversation state from Durable Object
 * GET /api/conversations/:id
 * 
 * @param request - HTTP request
 * @param env - Worker environment bindings
 * @returns Response with conversation state (messages, summary, count)
 */
export async function handleGetConversation(request: Request, env: Env): Promise<Response> {
  try {
    const conversationId = getConversationId(request);
    if (conversationId instanceof Response) return conversationId;

    const stub = getConversationStub(conversationId, env);
    const stateResponse = await stub.fetch("http://internal/state");
    const state = await stateResponse.json();

    return Response.json(state, { headers: corsHeaders });
  } catch (error) {
    console.error("Get conversation error:", error);
    return errorResponse(error instanceof Error ? error : String(error), 500);
  }
}

/**
 * Clear conversation history
 * DELETE /api/conversations/:id
 * 
 * @param request - HTTP request
 * @param env - Worker environment bindings
 * @returns Response with success status
 */
export async function handleDeleteConversation(request: Request, env: Env): Promise<Response> {
  try {
    const conversationId = getConversationId(request);
    if (conversationId instanceof Response) return conversationId;

    const stub = getConversationStub(conversationId, env);
    await stub.fetch("http://internal/clear", { method: "POST" });

    return Response.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error("Delete conversation error:", error);
    return errorResponse(error instanceof Error ? error : String(error), 500);
  }
}
