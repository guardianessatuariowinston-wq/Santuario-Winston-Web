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
const sponsorshipStates = new Set(["pending", "active", "payment_issue", "cancel_scheduled", "cancelled"]);
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: cors });

function bearerToken(req: Request) {
  const header = req.headers.get("Authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

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

function amountCent(value: unknown) {
  const n = Number(value);
  return Number.isInteger(n) ? n : NaN;
}

async function stripePost(path: string, values: Record<string, string>) {
  const secret = Deno.env.get("STRIPE_SECRET_KEY");
  if (!secret) throw new Error("STRIPE_NOT_CONFIGURED");
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) params.set(key, value);
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    console.error("winston-sponsors-admin stripe", response.status, String((payload as { error?: { type?: string } })?.error?.type || "stripe_error"));
    throw new Error("STRIPE_REQUEST_FAILED");
  }
  return payload;
}

async function audit(admin: ReturnType<typeof createClient>, actorUserId: string, action: string, entityType: string, entityId: string, beforeData: unknown = null, afterData: unknown = null) {
  const { error } = await admin.from("sponsor_audit_log").insert({
    actor_user_id: actorUserId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    before_data: beforeData,
    after_data: afterData,
  });
  if (error) throw error;
}

async function ensureSponsorPerson(admin: ReturnType<typeof createClient>, input: Record<string, unknown>) {
  const email = cleanEmail(input.email);
  const name = cleanText(input.name, 120);
  if (!name || !validEmail(email)) throw new Error("SPONSOR_INVALID");

  const { data: existing, error: findError } = await admin
    .from("sponsor_people")
    .select("id,name,surnames,email,phone,country,status,marketing_opt_in,notes,created_at,updated_at")
    .eq("email", email)
    .maybeSingle();
  if (findError) throw findError;

  const personPayload = {
    name,
    surnames: cleanText(input.surnames, 160) || null,
    email,
    phone: cleanText(input.phone, 60) || null,
    country: cleanText(input.country, 80) || null,
    marketing_opt_in: Boolean(existing?.marketing_opt_in || input.marketingOptIn),
    notes: cleanText(input.personNotes, 1000) || null,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { data, error } = await admin
      .from("sponsor_people")
      .update(personPayload)
      .eq("id", existing.id)
      .select("id,name,surnames,email,phone,country,status,marketing_opt_in,notes,created_at,updated_at")
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await admin
    .from("sponsor_people")
    .insert(personPayload)
    .select("id,name,surnames,email,phone,country,status,marketing_opt_in,notes,created_at,updated_at")
    .single();
  if (error) throw error;
  return data;
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
    return json(403, { error: "Sin acceso a Padrinos" });
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
      const [peopleRes, sponsorshipsRes, incidentsRes, residentsRes] = await Promise.all([
        admin.from("sponsor_people").select("id", { count: "exact", head: true }).eq("status", "active"),
        admin.from("sponsorships").select("id,importe_cent,status,origin").in("status", ["active", "payment_issue", "cancel_scheduled"]),
        admin.from("sponsor_incidents").select("id", { count: "exact", head: true }).eq("status", "open"),
        admin.from("sponsorship_residents").select("resident_slug", { count: "exact", head: true }).eq("enabled", true),
      ]);
      if (peopleRes.error || sponsorshipsRes.error || incidentsRes.error || residentsRes.error) throw new Error("dashboard query failed");
      const activeRows = (sponsorshipsRes.data || []).filter((row) => row.status === "active" || row.status === "cancel_scheduled");
      return json(200, {
        profile: { displayName: profile.display_name, username: profile.username, role: profile.role },
        counts: {
          people: peopleRes.count || 0,
          activeSponsorships: activeRows.length,
          monthlyCent: activeRows.reduce((sum, row) => sum + Number(row.importe_cent || 0), 0),
          paymentIssues: (sponsorshipsRes.data || []).filter((row) => row.status === "payment_issue").length,
          openIncidents: incidentsRes.count || 0,
          enabledResidents: residentsRes.count || 0,
          manual: (sponsorshipsRes.data || []).filter((row) => row.origin === "manual").length,
          stripe: (sponsorshipsRes.data || []).filter((row) => row.origin === "stripe").length,
        },
        billingReady: Boolean(Deno.env.get("STRIPE_SECRET_KEY") && Deno.env.get("STRIPE_WEBHOOK_SECRET")),
        billingMode: Deno.env.get("STRIPE_SECRET_KEY")?.startsWith("sk_live_") ? "live" : (Deno.env.get("STRIPE_SECRET_KEY") ? "test" : "not_configured"),
      });
    }

    if (action === "sponsors") {
      const { data, error } = await admin
        .from("sponsor_people")
        .select("id,name,surnames,email,phone,country,status,marketing_opt_in,notes,created_at,updated_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return json(200, { sponsors: data || [] });
    }

    if (action === "sponsorships") {
      const requestedStatus = cleanText(body.status, 40);
      if (requestedStatus && !sponsorshipStates.has(requestedStatus)) return json(400, { error: "Estado no válido" });
      let query = admin
        .from("sponsorships")
        .select("id,sponsor_person_id,resident_slug,resident_name_snapshot,importe_cent,currency,cadence,origin,status,certificate_name,is_gift,started_at,cancellation_requested_at,cancellation_effective_at,cancellation_reason,created_at,updated_at,sponsor_people(name,surnames,email,phone)")
        .order("created_at", { ascending: false });
      if (requestedStatus) query = query.eq("status", requestedStatus);
      const { data, error } = await query;
      if (error) throw error;
      return json(200, { sponsorships: data || [] });
    }

    if (action === "payments") {
      const { data, error } = await admin
        .from("sponsor_payments")
        .select("id,sponsorship_id,amount_cent,currency,status,provider,external_payment_id,external_invoice_id,refunded_cent,paid_at,created_at,sponsorships(id,resident_slug,resident_name_snapshot,status,origin,sponsor_people(name,surnames,email))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return json(200, { payments: data || [] });
    }

    if (action === "incidents") {
      const { data, error } = await admin
        .from("sponsor_incidents")
        .select("id,sponsorship_id,incident_type,status,detail,external_reference,opened_at,resolved_at,sponsorships(id,resident_name_snapshot,status,sponsor_people(name,surnames,email))")
        .order("opened_at", { ascending: false });
      if (error) throw error;
      return json(200, { incidents: data || [] });
    }

    if (action === "schedule_stripe_cancellation") {
      const id = cleanText(body.id, 80);
      if (!id) return json(400, { error: "Apadrinamiento no válido" });
      const { data: before, error: beforeError } = await admin.from("sponsorships").select("*").eq("id", id).maybeSingle();
      if (beforeError) throw beforeError;
      if (!before) return json(404, { error: "Apadrinamiento no encontrado" });
      if (before.origin !== "stripe" || !before.external_subscription_id) return json(409, { error: "Este apadrinamiento no tiene una suscripción Stripe gestionable" });
      if (before.status === "cancelled") return json(409, { error: "El apadrinamiento ya está cancelado" });
      await stripePost(`subscriptions/${encodeURIComponent(before.external_subscription_id)}`, { cancel_at_period_end: "true" });
      const now = new Date().toISOString();
      const { data, error } = await admin.from("sponsorships").update({
        status: "cancel_scheduled",
        cancel_at_period_end: true,
        cancellation_requested_at: now,
        cancellation_reason: cleanText(body.reason, 500) || "Baja programada desde Administración",
        updated_at: now,
      }).eq("id", id).select().single();
      if (error) throw error;
      await audit(admin, authData.user.id, "STRIPE_CANCELLATION_SCHEDULED", "sponsorship", id, before, data);
      return json(200, { sponsorship: data });
    }

    if (action === "refund_stripe_payment") {
      const id = cleanText(body.id, 80);
      if (!id) return json(400, { error: "Pago no válido" });
      const { data: payment, error: paymentError } = await admin.from("sponsor_payments").select("*").eq("id", id).maybeSingle();
      if (paymentError) throw paymentError;
      if (!payment) return json(404, { error: "Pago no encontrado" });
      if (payment.provider !== "stripe" || !payment.external_payment_id) return json(409, { error: "Este pago no se puede reembolsar automáticamente" });
      const remaining = Number(payment.amount_cent || 0) - Number(payment.refunded_cent || 0);
      const requested = body.amountCent == null || body.amountCent === "" ? remaining : amountCent(body.amountCent);
      if (!Number.isInteger(requested) || requested <= 0 || requested > remaining) return json(400, { error: "Importe de reembolso no válido" });
      const refund = await stripePost("refunds", { payment_intent: payment.external_payment_id, amount: String(requested) });
      await audit(admin, authData.user.id, "STRIPE_REFUND_REQUESTED", "payment", id, payment, { refund_id: refund.id, amount_cent: requested });
      return json(202, { refund: { id: refund.id, status: refund.status, amountCent: requested } });
    }

    if (action === "resident_settings") {
      const { data, error } = await admin
        .from("sponsorship_residents")
        .select("resident_slug,display_name,enabled,minimum_amount_cent,suggested_amounts_cent,allow_custom_amount,show_sponsor_count,public_message,updated_at")
        .order("display_name", { ascending: true });
      if (error) throw error;
      return json(200, { residents: data || [] });
    }

    if (action === "save_resident_setting") {
      const slug = cleanText(body.residentSlug, 120);
      const displayName = cleanText(body.displayName, 120);
      const minimum = amountCent(body.minimumAmountCent);
      const suggested = Array.isArray(body.suggestedAmountsCent)
        ? body.suggestedAmountsCent.map(amountCent).filter(Number.isInteger)
        : [1000, 1500, 2500];
      if (!validSlug(slug) || !displayName || !Number.isInteger(minimum) || minimum < 1000) {
        return json(400, { error: "Configuración de habitante no válida" });
      }
      if (!suggested.length || suggested.length > 6 || suggested.some((value) => value < 1000)) {
        return json(400, { error: "Importes sugeridos no válidos" });
      }

      const { data: before } = await admin.from("sponsorship_residents").select("*").eq("resident_slug", slug).maybeSingle();
      const payload = {
        resident_slug: slug,
        display_name: displayName,
        enabled: Boolean(body.enabled),
        minimum_amount_cent: minimum,
        suggested_amounts_cent: suggested,
        allow_custom_amount: Boolean(body.allowCustomAmount),
        show_sponsor_count: Boolean(body.showSponsorCount),
        public_message: cleanText(body.publicMessage, 1200) || null,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await admin.from("sponsorship_residents").upsert(payload, { onConflict: "resident_slug" }).select().single();
      if (error) throw error;
      await audit(admin, authData.user.id, "SPONSOR_RESIDENT_SETTING_SAVED", "resident", slug, before, data);
      return json(200, { resident: data });
    }

    if (action === "create_manual_sponsorship") {
      const residentSlug = cleanText(body.residentSlug, 120);
      const residentName = cleanText(body.residentName, 120);
      const amount = amountCent(body.amountCent);
      if (!validSlug(residentSlug) || !residentName || !Number.isInteger(amount) || amount < 1000) {
        return json(400, { error: "Datos de apadrinamiento no válidos" });
      }

      const person = await ensureSponsorPerson(admin, body);
      const { data: resident, error: residentError } = await admin
        .from("sponsorship_residents")
        .upsert({
          resident_slug: residentSlug,
          display_name: residentName,
          updated_at: new Date().toISOString(),
        }, { onConflict: "resident_slug", ignoreDuplicates: false })
        .select("resident_slug,display_name,enabled,minimum_amount_cent")
        .single();
      if (residentError) throw residentError;
      if (amount < Number(resident.minimum_amount_cent || 1000)) return json(400, { error: "El importe es inferior al mínimo configurado" });

      const startedAt = body.startedAt ? new Date(String(body.startedAt)) : new Date();
      if (Number.isNaN(startedAt.getTime())) return json(400, { error: "Fecha de inicio no válida" });

      const payload = {
        sponsor_person_id: person.id,
        resident_slug: residentSlug,
        resident_name_snapshot: resident.display_name,
        importe_cent: amount,
        origin: "manual",
        status: "active",
        certificate_name: cleanText(body.certificateName, 180) || null,
        is_gift: Boolean(body.isGift),
        started_at: startedAt.toISOString(),
      };
      const { data, error } = await admin.from("sponsorships").insert(payload).select().single();
      if (error) throw error;
      await audit(admin, authData.user.id, "MANUAL_SPONSORSHIP_CREATED", "sponsorship", data.id, null, data);
      return json(201, { sponsorship: data, person });
    }

    if (action === "cancel_manual_sponsorship") {
      const id = cleanText(body.id, 80);
      if (!id) return json(400, { error: "Apadrinamiento no válido" });
      const { data: before, error: beforeError } = await admin.from("sponsorships").select("*").eq("id", id).maybeSingle();
      if (beforeError) throw beforeError;
      if (!before) return json(404, { error: "Apadrinamiento no encontrado" });
      if (before.origin !== "manual") return json(409, { error: "Las suscripciones Stripe se cancelarán desde el flujo de pagos" });
      if (before.status === "cancelled") return json(200, { sponsorship: before });

      const now = new Date().toISOString();
      const { data, error } = await admin
        .from("sponsorships")
        .update({
          status: "cancelled",
          cancellation_requested_at: now,
          cancellation_effective_at: now,
          cancellation_reason: cleanText(body.reason, 500) || null,
          updated_at: now,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      await audit(admin, authData.user.id, "MANUAL_SPONSORSHIP_CANCELLED", "sponsorship", id, before, data);
      return json(200, { sponsorship: data });
    }

    return json(400, { error: "Acción no válida" });
  } catch (error) {
    console.error("winston-sponsors-admin", error instanceof Error ? error.message : "unknown error");
    if (error instanceof Error && error.message === "SPONSOR_INVALID") return json(400, { error: "Datos del padrino no válidos" });
    if (error instanceof Error && error.message === "STRIPE_NOT_CONFIGURED") return json(503, { error: "Stripe todavía no está configurado" });
    if (error instanceof Error && error.message === "STRIPE_REQUEST_FAILED") return json(502, { error: "Stripe no pudo completar la operación" });
    return json(500, { error: "No se pudo completar la operación" });
  }
});
