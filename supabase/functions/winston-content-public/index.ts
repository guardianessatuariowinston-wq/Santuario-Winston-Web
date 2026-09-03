import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "public, max-age=60, s-maxage=300",
};
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: cors });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "GET") return json(405, { error: "Método no permitido" });

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return json(500, { error: "Configuración interna incompleta" });
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const now = new Date().toISOString();

  try {
    const [{ data: articles, error: articleError }, { data: redirects, error: redirectError }] = await Promise.all([
      admin
        .from("content_articles")
        .select("id,slug,kind,title,excerpt,body_markdown,category,author_name,published_at,featured_image_path,featured_image_alt,seo_title,seo_description,related_resident_slugs,is_featured,source_url,original_published_at,original_author_name,updated_at")
        .eq("status", "published")
        .lte("published_at", now)
        .order("published_at", { ascending: false }),
      admin
        .from("content_redirects")
        .select("from_path,to_path,status_code")
        .eq("active", true)
        .order("created_at", { ascending: true }),
    ]);
    if (articleError || redirectError) throw articleError || redirectError;
    return json(200, { generatedAt: now, articles: articles || [], redirects: redirects || [] });
  } catch (error) {
    console.error("winston-content-public", error instanceof Error ? error.message : "unknown");
    return json(500, { error: "No se pudo preparar el contenido público" });
  }
});
