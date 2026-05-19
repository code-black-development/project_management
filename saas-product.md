# fasta.work — SaaS Product

**Domain:** fasta.work  
**App subdomain:** app.fasta.work  
**Stack:** Next.js 15, Prisma, PostgreSQL (Neon), Vercel, Stripe, Resend  

---

## Outstanding To-Dos

This section must be completed before the product can go live. Items are grouped by who needs to act.

### Decisions needed

- [ ] **Final pricing amounts** — current defaults are Starter free / Pro $12/mo / Unlimited $25/mo. Confirm before creating Stripe products.
- [ ] **Trial period** — do new users get a free trial of a paid plan, or go straight to Starter (free)? Currently: straight to Starter.
- [ ] **Member limits per workspace** — current defaults: Starter 5, Pro 10, Unlimited unlimited. Confirm.
- [ ] **Frozen workspace grace period** — currently 30 days. Confirm.
- [ ] **App name display** — is it "fasta.work" (with dot) or "Fasta" in prose? Needs consistency decision.

### External services to set up (dev/staging)

- [ ] **Stripe** — create account at stripe.com, create three products (Starter/free, Pro, Unlimited) with monthly recurring prices, copy price IDs into `STRIPE_PRICE_PRO` and `STRIPE_PRICE_UNLIMITED` env vars, then re-run `npx ts-node prisma/seed.ts` to update the Plan rows. Copy `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to `.env`.
- [ ] **Resend** — create account at resend.com, add and verify `fasta.work` domain (DNS records), get API key, add `RESEND_API_KEY` to `.env`. Until this is done, emails are logged to the console instead of sent.
- [ ] **Google OAuth** *(optional but recommended)* — create OAuth app in Google Cloud Console, add `http://app.localhost:3000/api/auth/callback/google` as authorized redirect URI, add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env`, uncomment the Google provider in `auth.ts`.

### Development tasks remaining

- [ ] **Downgrade workspace selection UI** — when a user downgrades to a plan with fewer workspaces than they currently have, they need a modal to select which workspace(s) to keep. The others get frozen. The `WorkspaceStatus.FROZEN` field is in the schema; the backend freeze logic is partially in the Stripe webhook handler, but the UI modal needs to be built.
- [ ] **Frozen workspace UI** — workspaces with `status: FROZEN` should show a "Frozen" badge in the sidebar and block all write operations with a clear error message and upgrade prompt. Currently only the API returns 403.
- [ ] **Billing page upgrade/downgrade flow** — the billing page shows plans and a Stripe checkout button, but downgrade flow (to lower plan or free) needs the workspace selection modal above.
- [ ] **Google OAuth integration** — provider is ready in `auth.ts` (commented out), just needs credentials.
- [ ] **`/pricing` page** — the marketing pricing page route exists as a link in the landing page nav but the page itself hasn't been built yet.

### Production tasks

- [ ] **Purchase fasta.work domain** — if not already done, purchase via Vercel, Cloudflare, or Namecheap.
- [ ] **Vercel project setup** — create new Vercel project, connect this GitHub repo. Do NOT use the existing Codeblack Vercel project — this is a separate product.
- [ ] **Move off Codeblack hosting** — current production is hosted under the Codeblack company domain. Once fasta.work is live on Vercel, update any external references (DNS, email, etc.) and decommission the old deployment.
- [ ] **Neon database for production** — create a new Neon project for fasta.work (separate from the current Codeblack production DB). Run `npx prisma migrate deploy` against the new DB. Run seed script. Do NOT migrate the existing Codeblack database.
- [ ] **DNS setup for subdomains** — configure `fasta.work` → Vercel (marketing), `app.fasta.work` → Vercel (app). In Vercel project settings, add both domains. The middleware handles routing between them.
- [ ] **Resend domain verification (production)** — add DNS TXT/CNAME records for `fasta.work` in Resend. Emails send from `noreply@fasta.work`.
- [ ] **Stripe webhook registration (production)** — register `https://app.fasta.work/api/webhooks/stripe` in Stripe dashboard, select events listed below, copy `STRIPE_WEBHOOK_SECRET` to Vercel env vars.
- [ ] **Google OAuth redirect URIs (production)** — add `https://app.fasta.work/api/auth/callback/google` to authorized URIs in Google Cloud Console.
- [ ] **Set all production env vars in Vercel** — see environment variables section below.
- [ ] **Stripe CLI webhook testing** — before going live, run `stripe listen --forward-to app.localhost:3000/api/webhooks/stripe` locally and trigger test events to verify the webhook handler works end-to-end.

