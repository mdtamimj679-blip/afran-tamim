import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
  "Vary": "Origin",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

const allowedModels = new Set([
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.5-flash",
]);

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const legacyAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  let anonKey = legacyAnonKey || "";
  if (!anonKey) {
    try {
      const publishableKeys = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}");
      anonKey = publishableKeys.default || "";
    } catch {
      anonKey = "";
    }
  }

  if (!apiKey) return json({ error: "Gemini is not configured. Add GEMINI_API_KEY to Supabase Edge Function secrets." }, 503);
  if (!supabaseUrl || !anonKey) return json({ error: "Supabase authentication is not configured for this function." }, 503);

  const authorization = request.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return json({ error: "Sign in as the website owner to use Gemini." }, 401);

  try {
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return json({ error: "Your session is invalid or expired. Sign in again." }, 401);

    const { data: isAdmin, error: adminError } = await supabase.rpc("is_site_admin");
    if (adminError || isAdmin !== true) return json({ error: "This account is not authorized to use the owner AI assistant." }, 403);

    let body: { message?: unknown; model?: unknown };
    try {
      body = await request.json();
    } catch {
      return json({ error: "Request body must be valid JSON." }, 400);
    }

    const message = typeof body.message === "string" ? body.message.trim() : "";
    const model = typeof body.model === "string" && allowedModels.has(body.model)
      ? body.model
      : "gemini-3.8-flash";

    if (!message || message.length > 6000) {
      return json({ error: "Enter a message between 1 and 6,000 characters." }, 400);
    }

    const upstream = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        model,
        input: message,
        system_instruction: "You are the private AI assistant inside the AFRAN TAMIM Portfolio owner control panel. Help the authenticated website owner with website content, editing, planning, troubleshooting, and general questions. Be accurate, concise, and clearly state uncertainty. Do not claim to have changed website files or settings; you can only provide guidance.",
        store: false,
      }),
      signal: AbortSignal.timeout(45000),
    });

    const result = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const providerMessage = typeof result?.error?.message === "string" ? result.error.message : "Gemini provider request failed.";
      return json({ error: providerMessage.slice(0, 500) }, 502);
    }

    const text = Array.isArray(result?.steps)
      ? result.steps
          .filter((step: { type?: string }) => step?.type === "model_output")
          .flatMap((step: { content?: Array<{ type?: string; text?: string }> }) => Array.isArray(step.content) ? step.content : [])
          .filter((part: { type?: string; text?: string }) => part?.type === "text" && typeof part.text === "string")
          .map((part: { text: string }) => part.text)
          .join("\n")
      : "";

    if (!text) return json({ error: "Gemini returned no text. Please try again." }, 502);
    return json({ reply: text, model });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected AI service error.";
    return json({ error: message.includes("timed out") ? "Gemini request timed out. Please try again." : "The AI service is temporarily unavailable. Please try again." }, 502);
  }
});
