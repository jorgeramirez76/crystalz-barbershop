/**
 * CRYSTALZ — Booking endpoint (Cloudflare Worker).
 *
 * Deploys to Cloudflare Workers free tier. Receives a POST from the booking form,
 * sends:
 *   1. SMS via Twilio to the OWNER (Leo, +1-908-259-1151) and the BOOKED BARBER
 *   2. SMS via Twilio to the CUSTOMER (confirmation)
 *   3. Email + .ics calendar invite to the customer (via Resend or SendGrid)
 *   4. Email notification to the OWNER
 *
 * Env vars needed (set in Cloudflare dashboard or wrangler.toml):
 *   TWILIO_ACCOUNT_SID    — from twilio.com/console
 *   TWILIO_AUTH_TOKEN     — from twilio.com/console
 *   TWILIO_FROM_NUMBER    — your purchased Twilio number (e.g. +12015551234)
 *   OWNER_PHONE           — +19082591151 (Leo)
 *   OWNER_EMAIL           — leo's email (optional — for email notification)
 *   RESEND_API_KEY        — from resend.com (free tier: 100 emails/day)
 *   FROM_EMAIL            — verified sender, e.g. bookings@crystalzbarbershop.com
 *
 * Barber phone numbers (hardcoded below — update with real numbers when Jorge has them):
 *   leo, joel, mauricio, chino91, miguel-eliza, miguel-po
 *
 * Deploy:
 *   npm install -g wrangler
 *   wrangler login
 *   cd api/
 *   wrangler deploy booking-worker.js --name crystalz-booking
 *   # Copy resulting URL into js/main.js BOOKING_ENDPOINT
 */

// HARDCODE-LATER: replace placeholders with real numbers when shop provides them
const BARBER_PHONES = {
  "leo":           "+19082591151",        // owner — same as RP shop number
  "joel":          "+19082591151",        // PLACEHOLDER — replace with real
  "mauricio":      "+19082591151",        // PLACEHOLDER
  "chino91":       "+19082591151",        // PLACEHOLDER
  "miguel-eliza":  "+19082591151",        // PLACEHOLDER
  "miguel-po":     "+19083516040"         // Elizabeth shop number
};

const ALLOWED_ORIGINS = [
  "https://thejorgeramirezgroup.com",
  "https://crystalzbarbershop.com",
  "https://crystalz-barbershop.pages.dev",
  "http://localhost:8000",
  "http://127.0.0.1:8000"
];

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const corsHeaders = {
      "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

    let payload;
    try { payload = await request.json(); }
    catch { return new Response("Invalid JSON", { status: 400, headers: corsHeaders }); }

    // basic validation
    const required = ["name", "phone", "email", "barber", "service", "date", "time", "location", "barberName", "serviceName", "locationLabel"];
    for (const k of required) {
      if (!payload[k]) return new Response(`Missing field: ${k}`, { status: 400, headers: corsHeaders });
    }

    // Build appointment metadata
    const apptStart = new Date(`${payload.date}T${payload.time}:00`);
    const apptEnd = new Date(apptStart.getTime() + 45 * 60 * 1000); // assume 45 min slot
    const dateText = apptStart.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    const customerPhoneE164 = normalizePhone(payload.phone);
    const barberPhone = BARBER_PHONES[payload.barber] || env.OWNER_PHONE;

    // SMS messages
    const ownerMsg = `🪒 NEW BOOKING — ${dateText}\n${payload.locationLabel}\nBarber: ${payload.barberName}\nClient: ${payload.name} · ${payload.phone}\nService: ${payload.serviceName} (${payload.servicePrice})\n${payload.notes ? "Notes: " + payload.notes : ""}`;
    const barberMsg = `🪒 NEW APPT (${payload.barberName}) — ${dateText}\nClient: ${payload.name} · ${payload.phone}\nService: ${payload.serviceName}\n${payload.notes ? "Notes: " + payload.notes : ""}`;
    const customerMsg = `Crystalz Barbershop — your appointment is confirmed.\n${dateText}\n${payload.barberName} · ${payload.serviceName}\n${payload.locationAddress}\n\nReschedule: ${payload.locationPhone}`;

    // Send SMS via Twilio (parallel)
    const smsResults = await Promise.allSettled([
      env.TWILIO_ACCOUNT_SID ? sendSMS(env, env.OWNER_PHONE, ownerMsg) : Promise.reject("Twilio not configured"),
      env.TWILIO_ACCOUNT_SID && barberPhone !== env.OWNER_PHONE ? sendSMS(env, barberPhone, barberMsg) : Promise.resolve(null),
      env.TWILIO_ACCOUNT_SID ? sendSMS(env, customerPhoneE164, customerMsg) : Promise.reject("Twilio not configured"),
    ]);

    // Calendar .ics
    const ics = buildIcs({
      summary: `Crystalz · ${payload.serviceName} with ${payload.barberName}`,
      description: `${payload.serviceName} (${payload.servicePrice})\n${payload.locationLabel}\n${payload.locationAddress}\nPhone: ${payload.locationPhone}${payload.notes ? "\n\nNotes: " + payload.notes : ""}`,
      location: `${payload.locationLabel}, ${payload.locationAddress}`,
      start: apptStart,
      end: apptEnd,
      url: payload.siteUrl
    });

    // Email customer + owner with .ics (parallel)
    const emailResults = await Promise.allSettled([
      env.RESEND_API_KEY ? sendEmail(env, payload.email, "Your Crystalz appointment is confirmed", customerEmailHtml(payload, dateText), ics) : Promise.reject("Resend not configured"),
      env.RESEND_API_KEY && env.OWNER_EMAIL ? sendEmail(env, env.OWNER_EMAIL, `New booking — ${payload.barberName} · ${dateText}`, ownerEmailHtml(payload, dateText), ics) : Promise.resolve(null),
    ]);

    return new Response(JSON.stringify({
      ok: true,
      sms: smsResults.map(r => r.status),
      email: emailResults.map(r => r.status),
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
};

// ─── Twilio ──────────────────────────────────────────────────
async function sendSMS(env, to, body) {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM_NUMBER) {
    throw new Error("Twilio env vars missing");
  }
  const url = `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`);
  const params = new URLSearchParams({ From: env.TWILIO_FROM_NUMBER, To: to, Body: body });
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });
  if (!r.ok) throw new Error(`Twilio: ${r.status} ${await r.text()}`);
  return r.json();
}

