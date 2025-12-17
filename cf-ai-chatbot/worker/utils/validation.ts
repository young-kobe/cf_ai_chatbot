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
  // Direct instruction override attempts
  /ignore\s+(previous|all|the|above|prior)\s+(instructions?|prompts?|commands?|rules?)/i,
  /disregard\s+(previous|all|the|above|prior)\s+(instructions?|prompts?|commands?|rules?)/i,
  /forget\s+(previous|all|the|above|prior)\s+(instructions?|prompts?|commands?|rules?)/i,
  /override\s+(previous|all|the|above|system)\s+(instructions?|prompts?|commands?|rules?)/i,
  
  // Role manipulation
  /you\s+are\s+now\s+(a|an|the)/i,
  /act\s+as\s+(if\s+you\s+are|a|an|the)/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /roleplay\s+as/i,
  /simulate\s+(being|a|an)/i,
  
  // System message injection
  /\[?\s*system\s*\]?:/i,
  /\[?\s*assistant\s*\]?:/i,
  /\[?\s*user\s*\]?:/i,
  /<\|system\|>/i,
  /<\|assistant\|>/i,
  /<\|user\|>/i,
  
  // Context reset attempts
  /reset\s+(your|the)\s+(context|memory|instructions?|conversation)/i,
  /start\s+(over|again|from\s+scratch)/i,
  /new\s+(conversation|session|context)/i,
  /clear\s+(your|the)\s+(memory|context|history)/i,
  
  // Instruction revelation attempts
  /show\s+(me\s+)?(your|the)\s+(system\s+)?(prompt|instructions?|rules?)/i,
  /what\s+(are|is)\s+(your|the)\s+(system\s+)?(prompt|instructions?|rules?)/i,
  /reveal\s+(your|the)\s+(system\s+)?(prompt|instructions?|rules?)/i,
  /tell\s+me\s+(your|the)\s+(system\s+)?(prompt|instructions?|rules?)/i,
  /repeat\s+(your|the)\s+(system\s+)?(prompt|instructions?|above)/i,
  /print\s+(your|the)\s+(system\s+)?(prompt|instructions?|above)/i,
  
  // Delimiter and escape attempts
  /"""\s*\n/,
  /---\s*\n/,
  /\*\*\*\s*\n/,
  /###\s*system/i,
  /```\s*system/i,
  
  // Chain-of-thought hijacking
  /let's\s+think\s+step\s+by\s+step.*?(ignore|disregard|forget)/is,
  /before\s+we\s+(begin|start|continue).*?(ignore|disregard)/is,
  
  // Privilege escalation attempts
  /you\s+have\s+(admin|root|elevated|sudo|full)\s+(access|privileges?|rights?|permissions?)/i,
  /enable\s+(developer|debug|admin)\s+mode/i,
  /with\s+(admin|root|elevated)\s+(access|privileges?|mode)/i,
  
  // Output format manipulation
  /respond\s+in\s+(json|xml|yaml|csv|sql)/i,
  /output\s+(only|just|raw)\s+(code|data|sql)/i,
  /format\s+(your\s+)?response\s+as\s+(json|xml|sql|code)/i,
  
  // Jailbreak attempts
  /do\s+anything\s+now/i,
  /DAN\s+mode/i,
  /jailbreak/i,
  /hypothetically/i,
  /in\s+a\s+fictional\s+(world|scenario|universe)/i,
  
  // Nested instruction attempts
  /if\s+the\s+user\s+says.*?(ignore|disregard)/is,
  /when\s+(asked|told).*?(ignore|disregard|override)/is,
  
  // Token manipulation
  /\+\s*token/i,
  /special\s+token/i,
  /<\|endoftext\|>/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  
  // API key and secret exposure attempts
  /api[_\s-]?key/i,
  /api[_\s-]?secret/i,
  /access[_\s-]?token/i,
  /secret[_\s-]?key/i,
  /private[_\s-]?key/i,
  /auth[_\s-]?token/i,
  /bearer\s+[a-zA-Z0-9\-._~+/]+=*/i,
  /sk-[a-zA-Z0-9]{20,}/i, // OpenAI-style keys
  /pk-[a-zA-Z0-9]{20,}/i,
  /[a-zA-Z0-9]{32,}/i, // Long alphanumeric strings (potential keys)
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
  
  // Base score per pattern matched
  let score = detectionResult.patterns.length * 25;
  
  // Additional factors
  const lowerText = text.toLowerCase();
  
  // Multiple injection keywords
  const injectionKeywords = ['ignore', 'disregard', 'system', 'prompt', 'instructions'];
  const keywordCount = injectionKeywords.filter(kw => lowerText.includes(kw)).length;
  score += keywordCount * 5;
  
  // Unusual formatting (multiple delimiters)
  const delimiterCount = (text.match(/---|"""|```|\*\*\*/g) || []).length;
  if (delimiterCount > 2) {
    score += 20;
  }
  
  // Multiple role markers
  const roleMarkers = (text.match(/\[?(system|user|assistant)\]?:/gi) || []).length;
  score += roleMarkers * 15;
  
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
  // Base64 patterns
  const base64Pattern = /^[A-Za-z0-9+/]{20,}={0,2}$/;
  if (base64Pattern.test(text.replace(/\s/g, ''))) {
    return true;
  }
  
  // Hex encoding patterns
  const hexPattern = /(?:\\x[0-9a-fA-F]{2}){10,}/;
  if (hexPattern.test(text)) {
    return true;
  }
  
  // Unicode escape patterns
  const unicodePattern = /(?:\\u[0-9a-fA-F]{4}){10,}/;
  if (unicodePattern.test(text)) {
    return true;
  }
  
  return false;
}
