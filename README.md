# Naa'ib Associates — Hajj & Travel Platform

Website and admin system for **Naa'ib Associates Limited Travels and Tour Services**, the company that runs every package, booking and customer message on the site. Customers deal with the company directly: there are no vendors, outside agencies or commission listings.

Stack: Next.js 15 (App Router, Server Actions) · Prisma 6 · PostgreSQL · Tailwind CSS 4.

## Getting started

```bash
cp .env.example .env          # set DATABASE_URL, SESSION_SECRET, SEED_ADMIN_*
npm install
npx prisma migrate deploy     # or: npm run db:migrate (development)
npm run db:seed               # creates the 3 Hajj packages + the owner account
npm run dev                   # http://localhost:3000  ·  admin at /admin
```

The seed is idempotent. It never overwrites a package that already exists.

## Initial catalogue (seeded)

| Package | Price | Initial state |
|---|---|---|
| Hajj Regular | ₦8,700,000 | Enquire for Full Details |
| Hajj Standard | ₦9,500,000 | Enquire for Full Details |
| Hajj VIP | ₦22,000,000 | Enquire for Full Details |

The seed sets only the name, tier and price. Every other detail starts empty and unverified.

## Business rules enforced by the code

- **Only verified details are public.** Each package detail (description, pricing basis, price validity, season, dates, departure location, accommodation, flights, ground transport, meals, visa/permit assistance, inclusions, exclusions, payment schedule, cancellation terms, registration, availability) has its own **Verified** tick. The public site shows a detail only when it is entered *and* ticked. Anything else appears under "Details being confirmed".
- **Tiers differ only in visual weight.** Regular, Standard and VIP look different, but no benefits are implied unless they have been verified.
- **Book Now on every visible package.** Customers can request a booking even while details are still being confirmed. A request never secures a place: staff confirm details and set the agreed total before payment opens.
- **Public package states:** Draft (hidden), *Enquire for Full Details*, *Registration Details Coming Soon*, Bookable, Archived (hidden).
- **Bookable requires** a confirmed price plus verified pricing basis, price validity, season, departure/return dates, departure location, inclusions, exclusions, payment schedule and cancellation terms. The price validity date and registration deadline must not have passed. The server checks this every time.
- **Prices are never changed silently.** A price change needs a reason and a typed confirmation of the new amount, and it is stored in price history and the audit log. It also withdraws the price confirmation. A bookable package whose requirements stop being met goes back to "Enquire for Full Details" automatically.
- **No Hajj place is promised automatically.** A booking request is saved as `REQUESTED` with a snapshot of the price at that moment. Staff review it, and a booking can only be marked `CONFIRMED` once an agreed total is set.
- **No invented company facts.** Registration number, licences, address, phone and logo all start empty. An empty field is hidden, not filled with placeholder text. The temporary display name is "Naa'ib Associates" and can be changed in *Business settings*.

## Areas

**Public:** home, package list, package pages, enquiry form (individual / family / group / institution), booking request (bookable packages only), status tracker by reference + email, about, contact, who we serve, important booking information.

**Admin (`/admin`):**
- dashboard with package readiness
- package editor (details, verification, price confirmation and changes, price history, publishing, photos, PDF brochures, FAQs)
- enquiries, bookings, customers
- payments with numbered printable receipts
- customer messaging and a log of all communications
- audit log, business settings, staff accounts

**Roles:**
- **Owner:** everything, including settings, staff accounts and voiding receipts.
- **Admin:** catalogue, pricing, publishing and payments.
- **Staff:** enquiries, booking status and notes, and customer messages.

## Customer accounts: none needed

Customers **do not create an account or password**. Every booking gets a **private booking & payment page**, `/pay/NAB-…?t=…`. The link includes a signed token, so it can't be guessed or forged. It's:
- shown immediately after the booking request ("save this page")
- included in every booking email (request received, approved, each payment)
- shown to staff on the booking page, with **Copy link** and **Share on WhatsApp** buttons

If a customer loses the link, **Make a Payment** (header button on every page, `/pay`) finds the booking from the booking reference and email address.

## Instalment payments (Paystack)

1. Staff set the booking's **agreed total** and move it to **Awaiting deposit** (or **Confirmed**). The customer gets an email saying payment is open.
2. On **Track a Request**, the customer enters their booking reference and email. They see:
   - percentage paid and yet to be paid, with a progress bar
   - total, paid and balance amounts
   - every payment, each with a receipt they can view or print
3. The customer chooses any amount between the minimum and the outstanding balance, or taps **Pay full balance**. They pay through Paystack checkout by card, bank transfer or USSD.
4. The payment is recorded **only after the server verifies the transaction with Paystack** and the amount matches exactly. A receipt is issued and emailed with the updated percentage and balance.
5. Webhook (`/api/paystack/webhook`, signature-checked) records the payment even if the customer closes the browser before returning. Callback and webhook can both arrive; each Paystack reference can only ever be recorded once.
6. Declined, abandoned or mismatched transactions are never recorded as payments. They're listed on the admin booking page under "Online payment attempts".

Offline payments (bank transfer, cash, POS, cheque) are still recorded by staff and count towards the same balance.

**Configuration:**
- `PAYSTACK_SECRET_KEY`: use `sk_test_…` while testing, then `sk_live_…`.
- `APP_URL`: your public site URL. It's used for the Paystack return link.
- In the Paystack dashboard, set the webhook URL to `https://YOUR-DOMAIN/api/paystack/webhook`.
- *Business settings → Minimum online instalment* (optional): customers can always pay off a smaller remaining balance.
- The company absorbs Paystack's transaction fee: the customer is charged exactly the amount they choose.
- Refunds are made in the Paystack dashboard. Then void the receipt here (Owner only), giving the refund as the reason.

## Content & photos

- **Home page:** hero, packages, the Two Holy Cities (Makkah & Madinah), the days of Hajj, booking steps, preparation, gallery, FAQs.
- **Hajj Guide** (`/hajj-guide`): pillars, day-by-day journey, types of Hajj (Tamattu', Qiran, Ifrad), preparation, FAQs. Text lives in `src/lib/content.ts`.
- **Admin → Site photos:** upload licensed photos for the home banner, Makkah, Madinah, the guide banner and a 6-photo gallery. Until a photo is uploaded, an illustration of the Kaaba or the Green Dome is shown. A credit field shows attribution on the photo when a licence requires it.

## Operational notes

- **Email:** set `SMTP_*` to send email. Without it, every customer message is still recorded under *Communications* as "Logged only", and the admin page warns that messages are not being delivered.
- **Uploads:** files go to `UPLOAD_DIR` (default `./storage/uploads`) and are served from `/files/…`. JPEG, PNG and WebP images and PDF files are accepted, up to 10 MB, and the file contents are checked against the type. In production this needs persistent storage, such as a mounted volume or a swap to object storage in `src/lib/uploads.ts`.
- **Rate limiting:** public forms and login are rate-limited in memory. Use a shared store if you run more than one instance.
- **First login:** change the seeded owner password straight away (*Account → Change password*).
