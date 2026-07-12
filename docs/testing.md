# Testing

This project now has a three-layer automated test setup:

- `npm run test:unit` runs fast unit and component tests with Vitest and React Testing Library.
- `npm run test:integration` runs server-facing integration tests with Vitest in a Node environment.
- `npm run test:e2e` runs browser flows with Playwright against a local Next.js server.
- `npm run test:all` runs the full stack.
- `npm run test:coverage` generates a Vitest coverage report in `coverage/`.

## What To Cover

Use the pyramid consistently:

- Unit tests for pure helpers, formatters, hooks, and components with isolated mocks.
- Integration tests for Hono route handlers, Prisma-backed services, auth flows, and external side effects such as email or S3.
- E2E tests for critical user journeys such as sign-in, password reset, task creation, filtering, and task editing.

## Practical Patterns

- Prefer mocking `next/navigation`, `next/link`, and network calls in unit tests.
- For Hono routes, import the route module and call `app.request(...)` directly.
- Keep E2E tests focused on the highest-value flows and intercept third-party calls where appropriate.
- Add test files under `tests/unit`, `tests/integration`, or `tests/e2e` so the scripts pick them up automatically.
