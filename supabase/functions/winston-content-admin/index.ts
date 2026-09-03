import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

const allowedRoles = new Set(["technical", "admin"]);
const kinds = new Set(["blog", "aprende", "historias"]);
const states = new Set(["draft", "published", "scheduled", "hidden"]);
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: cors });

function bearerToken(req: Request) {
  const header = req.headers.get("Authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

function cleanText(value: unknown, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

function cleanBody(value: unknown) {
  return String(value ?? "").replace(/\u0000/g, "").slice(0, 120000);
}

function validSlug(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function contentPath(kind: string, slug: string) {
  return `/${kind}/${slug}/`;
}

function cleanResidentSlugs(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => cleanText(item, 120)).filter(validSlug))].slice(0, 20);
}

async function audit(admin: ReturnType<typeof createClient>, actorUserId: string, action: string, articleId: string | null, beforeData: unknown, afterData: unknown) {
  const { error } = await admin.from("content_audit_log").insert({
    actor_user_id: actorUserId,
    action,
    article_id: articleId,
    before_data: beforeData,
    after_data: afterData,
  });
  if (error) throw error;
}

async function triggerDeploy(reason: string) {
  const hook = Deno.env.get("WINSTON_DEPLOY_HOOK_URL");
  if (!hook) return { configured: false, triggered: false };
  const response = await fetch(hook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source: "winston-content-admin", reason }),
  }).catch(() => null);
  return { configured: true, triggered: Boolean(response?.ok) };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "Método no permitido" });

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return json(500, { error: "Configuración interna incompleta" });

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const token = bearerToken(req);
  if (!token) return json(401, { error: "No autorizado" });

  const { data: authData, error: authError } = await admin.auth.getUser(token);
  if (authError || !authData.user) return json(401, { error: "Sesión no válida" });

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id,display_name,username,role,active")
    .eq("id", authData.user.id)
    .maybeSingle();
  if (profileError || !profile || !profile.active || !allowedRoles.has(String(profile.role))) {
    return json(403, { error: "Sin acceso a Contenido" });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Petición no válida" });
  }
  const action = cleanText(body.action, 80);

  try {
    if (action === "dashboard") {
      const { data, error } = await admin.from("content_articles").select("id,kind,status,published_at,updated_at");
      if (error) throw error;
      const rows = data || [];
      return json(200, {
        profile: { displayName: profile.display_name, username: profile.username, role: profile.role },
        counts: {
          total: rows.length,
          published: rows.filter((row) => row.status === "published").length,
          drafts: rows.filter((row) => row.status === "draft").length,
          scheduled: rows.filter((row) => row.status === "scheduled").length,
          blog: rows.filter((row) => row.kind === "blog").length,
          aprende: rows.filter((row) => row.kind === "aprende").length,
          historias: rows.filter((row) => row.kind === "historias").length,
        },
        autoPublishConfigured: Boolean(Deno.env.get("WINSTON_DEPLOY_HOOK_URL")),
      });
    }

    if (action === "articles") {
      const { data, error } = await admin
        .from("content_articles")
        .select("id,slug,kind,title,excerpt,category,author_name,status,published_at,scheduled_at,featured_image_path,featured_image_alt,seo_title,seo_description,related_resident_slugs,is_featured,source_url,original_published_at,original_author_name,review_note,created_at,updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return json(200, { articles: data || [] });
    }

    if (action === "article") {
      const id = cleanText(body.id, 80);
      if (!id) return json(400, { error: "Artículo no válido" });
      const { data, error } = await admin.from("content_articles").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) return json(404, { error: "Artículo no encontrado" });
      return json(200, { article: data });
    }

    if (action === "redirects") {
      const { data, error } = await admin.from("content_redirects").select("id,from_path,to_path,status_code,active,created_at").order("created_at", { ascending: false });
      if (error) throw error;
      return json(200, { redirects: data || [] });
    }

    if (action === "save_article") {
      const id = cleanText(body.id, 80) || null;
      const slug = cleanText(body.slug, 180).toLowerCase();
      const kind = cleanText(body.kind, 30);
      const title = cleanText(body.title, 180);
      const status = cleanText(body.status, 30) || "draft";
      if (!validSlug(slug) || !kinds.has(kind) || !title || !states.has(status)) return json(400, { error: "Revisa título, URL, sección y estado" });

      let before: Record<string, unknown> | null = null;
      if (id) {
        const { data, error } = await admin.from("content_articles").select("*").eq("id", id).maybeSingle();
        if (error) throw error;
        if (!data) return json(404, { error: "Artículo no encontrado" });
        before = data;
      }

      let publishedAt = cleanText(body.publishedAt, 80) || null;
      const scheduledAt = cleanText(body.scheduledAt, 80) || null;
      if (status === "published" && !publishedAt) publishedAt = new Date().toISOString();

      const payload = {
        slug,
        kind,
        title,
        excerpt: cleanText(body.excerpt, 500),
        body_markdown: cleanBody(body.bodyMarkdown),
        category: cleanText(body.category, 120) || null,
        author_name: cleanText(body.authorName, 160) || "Santuario Winston",
        status,
        published_at: publishedAt,
        scheduled_at: status === "scheduled" ? scheduledAt : null,
        featured_image_path: cleanText(body.featuredImagePath, 500) || null,
        featured_image_alt: cleanText(body.featuredImageAlt, 250) || null,
        seo_title: cleanText(body.seoTitle, 180) || null,
        seo_description: cleanText(body.seoDescription, 320) || null,
        related_resident_slugs: cleanResidentSlugs(body.relatedResidentSlugs),
        is_featured: body.isFeatured === true,
        source_url: cleanText(body.sourceUrl, 1000) || null,
        original_published_at: cleanText(body.originalPublishedAt, 80) || null,
        original_author_name: cleanText(body.originalAuthorName, 160) || null,
        review_note: cleanText(body.reviewNote, 2000) || null,
        updated_at: new Date().toISOString(),
      };

      let saved;
      if (id) {
        const { data, error } = await admin.from("content_articles").update(payload).eq("id", id).select().single();
        if (error) throw error;
        saved = data;
      } else {
        const { data, error } = await admin.from("content_articles").insert(payload).select().single();
        if (error) {
          if (String(error.code) === "23505") return json(409, { error: "Ya existe un artículo con esa URL" });
          throw error;
        }
        saved = data;
      }

      if (before && (before.slug !== slug || before.kind !== kind) && before.status === "published") {
        const fromPath = contentPath(String(before.kind), String(before.slug));
        const toPath = contentPath(kind, slug);
        const { error } = await admin.from("content_redirects").upsert({ from_path: fromPath, to_path: toPath, status_code: 301, active: true }, { onConflict: "from_path" });
        if (error) throw error;
      }

      await audit(admin, authData.user.id, id ? "CONTENT_ARTICLE_UPDATED" : "CONTENT_ARTICLE_CREATED", saved.id, before, saved);
      const deploy = status === "published" || before?.status === "published" ? await triggerDeploy(`article:${saved.id}`) : { configured: Boolean(Deno.env.get("WINSTON_DEPLOY_HOOK_URL")), triggered: false };
      return json(200, { article: saved, deploy });
    }

    if (action === "delete_article") {
      const id = cleanText(body.id, 80);
      if (!id) return json(400, { error: "Artículo no válido" });
      const { data: before, error: beforeError } = await admin.from("content_articles").select("*").eq("id", id).maybeSingle();
      if (beforeError) throw beforeError;
      if (!before) return json(404, { error: "Artículo no encontrado" });
      const { data, error } = await admin.from("content_articles").update({ status: "hidden", is_featured: false, updated_at: new Date().toISOString() }).eq("id", id).select().single();
      if (error) throw error;
      await audit(admin, authData.user.id, "CONTENT_ARTICLE_HIDDEN", id, before, data);
      const deploy = before.status === "published" ? await triggerDeploy(`article-hidden:${id}`) : { configured: Boolean(Deno.env.get("WINSTON_DEPLOY_HOOK_URL")), triggered: false };
      return json(200, { article: data, deploy });
    }

    return json(400, { error: "Acción no válida" });
  } catch (error) {
    const code = error instanceof Error ? error.message : "unknown";
    console.error("winston-content-admin", code);
    return json(500, { error: "No se pudo completar la operación de contenido" });
  }
});