---

## Architecture

### Routing

Single Next.js repo, two subdomains, one Vercel deployment.

| Subdomain | Purpose | Route group |
|---|---|---|
| `fasta.work` | Marketing landing page, pricing | `app/(marketing)` |
| `app.fasta.work` | The application | `app/(auth)`, `app/(dashboard)`, `app/(standalone)` |

**In development:**
- `localhost:3000` → marketing
- `app.localhost:3000` → app (no hosts file changes needed; `*.localhost` works natively)

The `middleware.ts` at the project root reads the `Host` header and routes accordingly. On the app subdomain, bare `/` redirects to `/workspaces`. On the root domain, `/workspaces/*` paths redirect to the app subdomain.

### Database

Single shared PostgreSQL database (Neon, serverless). All tenant data is scoped by `workspaceId`. There is no per-tenant database isolation — the Workspace is the tenant boundary.

---

## Plans & Pricing

| Plan | Workspaces | Members/workspace | Monthly price |
|---|---|---|---|
| Starter | 1 | 5 | Free |
| Pro | 3 | 10 | $12 |
| Unlimited | Unlimited | Unlimited | $25 |

- `-1` in the database means unlimited (no cap enforced)
- Plans are seeded into the `plans` table via `prisma/seed.ts`
- Stripe price IDs are stored on the `Plan` row (`stripePriceId`)
- Every user gets a **Starter subscription automatically on signup** — no null checks needed

### Subscription model

Subscriptions belong to **users**, not workspaces. A user pays once and the plan applies across all their workspaces. Workspace count is the primary limit enforced.

```
User → Subscription → Plan
User → Workspace[] (count limited by plan.maxWorkspaces)
Workspace → Member[] (count limited by plan.maxMembers)
```

---

## Auth

### Sign-up flows

**Open registration (`/sign-up`):**
1. User enters email, optional name, password, confirm password
2. Account created + Starter `Subscription` created in one transaction
3. Verification email sent via Resend
4. Redirect to `/verify-email?email=xxx` holding page
5. User clicks link in email → `GET /api/auth/verify-email?token=xxx`
6. `User.emailVerified` set, token deleted, redirect to `app.fasta.work/sign-in?verified=1`
7. User signs in and is prompted to create their first workspace

**Invite flow (new user):**
1. Workspace owner enters an email that has no account → invite created, email sent
2. Invite email contains link to `/sign-up?inviteCode=xxx`
3. User registers — on success they're automatically added to the workspace, invite deleted
4. Still goes through email verification before accessing the app

**Add existing user directly:**
1. Workspace owner searches for user by email inside the app
2. If account exists → `Member` row created immediately, notification email sent
3. No invite required

### Email verification

The `User.emailVerified` field is checked in `app/(dashboard)/layout.tsx`. Unverified users are redirected to `/verify-email`. Tokens stored in `VerificationToken` table (existing NextAuth model), expire after 24 hours.

Google OAuth sign-ups (when configured) skip verification — Google guarantees the email.

### Session

NextAuth v5, JWT strategy. The JWT includes:
- `userId`, `email`, `name`, `image` (existing)
- `planName` — "Starter" | "Pro" | "Unlimited"
- `subscriptionStatus` — "ACTIVE" | "PAST_DUE" | "CANCELED" etc.

Plan info is refreshed in the JWT when `session.update()` is called after a Stripe webhook updates the subscription.

