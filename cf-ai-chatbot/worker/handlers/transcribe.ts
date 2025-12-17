import { corsHeaders, errorResponse } from "../utils/cors";
import { checkRateLimit, rateLimitResponse } from "../utils/rateLimit";
import { validateAudioFile } from "../utils/validation";

/**
 * Handle audio transcription using Whisper AI
 * POST /api/transcribe
 * 
 * @param request - HTTP request with audio file in FormData
 * @param env - Worker environment bindings
 * @returns Response with transcription text
 */
export async function handleTranscribe(request: Request, env: Env): Promise<Response> {
  try {
    // Rate limiting check
    const { allowed, clientId } = await checkRateLimit(request, env);
    
    if (!allowed) {
      console.warn(`Rate limit exceeded for transcription from client: ${clientId}`);
      return rateLimitResponse(clientId);
    }

    const formData = await request.formData();
    const audio = formData.get("audio");

    // SECURITY: Validate audio file
    const audioValidation = validateAudioFile(audio, 10); // 10MB limit
    if (!audioValidation.valid) {
      console.error('Invalid audio file', {
        error: audioValidation.error,
        clientId,
        timestamp: new Date().toISOString(),
      });
      return errorResponse(audioValidation.error!, 400);
    }

    const audioBlob = audio as Blob;
    
    // Log successful transcription request
    console.info('Audio transcription request', {
      clientId,
      audioSize: audioBlob.size,
      audioType: audioBlob.type,
      timestamp: new Date().toISOString(),
    });

    const audioBuffer = await audioBlob.arrayBuffer();

    // Run Whisper AI transcription
    const response = await env.AI.run("@cf/openai/whisper", {
      audio: [...new Uint8Array(audioBuffer)],
    });

    return Response.json(
      {
        text: response.text || "",
        vtt: response.vtt || "",
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Transcription error:", error);
    return errorResponse(error instanceof Error ? error : String(error), 500);
  }
}
