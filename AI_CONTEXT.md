# AI Context

This is a Next.js project management application. It uses Prisma as the ORM, PostgreSQL as the database, and is styled with Tailwind CSS.

## Documentation

Refer to the relevant doc for what you're working on:

- [Design system](docs/design-system.md) — dark mode rules, color palette, component library, shared components. **Any agent working on UI must read and abide by this documentation before making UI changes.**
- [Running the local database](docs/local-database.md)

## Dev Server Safety

Do not run `npm run build` while `npm run dev` is running. In this project, running a production build during an active Next.js dev server can corrupt or remove `.next` dev chunks, causing missing module errors and 404s for CSS/JS assets. When the dev server is active, use `npx tsc --noEmit --pretty false` for type verification instead. If a production build is needed, stop the dev server first, then run `npm run build`.
