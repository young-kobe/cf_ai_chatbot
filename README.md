# cf_ai_chatbot

Production AI chatbot built on Cloudflare's edge platform with voice transcription, persistent memory, and automatic conversation summarization.

## Features

- Real-time chat with Llama 3.3 70B (streaming responses)
- Voice input via Whisper AI transcription
- Persistent conversation memory (Durable Objects)
- Automatic summarization every 10 messages (Workflows)
- Rate limiting per IP (Durable Objects)
- Input validation and prompt injection detection
- React frontend with TypeScript

## Architecture

```
Frontend (React)
    ↓
Worker (API Routes)
    ├── /api/chat → Llama 3.3 (streaming)
    ├── /api/transcribe → Whisper AI
    └── /api/conversations/:id → State management
    ↓
├── Durable Objects
│   ├── ChatMemory (conversation state)
│   └── RateLimiter (IP-based limits)
├── Workflows
│   └── SummarizeConversation (every 10 messages)
└── Workers AI
    ├── Llama 3.3 70B
    └── Whisper
```

## Tech Stack

**Frontend:** React 19, TypeScript, Vite  
**Backend:** Cloudflare Workers  
**AI:** Llama 3.3 70B, Whisper (Workers AI)  
**State:** Durable Objects (ChatMemory, RateLimiter)  
**Coordination:** Workflows (SummarizeConversation)  
**Security:** Input validation, rate limiting, prompt injection detection  
**Deployment:** Cloudflare Pages

## Local Development

```bash
npm install
npx wrangler login
npm run dev
```

Open http://localhost:5173

## Deployment

```bash
npm run deploy
```

Access at your Cloudflare Pages URL (shown after deployment)

## Project Structure

```
cf-ai-chatbot/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API communication
│   └── types/             # TypeScript definitions
├── worker/                # Cloudflare Worker
│   ├── handlers/          # API route handlers
│   ├── utils/             # Utilities (CORS, streaming, validation, prompts)
│   ├── prompts/           # System prompts (markdown)
│   ├── durable-objects/   # ChatMemory, RateLimiter
│   └── workflows/         # SummarizeConversation
└── wrangler.jsonc         # Cloudflare configuration
```

## Security

- Input validation with 80+ prompt injection patterns
- Rate limiting: 10/min, 100/hour, 500/day per IP
- CORS configuration (update in worker/utils/cors.ts for production)
- Structured logging to Cloudflare dashboard

See SECURITY_AUDIT.md and SECURITY_IMPLEMENTATION.md for details.

## Documentation

- **README.md** - This file
- **PROMPTS.md** - Development prompts
- **ARCHITECTURE.md** - Frontend architecture
- **PROMPTS_ARCHITECTURE.md** - System prompts management
- **SECURITY_AUDIT.md** - Security assessment
- **SECURITY_IMPLEMENTATION.md** - Security setup guide

## License

MIT
