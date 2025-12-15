import { DurableObject } from "cloudflare:workers";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface ConversationState {
  messages: Message[];
  summary: string;
  messageCount: number;
}

export class ChatMemory extends DurableObject {
  async getState(): Promise<ConversationState> {
    const messages = (await this.ctx.storage.get<Message[]>("messages")) || [];
    const summary = (await this.ctx.storage.get<string>("summary")) || "";
    const messageCount = (await this.ctx.storage.get<number>("messageCount")) || 0;

    return { messages, summary, messageCount };
  }

  async addMessage(role: "user" | "assistant", content: string): Promise<void> {
    const state = await this.getState();
    
    const message: Message = {
      role,
      content,
      timestamp: Date.now(),
    };

    state.messages.push(message);
    state.messageCount += 1;

    // Keep only the last 20 messages to avoid memory bloat
    if (state.messages.length > 20) {
      state.messages = state.messages.slice(-20);
    }

    await this.ctx.storage.put("messages", state.messages);
    await this.ctx.storage.put("messageCount", state.messageCount);
  }

  async getMessages(): Promise<Message[]> {
    return (await this.ctx.storage.get<Message[]>("messages")) || [];
  }

  async getSummary(): Promise<string> {
    return (await this.ctx.storage.get<string>("summary")) || "";
  }

  async updateSummary(summary: string): Promise<void> {
    await this.ctx.storage.put("summary", summary);
  }

  async getMessageCount(): Promise<number> {
    return (await this.ctx.storage.get<number>("messageCount")) || 0;
  }

  async clear(): Promise<void> {
    await this.ctx.storage.deleteAll();
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (request.method === "POST" && path === "/add") {
        const { role, content } = await request.json() as { role: "user" | "assistant"; content: string };
        await this.addMessage(role, content);
        return Response.json({ success: true });
      }

      if (request.method === "GET" && path === "/messages") {
        const messages = await this.getMessages();
        return Response.json({ messages });
      }

      if (request.method === "GET" && path === "/state") {
        const state = await this.getState();
        return Response.json(state);
      }

      if (request.method === "POST" && path === "/summary") {
        const { summary } = await request.json() as { summary: string };
        await this.updateSummary(summary);
        return Response.json({ success: true });
      }

      if (request.method === "POST" && path === "/clear") {
        await this.clear();
        return Response.json({ success: true });
      }

      return new Response("Not Found", { status: 404 });
    } catch (error) {
      return Response.json({ error: String(error) }, { status: 500 });
    }
  }
}
