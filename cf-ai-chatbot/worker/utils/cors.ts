/**
 * CORS utilities for handling Cross-Origin Resource Sharing
 */

/**
 * Standard CORS headers to allow all origins
 */
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
};

/**
 * Handle CORS preflight OPTIONS requests
 * @returns Response with CORS headers
 */
export function handleCORS(): Response {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "https://kobeyoung.net",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

/**
 * Create a JSON error response with CORS headers
 * @param error - Error message or Error object
 * @param status - HTTP status code (default 500)
 * @returns Response with error JSON and CORS headers
 */
export function errorResponse(error: string | Error, status = 500): Response {
  return Response.json(
    { error: error instanceof Error ? error.message : error },
    {
      status,
      headers: corsHeaders,
    }
  );
}
