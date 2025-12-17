/**
 * System Prompts Loader
 * 
 * Centralized management of LLM system instruction prompts.
 * Prompts are imported directly from markdown files in the prompts/ directory.
 */

import assistantPrompt from '../prompts/assistant.md?raw';
import summarizerPrompt from '../prompts/summarizer.md?raw';

/**
 * Available system prompts
 */
const PROMPTS = {
  assistant: assistantPrompt,
  summarizer: summarizerPrompt,
} as const;

export type PromptName = keyof typeof PROMPTS;

/**
 * Get a system prompt by name
 * 
 * @param name - The name of the prompt to retrieve
 * @returns The prompt content as a string
 * 
 * @example
 * ```typescript
 * const systemPrompt = getPrompt('assistant');
 * const summaryPrompt = getPrompt('summarizer');
 * ```
 */
export function getPrompt(name: PromptName): string {
  return PROMPTS[name];
}

/**
 * Get the assistant system prompt with optional conversation context
 * 
 * @param summary - Optional conversation summary to include in the prompt
 * @returns System prompt with context
 * 
 * @example
 * ```typescript
 * const prompt = getAssistantPrompt();
 * const promptWithContext = getAssistantPrompt("Previous discussion about TypeScript...");
 * ```
 */
export function getAssistantPrompt(summary?: string): string {
  const basePrompt = getPrompt('assistant');
  
  if (summary) {
    return `${basePrompt}\n\n## Conversation Context\n\nPrevious conversation summary: ${summary}`;
  }
  
  return basePrompt;
}

/**
 * Get the summarizer system prompt
 * 
 * @returns Summarization system prompt
 */
export function getSummarizerPrompt(): string {
  return getPrompt('summarizer');
}
