# SaaS Migration Plan

This document covers every change needed to convert this app into a multi-tenant SaaS product with a public landing page, subscription billing via Stripe, and a gated app experience.

---

## Current State

- Next.js + Prisma + PostgreSQL
- NextAuth v5 with credentials (email/password), JWT sessions
- Password reset flow exists; invite-only registration (must be replaced with open signup)
- Route groups: `(auth)`, `(dashboard)`, `(standalone)`
- Multi-workspace already built: `Workspace`, `Member` models with `workspaceId` scoping
- Transactional email via Nodemailer/SMTP sending from `info@codeblack.digital` — must migrate to Resend
- No billing, no subscription gating, no landing page, no `middleware.ts`

---

## Domain

A new domain will be purchased specifically for this SaaS product. All references to `yourdomain.com` in this document should be replaced once the domain is decided. The domain will be used for:

- The app and landing page (Vercel)
- Transactional email sending address, e.g. `noreply@yourdomain.com` (Resend DNS verification)
- Google OAuth redirect URIs
- Stripe webhook endpoint

---

## Target Architecture

```
yourdomain.com/              ← landing page (public)
yourdomain.com/pricing       ← pricing page (public)
yourdomain.com/sign-in       ← auth (redirect to app if logged in)
yourdomain.com/sign-up       ← auth (redirect to app if logged in)
yourdomain.com/              ← dashboard (protected + subscription-gated)
```

Single repo, single deployment. One shared PostgreSQL database. Subscription is per **user**, with plan limits enforced on workspace count and member count per workspace.

### Plans

| Plan | Workspaces | Members/workspace | Price |
|---|---|---|---|
| Starter | 1 | 5 | Free |
| Pro | 3 | 10 | ~$12/mo |
| Unlimited | Unlimited (-1) | Unlimited (-1) | ~$25/mo |

---

## Phase 1 — Database Schema

### New models

```prisma
model Plan {
  id            String         @id @default(cuid())
  name          String         // "Starter", "Pro", "Unlimited"
  stripePriceId String?        @unique
  maxWorkspaces Int            // 1, 3, -1 = unlimited
  maxMembers    Int            // per workspace; -1 = unlimited
  priceMonthly  Int            // cents; 0 = free
  subscriptions Subscription[]

  @@map("plans")
}

model Subscription {
  id                   String             @id @default(cuid())
  userId               String             @unique
  planId               String
  status               SubscriptionStatus @default(TRIALING)
  stripeCustomerId     String?            @unique
  stripeSubscriptionId String?            @unique
  currentPeriodStart   DateTime?
  currentPeriodEnd     DateTime?
  cancelAtPeriodEnd    Boolean            @default(false)
  trialEndsAt          DateTime?
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt
  user                 User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  plan                 Plan               @relation(fields: [planId], references: [id])

  @@map("subscriptions")
}

enum SubscriptionStatus {
  TRIALING
  ACTIVE
  PAST_DUE
  CANCELED
  UNPAID
}
```

### Changes to existing models

```prisma
// Add to Workspace
model Workspace {
  ...
  status   WorkspaceStatus @default(ACTIVE)
  frozenAt DateTime?
  subscription Subscription? @relation(...)  // not needed — subscription is on User
}

enum WorkspaceStatus {
  ACTIVE
  FROZEN   // read-only, 30-day deletion countdown
}

// Add to User
model User {
  ...
  subscription Subscription?
  emailVerified DateTime?    // already exists — needs to be enforced
}
```

### Seed data

After migration, seed the three Plan rows with their Stripe price IDs. The Starter plan (free) gets no `stripePriceId`.

---

## Phase 2 — Auth Hardening

The current auth is invite-only and has several gaps that must be resolved before going public.

### 2a. Open registration

The `/register` route currently requires an `inviteCode` — no one can sign up without one. For SaaS, replace this with open registration:

- Remove the `inviteCode` requirement from the register route
- On signup, create the user + Subscription (Starter plan) in a single transaction
- After signup, redirect to `/verify-email` holding page (see 2b)
- On first login after verification, prompt the user to create their first workspace

### 2b. Enforce email verification

The `User.emailVerified` field exists but is never checked. For SaaS, an unverified user must not access the app — it prevents disposable email signups and is required by most email providers to avoid spam flags.

**Changes:**
- On sign-up: create user, send verification email immediately, redirect to `/verify-email` holding page
- Add `emailVerified` check to the dashboard layout (redirect to `/verify-email` if null)
- Add `GET /api/auth/verify-email?token=xxx` route to mark `emailVerified` and redirect to app
- Use the existing `VerificationToken` model for the token (already in schema)
- Google OAuth sign-ups skip verification — Google guarantees the email is valid

