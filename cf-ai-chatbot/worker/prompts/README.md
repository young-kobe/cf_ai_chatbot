# System Prompts

This directory contains all LLM system instruction prompts used throughout the application.

## Structure

Each prompt is stored as a separate Markdown file and imported directly into the application via `worker/utils/prompts.ts`.

### Available Prompts

- **`assistant.md`** - Main chatbot assistant system prompt
  - Used in: `worker/handlers/chat.ts`
  - Purpose: Defines the AI assistant's personality and behavior
  - Function: `getAssistantPrompt(summary?: string)`

- **`summarizer.md`** - Conversation summarization prompt
  - Used in: `worker/workflows/SummarizeConversation.ts`
  - Purpose: Generates concise summaries of conversations
  - Function: `getSummarizerPrompt()`

## How It Works

Markdown files are imported as raw strings using Vite's `?raw` import suffix:

```typescript
// worker/utils/prompts.ts
import assistantPrompt from '../prompts/assistant.md?raw';
import summarizerPrompt from '../prompts/summarizer.md?raw';
```

This approach allows:
- ✅ Single source of truth (markdown files)
- ✅ No duplication between docs and code
- ✅ Direct editing of prompts without touching TypeScript
- ✅ Automatic bundling at build time

## Usage

Prompts are loaded via the prompt loader utility:

```typescript
import { getAssistantPrompt, getSummarizerPrompt } from '../utils/prompts';

// Get assistant prompt (with optional conversation context)
const systemPrompt = getAssistantPrompt();
const systemPromptWithContext = getAssistantPrompt(conversationSummary);

// Get summarizer prompt
const summarizerPrompt = getSummarizerPrompt();
```

## Editing Prompts

1. Edit the markdown file in this directory
2. Changes are automatically picked up on next build
3. Test changes locally with `npm run dev`
4. Deploy with `npm run deploy`

**No need to update TypeScript files** - the markdown files are the source of truth!

## Best Practices

- Keep prompts clear and concise
- Use markdown formatting for structure
- Include guidelines and constraints
- Version control all changes
- Test prompt modifications thoroughly

## Security Considerations

- Prompts should not contain sensitive information
- Include instructions to refuse harmful requests
- Emphasize privacy and ethical behavior
- Regular review for potential vulnerabilities
