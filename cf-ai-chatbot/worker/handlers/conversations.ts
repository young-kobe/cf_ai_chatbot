import { corsHeaders, errorResponse } from "../utils/cors";

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
    const url = new URL(request.url);
    const conversationId = url.pathname.split("/").pop();

    if (!conversationId) {
      return errorResponse("Invalid conversation ID", 400);
    }

    const id = env.CHAT_MEMORY.idFromName(conversationId);
    const stub = env.CHAT_MEMORY.get(id);

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
    const url = new URL(request.url);
    const conversationId = url.pathname.split("/").pop();

    if (!conversationId) {
      return errorResponse("Invalid conversation ID", 400);
    }

    const id = env.CHAT_MEMORY.idFromName(conversationId);
    const stub = env.CHAT_MEMORY.get(id);

    await stub.fetch("http://internal/clear", { method: "POST" });

    return Response.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error("Delete conversation error:", error);
    return errorResponse(error instanceof Error ? error : String(error), 500);
  }
}
