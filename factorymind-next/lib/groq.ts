/**
 * Groq helper. Called only where LLM adds value (reasoning summaries,
 * explanations). Numerical decisions stay deterministic. If GROQ_API_KEY
 * is missing, callers fall back to deterministic reasoning strings.
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export function isGroqEnabled(): boolean {
  return !!process.env.GROQ_API_KEY;
}

interface GroqOpts {
  system: string;
  user: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export async function groqReason(opts: GroqOpts): Promise<string | null> {
  if (!isGroqEnabled()) return null;
  const model = opts.model || process.env.GROQ_MODEL || "openai/gpt-oss-20b";
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), opts.timeoutMs || 6000);
  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: opts.system },
          { role: "user", content: opts.user },
        ],
        temperature: opts.temperature ?? 0.2,
        max_tokens: opts.maxTokens ?? 260,
      }),
    });
    clearTimeout(to);
    if (!res.ok) return null;
    const j = await res.json();
    return j?.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    clearTimeout(to);
    return null;
  }
}
