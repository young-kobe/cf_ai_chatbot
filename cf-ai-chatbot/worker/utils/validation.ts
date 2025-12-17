/**
 * Input validation constants
 */
const MAX_MESSAGE_LENGTH = 4000; // ~1000 tokens
const MAX_CONVERSATION_ID_LENGTH = 100;
const CONVERSATION_ID_PATTERN = /^conv-\d+$/;

/**
 * Comprehensive prompt injection detection patterns
 * These patterns identify attempts to manipulate the AI's behavior
 */
const PROMPT_INJECTION_PATTERNS = [
  // System message injection (high risk)
  /<\|system\|>/i,
  /<\|assistant\|>/i,
  /<\|endoftext\|>/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  
  // Jailbreak attempts (high risk)
  /DAN\s+mode/i,
  /jailbreak/i,
];

/**
 * Validate and sanitize message input
 */
export function validateMessage(message: unknown): { 
  valid: boolean; 
  error?: string; 
  sanitized?: string;
  isSuspicious?: boolean;
  suspiciousPatterns?: string[];
} {
  // Type check
  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'Invalid message type' };
  }

  // Length check
  if (message.length > MAX_MESSAGE_LENGTH) {
    return { valid: false, error: `Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters.` };
  }

  // Empty check
  const trimmed = message.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }

  // Check for prompt injection patterns
  const suspiciousCheck = detectPromptInjection(trimmed);
  
  return { 
    valid: true, 
    sanitized: trimmed,
    isSuspicious: suspiciousCheck.detected,
    suspiciousPatterns: suspiciousCheck.patterns,
  };
}

/**
 * Validate conversation ID
 */
export function validateConversationId(conversationId: unknown): { valid: boolean; error?: string } {
  // Type check
  if (!conversationId || typeof conversationId !== 'string') {
    return { valid: false, error: 'Invalid conversationId type' };
  }

  // Length check
  if (conversationId.length > MAX_CONVERSATION_ID_LENGTH) {
    return { valid: false, error: 'Invalid conversationId length' };
  }

  // Format check (must match conv-{timestamp})
  if (!CONVERSATION_ID_PATTERN.test(conversationId)) {
    return { valid: false, error: 'Invalid conversationId format' };
  }

  return { valid: true };
}

/**
 * Detect prompt injection attempts
 * Returns detected status and matching pattern descriptions
 */
export function detectPromptInjection(text: string): { 
  detected: boolean; 
  patterns: string[];
} {
  const matchedPatterns: string[] = [];
  
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      // Extract a description from the pattern for logging
      const patternStr = pattern.toString();
      matchedPatterns.push(patternStr.slice(1, Math.min(50, patternStr.length - 1)));
    }
  }
  
  return {
    detected: matchedPatterns.length > 0,
    patterns: matchedPatterns,
  };
}

/**
 * Calculate suspicion score (0-100)
 * Higher score = more suspicious
 */
export function calculateSuspicionScore(text: string): number {
  const detectionResult = detectPromptInjection(text);
  
  if (!detectionResult.detected) {
    return 0;
  }
  
  // Only flag truly suspicious patterns
  let score = detectionResult.patterns.length * 50;
  
  // Cap at 100
  return Math.min(score, 100);
}

/**
 * Validate audio file upload
 */
export function validateAudioFile(audio: unknown, maxSizeMB = 10): { valid: boolean; error?: string } {
  if (!audio || !(audio instanceof Blob)) {
    return { valid: false, error: 'No valid audio file provided' };
  }

  const maxSize = maxSizeMB * 1024 * 1024; // Convert MB to bytes
  if (audio.size > maxSize) {
    return { valid: false, error: `Audio file too large. Maximum ${maxSizeMB}MB.` };
  }

  // Check MIME type
  const allowedTypes = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav'];
  if (!allowedTypes.includes(audio.type)) {
    return { valid: false, error: 'Invalid audio file type' };
  }

  return { valid: true };
}

/**
 * Sanitize conversation ID to prevent injection
 */
export function sanitizeConversationId(conversationId: string): string {
  // Remove any characters that aren't alphanumeric, dash, or underscore
  return conversationId.replace(/[^a-zA-Z0-9\-_]/g, '');
}

/**
 * Check if text contains excessive special characters (potential obfuscation)
 */
export function hasExcessiveSpecialChars(text: string): boolean {
  const specialCharCount = (text.match(/[^a-zA-Z0-9\s.,!?;:()\-'"]/g) || []).length;
  const ratio = specialCharCount / text.length;
  return ratio > 0.3; // More than 30% special characters
}

/**
 * Detect encoding attacks (e.g., base64, hex, unicode escapes)
 */
export function detectEncodingAttack(text: string): boolean {
  // Only detect obvious malicious encoding attempts
  const hexPattern = /(?:\\x[0-9a-fA-F]{2}){20,}/;
  if (hexPattern.test(text)) {
    return true;
  }
  
  const unicodePattern = /(?:\\u[0-9a-fA-F]{4}){20,}/;
  if (unicodePattern.test(text)) {
    return true;
  }
  
  return false;
}
