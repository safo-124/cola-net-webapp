/** Base URL for backend API calls.
 *  - Local dev: empty string (Next.js rewrites proxy to localhost:8000)
 *  - Vercel:    set NEXT_PUBLIC_API_URL to the backend URL (e.g. ngrok URL)
 */
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
