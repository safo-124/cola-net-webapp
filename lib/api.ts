/** Base URL for backend API calls.
 *  - Local dev: empty string (Next.js rewrites proxy to localhost:8000)
 *  - Vercel:    set NEXT_PUBLIC_API_URL to the backend URL (e.g. ngrok URL)
 */
export const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\n/g, "").trim();

/** Extra headers needed when calling through ngrok (skip browser warning) */
export const apiHeaders: Record<string, string> = API_BASE.includes("ngrok")
  ? { "ngrok-skip-browser-warning": "true" }
  : {};
