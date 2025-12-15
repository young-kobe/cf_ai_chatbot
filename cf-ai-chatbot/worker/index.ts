import { ChatMemory } from "./durable-objects/ChatMemory";
import { RateLimiter } from "./durable-objects/RateLimiter";
import { SummarizeConversation } from "./workflows/SummarizeConversation";
import { handleCORS, errorResponse } from "./utils/cors";
import { handleTranscribe } from "./handlers/transcribe";
import { handleChat } from "./handlers/chat";
import { handleGetConversation, handleDeleteConversation } from "./handlers/conversations";

export { ChatMemory, RateLimiter, SummarizeConversation };

// Trigger summarization workflow after this many messages
const SUMMARIZE_THRESHOLD = 10;

/**
 * Main Worker entry point - handles all HTTP requests
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return handleCORS();
    }

    try {
      // Route to appropriate handler
      if (url.pathname === "/api/transcribe" && request.method === "POST") {
        return handleTranscribe(request, env);
      }

      if (url.pathname === "/api/chat" && request.method === "POST") {
        return handleChat(request, env, SUMMARIZE_THRESHOLD);
      }

      if (url.pathname.startsWith("/api/conversations/") && request.method === "GET") {
        return handleGetConversation(request, env);
      }

      if (url.pathname.startsWith("/api/conversations/") && request.method === "DELETE") {
        return handleDeleteConversation(request, env);
      }

      return new Response(null, { status: 404 });
    } catch (error) {
      console.error("Worker error:", error);
      return errorResponse(error instanceof Error ? error : String(error), 500);
    }
  },
} satisfies ExportedHandler<Env>;

