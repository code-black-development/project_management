# Dev Performance, Caching, and Cleanup Plan

## Context

The app is a Next.js App Router project with a Hono API mounted under `app/api/[[...route]]`, Prisma/PostgreSQL for persistence, NextAuth for auth, and S3 for uploaded images/assets. The current dev experience is slow and noisy because the app compiles a large client graph for dashboard routes, repeatedly fetches the same S3-backed images, and does more database work than many screens need.

## Goals

- Reduce repeated S3 requests for the same image or asset.
- Avoid repeatedly signing URLs for objects that do not exist in S3.
- Reduce unnecessary database payloads and requests on task list screens.
- Ensure task, project, and workspace deletes clean up related S3 objects.
- Prevent light-mode flash before dark mode is applied.
- Reduce dev-server compile pressure and stale chunk/CSS failures.

## Findings

### Backend Structure

- The app uses Next.js for runtime and routing.
- Most product API endpoints are Hono routes mounted through `app/api/[[...route]]/route.ts`.
- Client data access uses React Query hooks plus `hono/client`.
- Prisma talks to PostgreSQL directly from the API route layer.
- S3 uploads store object keys in the database, then `/api/s3-image` returns presigned URLs for display.

### S3 Fetching

- `usePresignedUrl` currently stores local component state and fetches `/api/s3-image` independently in every component instance.
- Task table rows render `ProjectAvatar` per row, so the same project image can trigger many duplicate presigned URL requests.
- Each presigned URL has a unique signature, which can reduce the usefulness of Next image optimizer caching.
- Missing S3 objects are still signed successfully, then fail later when Next tries to optimize the upstream image.

### Database Loading

- Task list fetching returns tasks with project, assignee, creator, worklogs, assets, and category for every row.
- List views do not currently use server pagination.
- Common task filters lack dedicated Prisma indexes.
- Some hooks can run with empty ids because `enabled` guards are missing.

### Delete Cleanup

- Deleting an individual task asset deletes the S3 object.
- Deleting a task or bulk-deleting tasks deletes database rows only, leaving task asset objects orphaned in S3.
- Deleting a project deletes the project icon, but not task asset files under that project.
- Deleting a workspace deletes the workspace icon, but not project icons or task asset files under that workspace.

### Dark Mode

- The theme provider defaults to `light` until client-side effects read localStorage/system preference.
- That allows light-mode CSS variables to paint before the `dark` class is added.

## Implementation Plan

1. Create a shared presigned URL cache.
   - Convert `usePresignedUrl` to React Query.
   - Use `["presigned-url", s3Key]` as the query key.
   - Set `staleTime` below the S3 URL expiry.
   - Add `enabled` guards for empty keys.
   - Return a stable fallback state when a key is missing or known invalid.

2. Guard missing S3 objects.
   - Add an S3 `HeadObject` helper.
   - Check object existence before returning a presigned URL.
   - Return `404` from `/api/s3-image` for missing objects.
   - Let avatars/assets gracefully fall back instead of repeatedly retrying bad keys.

3. Fix S3 cleanup on deletes.
   - Add helpers to collect task asset keys before deleting tasks.
   - Delete task asset objects when deleting one task or many tasks.
   - On project delete, delete the project icon plus all task asset objects in that project.
   - On workspace delete, delete workspace icon, project icons, and task asset objects in that workspace.
   - Keep DB deletion authoritative, but log S3 cleanup failures clearly.

4. Improve query guards and invalidation.
   - Add `enabled` guards to detail hooks such as `useGetProject`.
   - Stop hooks from calling API endpoints with empty ids.
   - Normalize task detail query keys over time, ideally `["task", taskId]`.

5. Reduce task list database payloads.
   - Add a list-specific Prisma select for task rows.
   - Exclude worklogs/assets from task list responses unless the current UI view needs them.
   - Add server pagination or a hard initial limit.
   - Add Prisma indexes for common filters.

6. Reduce dashboard compile pressure.
   - Lazy-load table, kanban, and calendar views.
   - Avoid importing all modal implementations in the dashboard layout.
   - Replace remaining broad `react-icons` imports with `lucide-react` where possible.

7. Prevent dark-mode flash.
   - Add a small pre-hydration script in `app/layout.tsx` to set the initial `dark` class before paint.
   - Keep the provider state in sync with the class applied by the script.

8. Verify.
   - Run the build and TypeScript checks available in the repo.
   - Smoke-test the task page and project page in the browser.
   - Confirm repeated project images share one presigned URL request per key.
   - Confirm delete paths remove expected S3 objects or log cleanup failures.