### 2c. Auto-create Subscription on sign-up

When a new user is created, immediately create a `Subscription` row linked to the Starter plan. This ensures every user always has a subscription record — avoids null checks everywhere.

**Where to do this:** in the sign-up API route, after `prisma.user.create(...)`, run `prisma.subscription.create(...)` in the same transaction. For Google OAuth first sign-in, handle this in the NextAuth `signIn` callback.

### 2d. Embed plan in JWT token

Avoid hitting the DB on every request to check the plan. Add subscription tier to the JWT:

```ts
// In auth.ts jwt callback
if (user) {
  const sub = await prisma.subscription.findUnique({
    where: { userId: user.id },
    include: { plan: true }
  })
  token.planName = sub?.plan.name ?? "Starter"
  token.subscriptionStatus = sub?.status ?? "ACTIVE"
}
```

Refresh token when a Stripe webhook updates the subscription (use `trigger: "update"` with `session.update()`).

### 2d. Google OAuth (recommended)

Add Google as a provider to reduce signup friction. SaaS conversion rates are meaningfully higher with social login.

```ts
import Google from "next-auth/providers/google"

providers: [
  Google({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }),
  Credentials({ ... }) // keep existing
]
```

Google sign-ins skip the email verification step (Google guarantees it). On first Google sign-in, still auto-create the Subscription row — handle this in the `signIn` callback.

### 2e. Workspace membership flows

Three distinct paths for adding someone to a workspace:

**Path 1 — Invite unregistered user**
Same as the current invite system. Workspace owner enters an email that has no account. An invite email is sent with a link containing the `inviteCode`. Clicking it takes them to `/sign-up?inviteCode=xxx` — they register, and on completion are automatically added to the workspace and the invite is deleted.

**Path 2 — Add existing user directly**
Workspace owner searches for a user by email inside the app. If an account exists, they're added to the workspace immediately as a `Member` with no invite needed. A notification email is sent ("You've been added to X workspace by Y"). The `generateExistingUserWelcomeTemplate` function already exists for this.

**Path 3 — User signs up independently**
Anyone can register at `/sign-up` with no invite. They get a Starter subscription and no workspace. On first login they're prompted to create one. They can later be added to other workspaces via Path 1 or 2.

---

## Phase 3 — Email (Resend Migration)

### 3a. Why migrate from Nodemailer/SMTP

The current setup uses Nodemailer pointed at an SMTP server sending from `info@codeblack.digital`. This is not suitable for SaaS:
- No deliverability guarantees or bounce/spam handling
- Sending from a different domain than the product looks unprofessional
- No email analytics or logs
- SMTP credentials are a single point of failure

**Migrate to Resend.** Free tier covers 3,000 emails/month and 100/day — more than sufficient for early-stage SaaS. Paid tier starts at $20/month for 50,000 emails when needed.

### 3b. Domain email setup

After the new domain is purchased, add DNS records to verify it with Resend. Transactional emails will send from `noreply@yourdomain.com`. This is a one-time DNS setup step done before deployment.

### 3c. Migration steps

```bash
npm uninstall nodemailer
npm uninstall @types/nodemailer
npm install resend
```

Replace the `sendEmail` function in `lib/mailing-functions.ts`:

```ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(to: string, subject: string, html: string) {
  await resend.emails.send({
    from: 'noreply@yourdomain.com',
    to,
    subject,
    html,
  })
}
```

All existing call sites (`features/auth/server/route.ts`, `features/workspaces/server/route.ts`, `features/tasks/server/route.ts`) use the `sendEmail` wrapper and require no changes.