---

## Billing & Stripe

### Flow

1. User clicks "Upgrade" on `/billing` page → POST `/api/stripe/checkout` with `{ planName }`
2. Server creates/retrieves Stripe customer, creates Checkout Session, returns `{ url }`
3. Client redirects to Stripe-hosted checkout
4. Stripe redirects back to `app.fasta.work/billing?success=1`
5. Stripe fires webhook → `/api/webhooks/stripe` updates the `Subscription` row

### Webhook events handled

| Event | Action |
|---|---|
| `checkout.session.completed` | Set `stripeSubscriptionId`, `stripeCustomerId`, status=ACTIVE, planId |
| `customer.subscription.updated` | Update planId (by `stripePriceId`), status, `currentPeriodEnd`, `cancelAtPeriodEnd` |
| `customer.subscription.deleted` | Set status=CANCELED |
| `invoice.payment_failed` | Set status=PAST_DUE |
| `invoice.payment_succeeded` | Set status=ACTIVE, update `currentPeriodEnd` |

### Customer Portal

Stripe Customer Portal handles: cancel subscription, change payment method, view invoice history. Accessed via POST `/api/stripe/portal` → redirect to Stripe-hosted portal. `return_url` is `app.fasta.work/billing`.

### Downgrade & frozen workspaces

When a user downgrades to a plan with fewer workspaces than they currently have:
1. Show modal listing workspaces, user selects which to keep (up to new plan limit)
2. Unselected workspaces: `status = FROZEN`, `frozenAt = now()`
3. Email sent: workspace names, deletion date (30 days from now), upgrade link
4. Reminder emails at 7 days and 1 day before deletion

**Frozen workspace rules:**
- Visible in sidebar with "Frozen" badge
- All write operations (create task, invite member, etc.) return 403
- User can upgrade to reactivate before deletion date
- Also used when payment fails (PAST_DUE) — workspaces are not immediately frozen, but the UI shows a warning banner

**Cleanup cron job:** Runs daily at 02:00 UTC via Vercel Cron (`vercel.json`). Route: `GET /api/cron/cleanup-frozen-workspaces`. Secured with `CRON_SECRET` header. Deletes workspaces where `frozenAt < now() - 30 days` (cascades to projects, tasks, members).

---

## Email (Resend)

All transactional email goes through Resend. Sending from `noreply@fasta.work`.

Without `RESEND_API_KEY` set (local dev), emails are logged to the console — no emails are actually sent.

### Email types

| Trigger | Function | Status |
|---|---|---|
| Email verification on signup | `generateVerificationEmailTemplate` | Implemented |
| Workspace invite (new user) | `generateEmailTemplate` | Implemented |
| Existing user added to workspace | `generateExistingUserWelcomeTemplate` | Implemented |
| Task assigned/reassigned | `generateTaskAssignmentEmailTemplate` | Implemented |
| Password reset | `generatePasswordResetEmailTemplate` | Implemented |
| Workspace frozen | `generateFrozenWorkspaceEmailTemplate` | Implemented |
| Frozen — 7 day reminder | (inline in cron route) | Implemented |
| Frozen — 1 day reminder | (inline in cron route) | Implemented |

**Resend free tier:** 3,000 emails/month, 100/day. Sufficient for early-stage SaaS. Paid tier ($20/mo) gives 50,000/month.

---

## Plan Enforcement

Gates enforced server-side in API routes (Hono handlers):

| Gate | Where | Behaviour on limit |
|---|---|---|
| Max workspaces | `POST /api/workspaces` (create) | 403 with upgrade message |
| Max members | Member invite endpoint | 403 with upgrade message |
| Frozen workspace | All workspace mutation routes | 403 with frozen message |
| Subscription status | `app/(dashboard)/layout.tsx` | Redirect to `/billing` if PAST_DUE or CANCELED |

---

## File Structure (SaaS additions)

