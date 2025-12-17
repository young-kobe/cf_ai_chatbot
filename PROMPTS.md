# Development Prompts

This document contains prompts used during development of cf_ai_chatbot.

## Initial Setup

```
Build a Cloudflare AI chatbot with:
- Llama 3.3 on Workers AI
- Workflows for coordination
- Chat and voice input (Whisper transcription)
- Durable Objects for memory/state
- Deploy on Cloudflare Pages
- Repo must start with cf_ai_
```

## Worker Modularization

```
Refactor worker/index.ts (217 lines monolithic) into modular structure:

worker/
├── index.ts (routing only, <50 lines)
├── handlers/
│   ├── chat.ts
│   ├── transcribe.ts
│   └── conversations.ts
└── utils/
    ├── cors.ts
    └── streaming.ts

Requirements:
- Each handler accepts (request, env, ...config)
- Returns Promise<Response>
- Preserve all existing behavior
- Keep type safety
```

## Frontend Modularization

```
Refactor App.tsx (270 lines) into modular components:

src/
├── components/
│   ├── ChatHeader.tsx
│   ├── ChatFooter.tsx
│   ├── ChatInput.tsx
│   └── MessageList.tsx
├── hooks/
│   ├── useChat.ts
│   └── useAudioRecorder.ts
├── services/
│   └── chatApi.ts
└── types/
    └── message.ts

Requirements:
- Separation of concerns
- Reusable components
- Custom hooks for logic
- Type-safe
```

## Security Implementation

```
Scan project for security vulnerabilities before deployment.
Focus on: CORS, input validation, rate limiting, prompt injection.
```

```
Create comprehensive input validation:
- Message validation (length, format)
- Conversation ID validation
- Audio file validation
- Prompt injection detection (80+ patterns)
- Suspicion scoring (0-100)
- No logging (handled by Cloudflare)
```

```
Add security logging to Cloudflare Analytics using suspicion score:
- Log validation errors
- Track suspicious inputs with score
- Include client metadata (IP, country, user agent)
- Risk-based actions (reject score >80, warn >50)
- No emojis in logs
```

## System Prompts Management

```
Create centralized system prompts directory:
- Store all LLM instructions in markdown format
- Refactor hardcoded prompts to use centralized directory
- Use worker/prompts/ for markdown files
- Import directly via Vite's ?raw suffix
```

## Documentation Updates

```
Update and refactor README.md, PROMPTS.md, ARCHITECTURE.md:
- Be concise and clear
- Remove bloat
- No emojis
- Update architecture with new flow
- Only include user prompts (not AI responses)
```