Remove env vars: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`
Add env var: `RESEND_API_KEY`

### 3d. Full email inventory

All emails the app sends, current and planned:

| Trigger | Template | Status |
|---|---|---|
| Password reset | Reset link, expires 1hr | Exists |
| Workspace invite (new user) | Invite link with `inviteCode` | Exists |
| Existing user added to workspace | "You've been added to X" | Exists |
| Task assigned/reassigned | Task link + project details | Exists |
| Email verification on signup | Verify link, expires 24hr | **To build** |
| Payment failed | "Update your payment method" | **To build** |
| Workspace frozen on downgrade | "X workspaces frozen, deleted in 30 days" | **To build** |
| Frozen workspace — 7 day reminder | "7 days until deletion" | **To build** |
| Frozen workspace — 1 day reminder | "Final warning: deleted tomorrow" | **To build** |

Task assignment is the highest-frequency email (fires on every assign/reassign). At early scale this stays well within Resend's 100/day free limit. All emails are transactional and fire-and-forget — failures should be caught and logged but must not break the user-facing operation (this pattern already exists in the task assignment code).

---

## Phase 4 — Stripe Integration

### 3a. Setup

```bash
npm install stripe @stripe/stripe-js
```

Environment variables:
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

In Stripe dashboard: create three products (Starter/free, Pro, Unlimited) with monthly recurring prices. Copy the price IDs into the `Plan` seed data.

### 3b. API routes

**`POST /api/stripe/checkout`** — creates a Stripe Checkout session for upgrading

```ts
// Looks up or creates a Stripe customer for the user
// Creates a checkout session with the target plan's stripePriceId
// Returns { url } to redirect the user to Stripe
// On success, Stripe redirects to /billing/success?session_id=xxx
```

**`POST /api/stripe/portal`** — opens the Stripe Customer Portal

```ts
// Lets the user manage billing, cancel, update card
// Returns { url } to redirect
// Used for the "Manage billing" button in settings
```

**`POST /api/webhooks/stripe`** — receives Stripe events

This is the most critical route. It must:
- Verify the webhook signature using `STRIPE_WEBHOOK_SECRET`
- Be excluded from CSRF protection and body parsing middleware
- Handle these events:

| Event | Action |
|---|---|
| `checkout.session.completed` | Set `stripeCustomerId`, `stripeSubscriptionId`, update plan and status to ACTIVE |
| `customer.subscription.updated` | Update `planId`, `status`, `currentPeriodEnd`, `cancelAtPeriodEnd` |
| `customer.subscription.deleted` | Set status to CANCELED |
| `invoice.payment_failed` | Set status to PAST_DUE — triggers grace period |
| `invoice.payment_succeeded` | Set status to ACTIVE, update `currentPeriodEnd` |

After any subscription update, call `session.update()` to refresh the JWT so the plan is current in-session.

### 3c. Downgrade flow

When a user downgrades (e.g. Unlimited → Pro, now limited to 3 workspaces):

1. User clicks downgrade — show a modal listing all their workspaces
2. User selects which workspace(s) to keep (up to the new plan limit)
3. On confirm: set unselected workspaces to `FROZEN`, set `frozenAt = now()`
4. Send email: "2 workspaces have been frozen and will be deleted in 30 days"
5. Send reminder emails at 7 days and 1 day before deletion
6. Cron job deletes workspaces where `frozenAt < now() - 30 days`

Frozen workspace rules:
- Visible in the sidebar but marked with a "Frozen" badge
- All write operations (create task, invite member, etc.) return 403
- User can reactivate by upgrading before the 30 days expire

---

## Phase 5 — Plan Enforcement

### Workspace creation gate

Before creating a workspace, check:
```ts
const workspaceCount = await prisma.workspace.count({ where: { user: userId } })
if (plan.maxWorkspaces !== -1 && workspaceCount >= plan.maxWorkspaces) {
  // Return 403 with upgrade prompt
}
```

### Member invitation gate

Before creating a `WorkspaceInvite`, check:
```ts
const memberCount = await prisma.member.count({ where: { workspaceId } })
if (plan.maxMembers !== -1 && memberCount >= plan.maxMembers) {
  // Return 403 with upgrade prompt
}
```

### Subscription status gate

In the dashboard layout (or middleware), if `subscriptionStatus` is `PAST_DUE` or `CANCELED`, redirect to `/billing` with a banner explaining the issue.

---

## Phase 6 — Routing & Middleware

Create `middleware.ts` at the project root. This is the single place that enforces route protection.

```ts
// middleware.ts
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)"],
}

// Logic:
// 1. Public routes: /, /pricing, /sign-in, /sign-up, /forgot-password, 
//    /reset-password, /verify-email — always allow
// 2. Auth routes (/sign-in, /sign-up): if session exists, redirect to /
// 3. All other routes: require session, redirect to /sign-in if missing
// 4. Dashboard routes: if subscriptionStatus is PAST_DUE/CANCELED, 
//    redirect to /billing
```

The Stripe webhook route (`/api/webhooks/stripe`) must be excluded from auth middleware — Stripe cannot send a session cookie.

---

## Phase 7 — Landing Page

New route group `(marketing)` with its own layout (no sidebar, no navbar — just a top nav with logo, links, and CTA buttons).

```
app/
  (marketing)/
    layout.tsx          ← marketing nav + footer
    page.tsx            ← / hero + features
    pricing/
      page.tsx          ← pricing table
