import { errorResponse } from "./cors";

/**
 * Extract and validate conversation ID from request URL
 */
export function getConversationId(request: Request): string | Response {
  const url = new URL(request.url);
  const conversationId = url.pathname.split("/").pop();

  if (!conversationId) {
    return errorResponse("Invalid conversation ID", 400);
  }

  return conversationId;
}

/**
 * Get Durable Object stub for a conversation
 */
export function getConversationStub(conversationId: string, env: Env) {
  const id = env.CHAT_MEMORY.idFromName(conversationId);
  return env.CHAT_MEMORY.get(id);
}