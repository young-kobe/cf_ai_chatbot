import { corsHeaders } from "./cors";

/**
 * Stream AI response using Server-Sent Events (SSE) protocol
 * Handles the complete lifecycle: streaming tokens, saving to storage, triggering workflows
 * 
 * @param aiResponse - The streaming response from Workers AI
 * @param stub - Durable Object stub for conversation storage
 * @param conversationId - Unique conversation identifier
 * @param userMessage - The user's message that triggered this response
 * @param state - Current conversation state (messages, summary, count)
 * @param env - Worker environment bindings
 * @param summarizeThreshold - Number of messages before triggering summarization
 * @returns Response with SSE stream
 */
export function streamAIResponse(
  aiResponse: any,
  stub: DurableObjectStub,
  conversationId: string,
  userMessage: string,
  state: { messages: Array<{ role: string; content: string }>; summary: string; messageCount: number },
  env: Env,
  summarizeThreshold: number
): Response {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  let fullResponse = "";

  // Start async streaming process
  (async () => {
    try {
      // Stream each token from AI
      for await (const chunk of aiResponse as AsyncIterable<{ response?: string }>) {
        if (chunk.response) {
          fullResponse += chunk.response;
          await writer.write(
            encoder.encode(`data: ${JSON.stringify({ token: chunk.response })}\n\n`)
          );
        }
      }

      // Save complete assistant response to Durable Object
      await stub.fetch("http://internal/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "assistant", content: fullResponse }),
      });

      // Check if we should trigger summarization workflow
      if ((state.messageCount + 2) % summarizeThreshold === 0) {
        await triggerSummarization(env, conversationId, state, userMessage, fullResponse);
      }

      // Send completion signal
      await writer.write(encoder.encode("data: [DONE]\n\n"));
      await writer.close();
    } catch (error) {
      // Send error through stream
      await writer.write(
        encoder.encode(`data: ${JSON.stringify({ error: String(error) })}\n\n`)
      );
      await writer.close();
    }
  })();

  // Return streaming response with proper headers
  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      ...corsHeaders,
    },
  });
}

/**
 * Trigger the summarization workflow for a conversation
 * 
 * @param env - Worker environment bindings
 * @param conversationId - Unique conversation identifier
 * @param state - Current conversation state
 * @param userMessage - Latest user message
 * @param aiResponse - Latest AI response
 */
async function triggerSummarization(
  env: Env,
  conversationId: string,
  state: { messages: Array<{ role: string; content: string }> },
  userMessage: string,
  aiResponse: string
): Promise<void> {
  const messagesForSummary = [
    ...state.messages,
    { role: "user", content: userMessage },
    { role: "assistant", content: aiResponse },
  ];

  await env.SUMMARIZE_WORKFLOW.create({
    params: {
      conversationId,
      messages: messagesForSummary,
    },
  });
}
