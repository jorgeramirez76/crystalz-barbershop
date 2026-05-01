# Twilio + Booking Backend Setup

The booking form is built. The frontend POSTs to a Cloudflare Worker that sends:
- SMS to the owner (Leo)
- SMS to the booked barber
- SMS confirmation to the customer
- Email + calendar invite (.ics) to the customer
- Email notification to the owner

This doc walks you through enabling all of that.

## Prereqs

- A computer with `node` + `npm` (you already have this)
- A debit/credit card (Twilio + Resend both have free tiers but require a payment method on file)

## 1. Sign up for Twilio (~10 min)

1. Go to **https://www.twilio.com/try-twilio** and create an account.
2. Verify your phone number (they text you a code).
3. From the dashboard, **buy a phone number** (~$2/mo for a NJ number, or $1.15/mo for a long code in any state).
4. **A2P 10DLC registration** — required for sending SMS to US numbers. From the Twilio console: Messaging → Compliance → "Register your brand and campaign."
   - Brand registration: $4 one-time
   - Standard Campaign: $10/mo
   - Approval takes 1-3 business days
5. Once approved, copy three values:
   - `Account SID` (from the dashboard top-right)
   - `Auth Token` (same place, reveal it)
   - `Twilio phone number` (the one you bought, in E.164 format, e.g. `+12015551234`)

## 2. Sign up for Resend (~3 min)

Used for the calendar invite email. **Free tier: 100 emails/day.**

1. Go to **https://resend.com/signup**.
2. Add a domain — **`crystalzbarbershop.com`** if you've registered it, otherwise use a sub of your existing domain.
3. Add the DNS records they give you (4 TXT/MX records). Verification takes ~5 min.
4. Create an API key. Copy it.

## 3. Deploy the Cloudflare Worker (~10 min)

The worker code is at `api/booking-worker.js`.

1. Sign up at **https://workers.cloudflare.com** (free tier — 100k requests/day).
2. Install the CLI:
   ```bash
   npm install -g wrangler
   wrangler login
   ```
3. Create a `wrangler.toml` in `api/` with:
   ```toml
   name = "crystalz-booking"
   main = "booking-worker.js"
   compatibility_date = "2026-01-01"
   ```
4. Deploy:
   ```bash
   cd api/
   wrangler deploy
   ```
   You'll get a URL like `https://crystalz-booking.YOUR_USERNAME.workers.dev`.

5. **Set the env vars** (Cloudflare dashboard → Workers → crystalz-booking → Settings → Variables → "Add variable" for each):

   | Variable | Value |
   |---|---|
   | `TWILIO_ACCOUNT_SID` | from Twilio |
   | `TWILIO_AUTH_TOKEN` | from Twilio (mark as "secret") |
   | `TWILIO_FROM_NUMBER` | your Twilio number, e.g. `+12015551234` |
   | `OWNER_PHONE` | `+19082591151` (Leo's shop / cell — change to his real cell) |
   | `OWNER_EMAIL` | Leo's email |
   | `RESEND_API_KEY` | from Resend (mark as "secret") |
   | `FROM_EMAIL` | `bookings@crystalzbarbershop.com` (or whatever you verified in Resend) |

6. **Update the frontend** to point at the deployed Worker. Edit `js/main.js`:
   ```javascript
   const BOOKING_ENDPOINT = 'https://crystalz-booking.YOUR_USERNAME.workers.dev';
   ```

## 4. Update barber phone numbers

Edit `api/booking-worker.js` lines 32-39 — replace the placeholder `+19082591151` with each barber's real cell:

```javascript
const BARBER_PHONES = {
  "leo":           "+1908XXXXXXX",
  "joel":          "+1908XXXXXXX",
  "mauricio":      "+1908XXXXXXX",
  "chino91":       "+1908XXXXXXX",
  "miguel-eliza":  "+1908XXXXXXX",
  "miguel-po":     "+1908XXXXXXX"
};
```
Then redeploy: `wrangler deploy`.

## 5. Test

1. Open the live site
2. Click "Book Now" → fill out the form → submit
3. Check that SMS arrives at owner phone, barber phone, and your test customer phone
4. Check that the email + .ics arrived
5. If anything's missing, check **Cloudflare Workers → Logs** to debug

## Cost summary at typical volume

| Volume | Twilio | Resend | Cloudflare | Total |
|---|---|---|---|---|
| 10 bookings/day (300/mo) | ~$15/mo | $0 (free tier) | $0 (free tier) | **~$15/mo** |
| 30 bookings/day (900/mo) | ~$30/mo | $0 | $0 | **~$30/mo** |
| 60 bookings/day (1,800/mo) | ~$55/mo | ~$5/mo (over free tier) | $0 | **~$60/mo** |

## Fallback if you skip Twilio

If you delete or never set the `TWILIO_ACCOUNT_SID` env var, the Worker will:
- Skip the SMS sends silently
- Still send the customer email + .ics calendar invite
- Still send the owner email notification

So at $0/mo (Resend free tier only), you'd still have full booking — just email-only instead of SMS.

## Troubleshooting

**Twilio rejects with "Unverified destination":** Trial accounts can only send to your own phone. Upgrade to a paid Twilio account or verify recipient phones in the Twilio console.

**Emails go to spam:** Verify your domain DKIM in Resend. Don't use a `@gmail.com` address as `FROM_EMAIL`.

**Form returns 500:** Check Cloudflare Workers → Logs. Most common cause: missing env var.