```

### Landing page (`/`)
- Hero: headline, subheadline, "Get started free" CTA → `/sign-up`
- Features section: highlight key capabilities with screenshots
- Social proof: testimonials or "used by X teams"
- Final CTA

### Pricing page (`/pricing`)
- Three-column pricing table matching the plan tiers
- Each plan's CTA:
  - Starter: "Get started free" → `/sign-up`
  - Pro / Unlimited: "Start free trial" → `/sign-up?plan=pro` (plan pre-selected on signup)
- FAQ section covering billing questions (downgrade policy, frozen workspaces, cancellation)

### On sign-up with a plan query param

If the user arrives at `/sign-up?plan=pro`, after account creation immediately redirect them to the Stripe Checkout for the Pro plan rather than landing on the Starter free tier.

---

## Phase 8 — Cron Job: Frozen Workspace Cleanup

Vercel supports cron jobs via `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-frozen-workspaces",
      "schedule": "0 2 * * *"
    }
  ]
}
```

The route handler:
1. Finds all workspaces where `status = FROZEN` and `frozenAt < now() - 30 days`
2. Hard deletes them (cascades to projects, tasks, members via Prisma `onDelete: Cascade`)
3. Finds workspaces where `frozenAt` is 7 days and 1 day from now, sends reminder emails
4. Secured with a `CRON_SECRET` header so only Vercel can trigger it

---

## Phase 9 — Deployment

### Stack

| Service | Purpose |
|---|---|
| **Vercel** | Hosting (native Next.js support, cron jobs, edge middleware) |
| **Neon** | Serverless Postgres (scales to zero, connection pooling built-in) |
| **Stripe** | Payments |
| **Resend** | Transactional email (verification, frozen workspace warnings) |
| **AWS S3** | File storage (already in use) |

### Environment variables (production)

```
# Database
DATABASE_URL=

# Auth
AUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Email (Resend — replaces SMTP_HOST, SMTP_USER, SMTP_PASS)
RESEND_API_KEY=

# App
CRON_SECRET=
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# AWS S3 (already in use)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_BUCKET_NAME=
```

Remove from env: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `INVITE_EMAIL_ADDRESS`

### Deployment steps

1. **Purchase domain** — point nameservers to Vercel (or use Vercel's domain purchase)
2. **Set up Resend**
   - Create account, add and verify the new domain via DNS records (`noreply@yourdomain.com`)
   - Copy API key to `RESEND_API_KEY`
3. **Provision Neon database** — create a production project, copy the pooled connection string to `DATABASE_URL`
4. **Run migrations** — `npx prisma migrate deploy` against production DB
5. **Seed plans** — run a one-time seed script to insert the three Plan rows with Stripe price IDs
6. **Set up Stripe**
   - Create products and prices in Stripe dashboard
   - Register the webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, `invoice.payment_succeeded`
   - Copy `whsec_...` to `STRIPE_WEBHOOK_SECRET`
7. **Set up Google OAuth** — create OAuth app in Google Cloud Console, add `https://yourdomain.com/api/auth/callback/google` as authorized redirect URI
8. **Create Vercel project** — connect GitHub repo, set all env vars, assign domain
9. **Deploy** — push to main, Vercel builds and deploys
10. **Verify Stripe webhook** — use Stripe CLI to test webhook delivery end-to-end
11. **Test full flow** — sign up → verify email → upgrade plan → Stripe checkout → confirm subscription updated in DB → downgrade → workspace frozen

---

## Implementation Order

Work in this order to avoid building on an unstable foundation:

1. **Purchase domain** — needed before configuring Resend, Google OAuth, and Stripe
2. **Schema migration** — Plan, Subscription, WorkspaceStatus (Phase 1)
3. **Seed plans** — get real data in DB before building UI against it
4. **Resend migration** — swap Nodemailer for Resend, verify sending domain (Phase 3)
5. **Auth hardening** — open registration, email verification, auto-create subscription, membership flows (Phase 2)
6. **Middleware** — route protection in one place before building more routes (Phase 6)
7. **Stripe webhooks** — get inbound sync working before building checkout UI (Phase 4b)
8. **Checkout + portal routes** — wire up upgrade flow (Phase 4b)
9. **Plan enforcement** — gate workspace/member creation (Phase 5)
10. **Downgrade flow** — frozen workspace UI + emails (Phase 4c)
11. **Cron cleanup job** (Phase 8)
12. **Landing page** — can be built in parallel with any of the above (Phase 7)
13. **Deployment** (Phase 9)
