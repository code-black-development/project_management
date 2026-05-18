---
name: feedback-migrations
description: Never run prisma migrate dev against the production database
metadata:
  type: feedback
---

Never run `prisma migrate dev` against the production database. Always run it against the local dev database (configured in .env). Apply migrations to production separately (e.g. via `prisma migrate deploy` or direct SQL).

**Why:** Running migrate dev on prod is destructive and dangerous — it can drop/recreate the shadow database.

**How to apply:** When a migration is needed, run `prisma migrate dev` with the local DATABASE_URL only. Then apply to prod via `prisma migrate deploy` or direct SQL after reviewing the generated migration file.
