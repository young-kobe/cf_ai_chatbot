import { WorkflowEntrypoint, WorkflowStep, type WorkflowEvent } from "cloudflare:workers";

interface SummarizeParams {
  conversationId: string;
  messages: Array<{ role: string; content: string }>;
}

export class SummarizeConversation extends WorkflowEntrypoint<Env, SummarizeParams> {
  async run(event: WorkflowEvent<SummarizeParams>, step: WorkflowStep) {
    const { conversationId, messages } = event.payload;

    // Step 1: Generate conversation summary using Llama 3.3
    const summary = await step.do("generate summary", async () => {
      const conversationText = messages
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n");

      const response = await this.env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that creates concise summaries of conversations. Summarize the key points and context in 2-3 sentences.",
          },
          {
            role: "user",
            content: `Summarize this conversation:\n\n${conversationText}`,
          },
        ],
        max_tokens: 256,
      }) as { response: string };

      return response.response || "Summary generation failed.";
    });

    // Step 2: Store the summary in the Durable Object
    await step.do("store summary", async () => {
      const id = this.env.CHAT_MEMORY.idFromName(conversationId);
      const stub = this.env.CHAT_MEMORY.get(id);
      
      await stub.fetch("http://internal/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary }),
      });

      return { success: true };
    });

    // Step 3: (Optional) Generate embeddings for retrieval memory
    // Uncomment when Vectorize is configured
    /*
    await step.do("generate embeddings", async () => {
      const embedding = await this.env.AI.run("@cf/baai/bge-base-en-v1.5", {
        text: summary,
      });

      // Store in Vectorize
      // await this.env.VECTORIZE.insert([{
      //   id: conversationId,
      //   values: embedding.data[0],
      //   metadata: { summary, timestamp: Date.now() }
      // }]);

      return { embedded: true };
    });
    */

    return {
      conversationId,
      summary,
      completedAt: new Date().toISOString(),
    };
  }
}
