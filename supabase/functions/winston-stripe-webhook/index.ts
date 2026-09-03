import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const encoder = new TextEncoder();
const jsonHeaders = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: jsonHeaders });

type JsonObject = Record<string, unknown>;

function object(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : {};
}

function text(value: unknown, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

function email(value: unknown) {
  return text(value, 254).toLowerCase();
}

function nested(root: JsonObject, ...keys: string[]) {
  let current: unknown = root;
  for (const key of keys) current = object(current)[key];
  return current;
}

function hex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqualHex(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function verifyStripeSignature(rawBody: string, signatureHeader: string, secret: string) {
  const parts = signatureHeader.split(",").map((part) => part.trim());
  const timestamp = Number(parts.find((part) => part.startsWith("t="))?.slice(2) || "");
  const signatures = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  if (!Number.isFinite(timestamp) || !signatures.length) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - timestamp) > 300) return false;
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}.${rawBody}`));
  const expected = hex(digest);
  return signatures.some((candidate) => timingSafeEqualHex(expected, candidate));
}

function subscriptionFromInvoice(invoice: JsonObject) {
  const direct = text(invoice.subscription, 255);
  if (direct) return direct;
  const parent = text(nested(invoice, "parent", "subscription_details", "subscription"), 255);
  if (parent) return parent;
  const lines = object(invoice.lines);
  const data = Array.isArray(lines.data) ? lines.data : [];
  for (const line of data) {
    const id = text(nested(object(line), "parent", "subscription_item_details", "subscription"), 255);
    if (id) return id;
  }
  return "";
}

function paymentIntentFromInvoice(invoice: JsonObject) {
  const direct = text(invoice.payment_intent, 255);
  if (direct) return direct;
  const payments = object(invoice.payments);
  const data = Array.isArray(payments.data) ? payments.data : [];
  for (const row of data) {
    const payment = object(object(row).payment);
    const id = text(payment.payment_intent || object(row).payment_intent, 255);
    if (id) return id;
  }
  return "";
}

async function ensurePerson(admin: ReturnType<typeof createClient>, session: JsonObject) {
  const metadata = object(session.metadata);
  const details = object(session.customer_details);
  const sponsorEmail = email(details.email || session.customer_email);
  if (!sponsorEmail) throw new Error("CHECKOUT_EMAIL_MISSING");
  const customerId = text(session.customer, 255) || null;
  const name = text(metadata.sponsor_name || details.name, 120) || "Padrino/a";
  const surnames = text(metadata.sponsor_surnames, 160) || null;
  const phone = text(metadata.sponsor_phone || details.phone, 60) || null;
  const country = text(metadata.sponsor_country || nested(details, "address", "country"), 80) || null;
  const privacyAcceptedAt = text(metadata.privacy_accepted_at, 80) || new Date().toISOString();
  const privacyVersion = text(metadata.privacy_version, 80) || "2026-09-03";
  const marketingOptIn = text(metadata.marketing_opt_in, 10) === "1";

  const { data: existing, error: findError } = await admin
    .from("sponsor_people")
    .select("id,name,surnames,email,phone,country,status,marketing_opt_in,stripe_customer_id")
    .ilike("email", sponsorEmail)
    .maybeSingle();
  if (findError) throw findError;

  const payload = {
    name,
    surnames,
    email: sponsorEmail,
    phone,
    country,
    marketing_opt_in: Boolean(existing?.marketing_opt_in || marketingOptIn),
    stripe_customer_id: existing?.stripe_customer_id || customerId,
    privacy_accepted_at: privacyAcceptedAt,
    privacy_version: privacyVersion,
    updated_at: new Date().toISOString(),
  };
  if (existing) {
    const { data, error } = await admin.from("sponsor_people").update(payload).eq("id", existing.id).select().single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await admin.from("sponsor_people").insert(payload).select().single();
  if (error) throw error;
  return data;
}

async function handleCheckoutCompleted(admin: ReturnType<typeof createClient>, session: JsonObject) {
  if (text(session.mode, 40) !== "subscription") return;
  const subscriptionId = text(session.subscription, 255);
  const checkoutId = text(session.id, 255);
  const metadata = object(session.metadata);
  const residentSlug = text(metadata.resident_slug, 120);
  if (!subscriptionId || !checkoutId || !residentSlug) throw new Error("CHECKOUT_METADATA_MISSING");

  const { data: resident, error: residentError } = await admin
    .from("sponsorship_residents")
    .select("resident_slug,display_name,minimum_amount_cent")
    .eq("resident_slug", residentSlug)
    .maybeSingle();
  if (residentError) throw residentError;
  if (!resident) throw new Error("RESIDENT_NOT_FOUND");

  const person = await ensurePerson(admin, session);
  const amount = Number(session.amount_total || 0);
  if (!Number.isInteger(amount) || amount < Number(resident.minimum_amount_cent || 1000)) throw new Error("CHECKOUT_AMOUNT_INVALID");

  const { data: existing, error: existingError } = await admin
    .from("sponsorships")
    .select("id,status")
    .eq("external_subscription_id", subscriptionId)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) {
    const { error } = await admin.from("sponsorships").update({ external_checkout_session_id: checkoutId, updated_at: new Date().toISOString() }).eq("id", existing.id);
    if (error) throw error;
    return;
  }

  const { error } = await admin.from("sponsorships").insert({
    sponsor_person_id: person.id,
    resident_slug: resident.resident_slug,
    resident_name_snapshot: resident.display_name,
    importe_cent: amount,
    currency: text(session.currency, 10) || "eur",
    cadence: "monthly",
    origin: "stripe",
    status: "pending",
    certificate_name: text(metadata.certificate_name, 180) || null,
    is_gift: false,
    started_at: new Date().toISOString(),
    external_subscription_id: subscriptionId,
    external_checkout_session_id: checkoutId,
    external_customer_id: text(session.customer, 255) || null,
  });
  if (error) throw error;
}

async function sponsorshipBySubscription(admin: ReturnType<typeof createClient>, subscriptionId: string) {
  if (!subscriptionId) throw new Error("SUBSCRIPTION_ID_MISSING");
  const { data, error } = await admin.from("sponsorships").select("*").eq("external_subscription_id", subscriptionId).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("DEPENDENCY_PENDING");
  return data;
}

async function handleInvoicePaid(admin: ReturnType<typeof createClient>, invoice: JsonObject) {
  const subscriptionId = subscriptionFromInvoice(invoice);
  const sponsorship = await sponsorshipBySubscription(admin, subscriptionId);
  const invoiceId = text(invoice.id, 255);
  const amount = Number(invoice.amount_paid || 0);
  if (!invoiceId || !Number.isInteger(amount) || amount <= 0) return;
  const paymentIntent = paymentIntentFromInvoice(invoice) || null;
  const paidAtSeconds = Number(invoice.status_transitions && object(invoice.status_transitions).paid_at || invoice.created || 0);
  const paidAt = paidAtSeconds > 0 ? new Date(paidAtSeconds * 1000).toISOString() : new Date().toISOString();

  const paymentPayload = {
    sponsorship_id: sponsorship.id,
    amount_cent: amount,
    currency: text(invoice.currency, 10) || "eur",
    status: "paid",
    provider: "stripe",
    external_payment_id: paymentIntent,
    external_invoice_id: invoiceId,
    paid_at: paidAt,
  };
  const { data: existingPayment, error: paymentFindError } = await admin.from("sponsor_payments").select("id").eq("external_invoice_id", invoiceId).maybeSingle();
  if (paymentFindError) throw paymentFindError;
  if (existingPayment) {
    const { error } = await admin.from("sponsor_payments").update(paymentPayload).eq("id", existingPayment.id);
    if (error) throw error;
  } else {
    const { error } = await admin.from("sponsor_payments").insert(paymentPayload);
    if (error) throw error;
  }

  const nextStatus = sponsorship.cancel_at_period_end ? "cancel_scheduled" : "active";
  const { error: sponsorError } = await admin.from("sponsorships").update({ status: nextStatus, updated_at: new Date().toISOString() }).eq("id", sponsorship.id);
  if (sponsorError) throw sponsorError;
  const { error: incidentError } = await admin.from("sponsor_incidents").update({ status: "resolved", resolved_at: new Date().toISOString() }).eq("sponsorship_id", sponsorship.id).eq("status", "open");
  if (incidentError) throw incidentError;
}

async function handleInvoiceFailed(admin: ReturnType<typeof createClient>, invoice: JsonObject) {
  const subscriptionId = subscriptionFromInvoice(invoice);
  const sponsorship = await sponsorshipBySubscription(admin, subscriptionId);
  const invoiceId = text(invoice.id, 255);
  if (!invoiceId) return;
  const amount = Number(invoice.amount_due || invoice.amount_remaining || 0);
  const paymentIntent = paymentIntentFromInvoice(invoice) || null;
  const { data: existingPayment, error: findError } = await admin.from("sponsor_payments").select("id").eq("external_invoice_id", invoiceId).maybeSingle();
  if (findError) throw findError;
  const payload = {
    sponsorship_id: sponsorship.id,
    amount_cent: Number.isInteger(amount) && amount > 0 ? amount : sponsorship.importe_cent,
    currency: text(invoice.currency, 10) || "eur",
    status: "failed",
    provider: "stripe",
    external_payment_id: paymentIntent,
    external_invoice_id: invoiceId,
  };
  if (existingPayment) {
    const { error } = await admin.from("sponsor_payments").update(payload).eq("id", existingPayment.id);
    if (error) throw error;
  } else {
    const { error } = await admin.from("sponsor_payments").insert(payload);
    if (error) throw error;
  }
  const { error: sponsorError } = await admin.from("sponsorships").update({ status: "payment_issue", updated_at: new Date().toISOString() }).eq("id", sponsorship.id);
  if (sponsorError) throw sponsorError;
  const { error: incidentError } = await admin.from("sponsor_incidents").upsert({
    sponsorship_id: sponsorship.id,
    incident_type: "payment_failed",
    status: "open",
    detail: "Stripe informó de un intento de cobro fallido.",
    external_reference: invoiceId,
    opened_at: new Date().toISOString(),
    resolved_at: null,
  }, { onConflict: "incident_type,external_reference" });
  if (incidentError) throw incidentError;
}

async function handleSubscriptionUpdated(admin: ReturnType<typeof createClient>, subscription: JsonObject) {
  const id = text(subscription.id, 255);
  if (!id) return;
  const { data: current, error } = await admin.from("sponsorships").select("id,status").eq("external_subscription_id", id).maybeSingle();
  if (error) throw error;
  if (!current) throw new Error("DEPENDENCY_PENDING");
  const stripeStatus = text(subscription.status, 60);
  const cancelAtPeriodEnd = subscription.cancel_at_period_end === true;
  let status = current.status;
  if (stripeStatus === "canceled") status = "cancelled";
  else if (cancelAtPeriodEnd) status = "cancel_scheduled";
  else if (["past_due", "unpaid", "incomplete_expired"].includes(stripeStatus)) status = "payment_issue";
  else if (["active", "trialing"].includes(stripeStatus) && current.status !== "payment_issue") status = "active";
  const { error: updateError } = await admin.from("sponsorships").update({ status, cancel_at_period_end: cancelAtPeriodEnd, updated_at: new Date().toISOString() }).eq("id", current.id);
  if (updateError) throw updateError;
}

async function handleSubscriptionDeleted(admin: ReturnType<typeof createClient>, subscription: JsonObject) {
  const id = text(subscription.id, 255);
  if (!id) return;
  const now = new Date().toISOString();
  const { error } = await admin.from("sponsorships").update({
    status: "cancelled",
    cancel_at_period_end: false,
    cancellation_effective_at: now,
    updated_at: now,
  }).eq("external_subscription_id", id);
  if (error) throw error;
}

async function handleChargeRefunded(admin: ReturnType<typeof createClient>, charge: JsonObject) {
  const paymentIntent = text(charge.payment_intent, 255);
  if (!paymentIntent) return;
  const { data: payment, error } = await admin.from("sponsor_payments").select("id,amount_cent").eq("external_payment_id", paymentIntent).maybeSingle();
  if (error) throw error;
  if (!payment) throw new Error("DEPENDENCY_PENDING");
  const refunded = Number(charge.amount_refunded || 0);
  const status = refunded >= Number(payment.amount_cent || 0) ? "refunded" : "paid";
  const { error: updateError } = await admin.from("sponsor_payments").update({ refunded_cent: Math.max(0, refunded), status }).eq("id", payment.id);
  if (updateError) throw updateError;
}

async function processEvent(admin: ReturnType<typeof createClient>, event: JsonObject) {
  const type = text(event.type, 120);
  const dataObject = object(nested(event, "data", "object"));
  if (type === "checkout.session.completed") return handleCheckoutCompleted(admin, dataObject);
  if (type === "invoice.paid") return handleInvoicePaid(admin, dataObject);
  if (type === "invoice.payment_failed") return handleInvoiceFailed(admin, dataObject);
  if (type === "customer.subscription.updated") return handleSubscriptionUpdated(admin, dataObject);
  if (type === "customer.subscription.deleted") return handleSubscriptionDeleted(admin, dataObject);
  if (type === "charge.refunded") return handleChargeRefunded(admin, dataObject);
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json(405, { error: "Método no permitido" });
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!webhookSecret || !url || !serviceKey) return json(503, { error: "Webhook no configurado" });

  const rawBody = await req.text();
  const signature = req.headers.get("Stripe-Signature") || "";
  if (!await verifyStripeSignature(rawBody, signature, webhookSecret)) return json(400, { error: "Firma no válida" });

  let event: JsonObject;
  try {
    event = object(JSON.parse(rawBody));
  } catch {
    return json(400, { error: "Evento no válido" });
  }
  const eventId = text(event.id, 255);
  const eventType = text(event.type, 120);
  if (!eventId || !eventType) return json(400, { error: "Evento incompleto" });

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: previous, error: previousError } = await admin.from("stripe_webhook_events").select("stripe_event_id,processed_at").eq("stripe_event_id", eventId).maybeSingle();
  if (previousError) return json(500, { error: "No se pudo registrar el evento" });
  if (previous?.processed_at) return json(200, { received: true, duplicate: true });
  if (!previous) {
    const created = Number(event.created || 0);
    const { error: insertError } = await admin.from("stripe_webhook_events").insert({
      stripe_event_id: eventId,
      event_type: eventType,
      stripe_created_at: created > 0 ? new Date(created * 1000).toISOString() : null,
    });
    if (insertError && insertError.code !== "23505") return json(500, { error: "No se pudo registrar el evento" });
  }

  try {
    await processEvent(admin, event);
    const { error } = await admin.from("stripe_webhook_events").update({ processed_at: new Date().toISOString(), processing_error: null }).eq("stripe_event_id", eventId);
    if (error) throw error;
    return json(200, { received: true });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    console.error("winston-stripe-webhook", eventType, code);
    await admin.from("stripe_webhook_events").update({ processing_error: code.slice(0, 500) }).eq("stripe_event_id", eventId);
    return json(code === "DEPENDENCY_PENDING" ? 500 : 500, { error: "Procesamiento pendiente de reintento" });
  }
});
