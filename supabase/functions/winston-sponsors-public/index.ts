import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const allowedOrigins = new Set([
  "https://santuariowinston.org",
  "https://www.santuariowinston.org",
  "https://guardianessantuariowinston-wq.github.io",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
]);

function corsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowed = allowedOrigins.has(origin) ? origin : "https://santuariowinston.org";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "content-type, apikey, x-client-info",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  };
}

const json = (req: Request, status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders(req) });

function cleanText(value: unknown, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

function cleanEmail(value: unknown) {
  return cleanText(value, 254).toLowerCase();
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validSlug(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

function centAmount(value: unknown) {
  const amount = Number(value);
  return Number.isInteger(amount) ? amount : NaN;
}

function appendMetadata(params: URLSearchParams, key: string, value: unknown) {
  const clean = cleanText(value, 450);
  if (clean) params.set(`metadata[${key}]`, clean);
}

function appendSubscriptionMetadata(params: URLSearchParams, key: string, value: unknown) {
  const clean = cleanText(value, 450);
  if (clean) params.set(`subscription_data[metadata][${key}]`, clean);
}

async function createStripeCheckout(input: {
  residentSlug: string;
  residentName: string;
  amountCent: number;
  email: string;
  name: string;
  surnames: string;
  phone: string;
  country: string;
  certificateName: string;
  marketingOptIn: boolean;
  privacyAcceptedAt: string;
}) {
  const secret = Deno.env.get("STRIPE_SECRET_KEY");
  if (!secret) throw new Error("STRIPE_NOT_CONFIGURED");

  const siteUrl = (Deno.env.get("WINSTON_SITE_URL") || "https://santuariowinston.org").replace(/\/$/, "");
  const params = new URLSearchParams();
  params.set("mode", "subscription");
  params.set("locale", "es");
  params.set("customer_email", input.email);
  params.set("success_url", `${siteUrl}/apadrina.html?checkout=success&session_id={CHECKOUT_SESSION_ID}`);
  params.set("cancel_url", `${siteUrl}/apadrina.html?checkout=cancelled&habitante=${encodeURIComponent(input.residentSlug)}`);
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", "eur");
  params.set("line_items[0][price_data][unit_amount]", String(input.amountCent));
  params.set("line_items[0][price_data][recurring][interval]", "month");
  params.set("line_items[0][price_data][product_data][name]", `Apadrinamiento de ${input.residentName}`);
  params.set("line_items[0][price_data][product_data][description]", "Aportación mensual al Santuario Winston vinculada al habitante elegido, sin exclusividad ni propiedad sobre el animal.");

  const shared = {
    resident_slug: input.residentSlug,
    resident_name: input.residentName,
    sponsor_name: input.name,
    sponsor_surnames: input.surnames,
    sponsor_phone: input.phone,
    sponsor_country: input.country,
    certificate_name: input.certificateName,
    marketing_opt_in: input.marketingOptIn ? "1" : "0",
    privacy_accepted_at: input.privacyAcceptedAt,
    privacy_version: "2026-09-03",
  };
  for (const [key, value] of Object.entries(shared)) {
    appendMetadata(params, key, value);
    appendSubscriptionMetadata(params, key, value);
  }

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    console.error("stripe checkout", response.status, cleanText((payload as { error?: { type?: string } })?.error?.type, 120));
    throw new Error("STRIPE_CHECKOUT_FAILED");
  }
  const url = cleanText(payload.url, 2000);
  const id = cleanText(payload.id, 255);
  if (!url || !id) throw new Error("STRIPE_CHECKOUT_FAILED");
  return { url, id };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (!new Set(["GET", "POST"]).has(req.method)) return json(req, 405, { error: "Método no permitido" });

  const origin = req.headers.get("Origin");
  if (origin && !allowedOrigins.has(origin)) return json(req, 403, { error: "Origen no permitido" });

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return json(req, 500, { error: "Configuración interna incompleta" });
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  try {
    if (req.method === "GET") {
      const { data: residents, error } = await admin
        .from("sponsorship_residents")
        .select("resident_slug,display_name,minimum_amount_cent,suggested_amounts_cent,allow_custom_amount,show_sponsor_count,public_message")
        .eq("enabled", true)
        .order("display_name", { ascending: true });
      if (error) throw error;

      const rows = residents || [];
      const countable = rows.filter((row) => row.show_sponsor_count).map((row) => row.resident_slug);
      const counts = new Map<string, number>();
      if (countable.length) {
        const { data: sponsorships, error: sponsorshipError } = await admin
          .from("sponsorships")
          .select("resident_slug")
          .in("resident_slug", countable)
          .in("status", ["active", "cancel_scheduled"]);
        if (sponsorshipError) throw sponsorshipError;
        for (const row of sponsorships || []) counts.set(row.resident_slug, (counts.get(row.resident_slug) || 0) + 1);
      }

      return json(req, 200, {
        billingReady: Boolean(Deno.env.get("STRIPE_SECRET_KEY")),
        residents: rows.map((row) => ({
          residentSlug: row.resident_slug,
          displayName: row.display_name,
          minimumAmountCent: row.minimum_amount_cent,
          suggestedAmountsCent: row.suggested_amounts_cent,
          allowCustomAmount: row.allow_custom_amount,
          publicMessage: row.public_message,
          sponsorCount: row.show_sponsor_count ? (counts.get(row.resident_slug) || 0) : null,
        })),
      });
    }

    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      return json(req, 400, { error: "Petición no válida" });
    }
    if (cleanText(body.action, 40) !== "checkout") return json(req, 400, { error: "Acción no válida" });
    if (body.privacyAccepted !== true) return json(req, 400, { error: "Debes aceptar la información de privacidad" });

    const residentSlug = cleanText(body.residentSlug, 120);
    const amountCent = centAmount(body.amountCent);
    const email = cleanEmail(body.email);
    const name = cleanText(body.name, 120);
    if (!validSlug(residentSlug) || !Number.isInteger(amountCent) || !validEmail(email) || !name) {
      return json(req, 400, { error: "Revisa los datos del apadrinamiento" });
    }

    const { data: resident, error: residentError } = await admin
      .from("sponsorship_residents")
      .select("resident_slug,display_name,enabled,minimum_amount_cent,suggested_amounts_cent,allow_custom_amount")
      .eq("resident_slug", residentSlug)
      .eq("enabled", true)
      .maybeSingle();
    if (residentError) throw residentError;
    if (!resident) return json(req, 404, { error: "Este habitante no está disponible para apadrinamiento online" });
    if (amountCent < Number(resident.minimum_amount_cent || 1000)) return json(req, 400, { error: "El importe es inferior al mínimo configurado" });
    const suggested = Array.isArray(resident.suggested_amounts_cent) ? resident.suggested_amounts_cent.map(Number) : [];
    if (!resident.allow_custom_amount && !suggested.includes(amountCent)) return json(req, 400, { error: "Selecciona uno de los importes disponibles" });

    const checkout = await createStripeCheckout({
      residentSlug,
      residentName: resident.display_name,
      amountCent,
      email,
      name,
      surnames: cleanText(body.surnames, 160),
      phone: cleanText(body.phone, 60),
      country: cleanText(body.country, 80),
      certificateName: cleanText(body.certificateName, 180),
      marketingOptIn: body.marketingOptIn === true,
      privacyAcceptedAt: new Date().toISOString(),
    });
    return json(req, 200, checkout);
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    console.error("winston-sponsors-public", code);
    if (code === "STRIPE_NOT_CONFIGURED") return json(req, 503, { error: "El pago online todavía no está activado" });
    if (code === "STRIPE_CHECKOUT_FAILED") return json(req, 502, { error: "No se pudo iniciar el pago seguro" });
    return json(req, 500, { error: "No se pudo completar la operación" });
  }
});