// ─── Resend (email) ───────────────────────────────────────────
async function sendEmail(env, to, subject, html, icsBody) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: env.FROM_EMAIL || "bookings@crystalzbarbershop.com",
      to,
      subject,
      html,
      attachments: icsBody ? [{
        filename: "appointment.ics",
        content: btoa(unescape(encodeURIComponent(icsBody)))
      }] : undefined
    })
  });
  if (!r.ok) throw new Error(`Resend: ${r.status} ${await r.text()}`);
  return r.json();
}

// ─── ICS calendar generation ─────────────────────────────────
function buildIcs({ summary, description, location, start, end, url }) {
  const dt = d => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = s => (s || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Crystalz Barbershop//Booking//EN",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@crystalzbarbershop`,
    `DTSTAMP:${dt(new Date())}`,
    `DTSTART:${dt(start)}`,
    `DTEND:${dt(end)}`,
    `SUMMARY:${esc(summary)}`,
    `DESCRIPTION:${esc(description)}`,
    `LOCATION:${esc(location)}`,
    url ? `URL:${url}` : "",
    "END:VEVENT",
    "END:VCALENDAR"
  ].filter(Boolean).join("\r\n");
}

// ─── Email templates ─────────────────────────────────────────
function customerEmailHtml(p, dateText) {
  return `
<!DOCTYPE html><html><body style="margin:0;background:#0A0A0A;color:#F5EFE0;font-family:-apple-system,system-ui,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:48px 32px;">
  <h1 style="font-family:Georgia,serif;font-weight:800;color:#C9A961;letter-spacing:6px;">CRYSTALZ</h1>
  <p style="color:#BDB7A8;letter-spacing:3px;font-size:11px;text-transform:uppercase;">Appointment Confirmed</p>
  <h2 style="font-family:Georgia,serif;font-size:28px;color:#F5EFE0;margin:24px 0 8px;">${dateText}</h2>
  <p style="color:#BDB7A8;font-size:16px;line-height:1.7;">
    <strong style="color:#C9A961;">${p.barberName}</strong> · ${p.serviceName}<br>
    ${p.locationLabel}<br>
    ${p.locationAddress}<br>
    ${p.locationPhone}
  </p>
  ${p.notes ? `<p style="color:#BDB7A8;border-left:2px solid #C9A961;padding-left:16px;font-style:italic;">"${p.notes}"</p>` : ""}
  <p style="margin-top:32px;color:#BDB7A8;font-size:14px;">
    The calendar invite is attached. To reschedule or cancel, call ${p.locationPhone}.
  </p>
  <p style="margin-top:48px;color:#5A554B;font-size:12px;">© Crystalz Barbershop · Roselle Park & Elizabeth, NJ</p>
</div></body></html>`;
}
function ownerEmailHtml(p, dateText) {
  return `
<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;">
<h2>New Booking — ${dateText}</h2>
<p><strong>Barber:</strong> ${p.barberName}<br>
<strong>Location:</strong> ${p.locationLabel}<br>
<strong>Service:</strong> ${p.serviceName} (${p.servicePrice})<br>
<strong>Client:</strong> ${p.name}<br>
<strong>Phone:</strong> ${p.phone}<br>
<strong>Email:</strong> ${p.email}<br>
${p.notes ? `<strong>Notes:</strong> ${p.notes}` : ""}</p>
<p>Calendar invite attached.</p>
</body></html>`;
}

// ─── Phone normalization ─────────────────────────────────────
function normalizePhone(raw) {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return raw.startsWith("+") ? raw : `+${digits}`;
}