```
app/
  (marketing)/
    layout.tsx              ← marketing layout (no sidebar)
    page.tsx                ← landing page
  (auth)/
    verify-email/
      page.tsx              ← email verification holding/success page
  (dashboard)/
    billing/
      page.tsx              ← subscription management
    workspaces/
      page.tsx              ← workspace selector (moved from root /)
  api/
    auth/
      verify-email/
        route.ts            ← GET ?token=xxx → verify + redirect
    stripe/
      checkout/route.ts     ← POST → create Stripe Checkout session
      portal/route.ts       ← POST → create Stripe Customer Portal session
    webhooks/
      stripe/route.ts       ← POST → handle Stripe events
    cron/
      cleanup-frozen-workspaces/
        route.ts            ← DELETE frozen workspaces older than 30 days

middleware.ts               ← subdomain routing (no auth — layouts handle auth)
vercel.json                 ← cron job schedule
prisma/
  schema.prisma             ← Plan, Subscription, SubscriptionStatus, WorkspaceStatus added
  seed.ts                   ← seeds Plan rows + TaskCategories
```

---

## Environment Variables

### Development (`.env`)

```bash
# Auth
AUTH_SECRET=
NEXTAUTH_URL=http://app.localhost:3000
NEXT_PUBLIC_APP_URL=http://app.localhost:3000
NEXT_PUBLIC_APP_ORIGIN=http://app.localhost:3000

# Database (local only)
DATABASE_URL=postgresql://localuser:localpass@localhost:5434/codeflow-local

# Email — leave blank in dev (emails logged to console)
RESEND_API_KEY=

# Stripe — leave blank in dev until Stripe account is set up
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_PRO=
STRIPE_PRICE_UNLIMITED=

# Google OAuth — optional
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Cron security
CRON_SECRET=

# AWS S3 (already configured)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
S3_BUCKET_NAME=
```

### Production (Vercel environment variables)

Same keys as above but with production values:
- `DATABASE_URL` → Neon production pooled connection string
- `NEXTAUTH_URL` → `https://app.fasta.work`
- `NEXT_PUBLIC_APP_URL` → `https://app.fasta.work`
- `NEXT_PUBLIC_APP_ORIGIN` → `https://app.fasta.work`
- `RESEND_API_KEY` → from Resend dashboard
- `STRIPE_SECRET_KEY` → Stripe live key (`sk_live_...`)
- `STRIPE_WEBHOOK_SECRET` → from Stripe webhook settings (`whsec_...`)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → Stripe live publishable key (`pk_live_...`)
- `STRIPE_PRICE_PRO` → Stripe price ID for Pro plan
- `STRIPE_PRICE_UNLIMITED` → Stripe price ID for Unlimited plan
- `CRON_SECRET` → random secret, also set in Vercel cron config

---

## Deployment Checklist (Production)

Run through this in order:

1. [ ] Purchase `fasta.work` domain
2. [ ] Create Resend account → verify `fasta.work` domain → get API key
3. [ ] Create Stripe account → create Pro and Unlimited products/prices → get keys
4. [ ] Create new Neon database project for fasta.work production
5. [ ] Run `npx prisma migrate deploy` against prod DB
6. [ ] Run seed script against prod DB (sets up Plan rows)
7. [ ] Create new Vercel project → connect GitHub repo → do NOT reuse Codeblack project
8. [ ] Add both domains to Vercel: `fasta.work` and `app.fasta.work`
9. [ ] Set all production env vars in Vercel
10. [ ] Register Stripe webhook: `https://app.fasta.work/api/webhooks/stripe`
    - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, `invoice.payment_succeeded`
11. [ ] Add Google OAuth redirect URI: `https://app.fasta.work/api/auth/callback/google`
12. [ ] Deploy → push to main
13. [ ] Test full signup → verify email → upgrade → Stripe checkout → webhook → billing page reflects new plan
14. [ ] Test downgrade → workspace freeze → cron cleanup (trigger manually first)
15. [ ] Decommission old Codeblack hosting once verified live
