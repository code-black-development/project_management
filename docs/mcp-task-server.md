# Fasta.work MCP Server

This repo includes a local MCP server for Fasta.work at [`mcp/task-manager-server.mjs`](../mcp/task-manager-server.mjs). It lets Claude Code or Codex create and manage tasks, subtasks and worklogs in Fasta.work by plain-language request, e.g. "log 2h on SA-102".

## How It Works

- **Nothing to run or deploy.** There is no port and no hosted service. Claude Code / Codex starts the server itself at the start of each session (as a child process over stdin/stdout) and it exits when the session ends.
- **It talks straight to the database** through Prisma, using `DATABASE_URL` from your local `.env`. Writes are real and immediate, so they show up in the app.
- **It lives in your clone of this repo.** The registration points at absolute paths to the server file and `.env`, so keep the clone where it is (re-run the install script if you move it) and keep `node_modules` installed.

## Where It Is Available

- **Claude Code:** after `./scripts/install-claude-task-mcp.sh`, in every session in any directory (user scope). Inside this repo it is also picked up from the repo's `.mcp.json`.
- **Codex:** after `./scripts/install-codex-task-mcp.sh`, globally.
- Start a **new** session after installing or after changing the server code or `.env`. Sessions that were already open do not pick up changes.
- In Claude Code, run `/mcp` to check that `fasta-work` is connected. Tools appear as `mcp__fasta-work__<tool>`.

## Using It

Just ask, no ids needed (see Defaults below):

- "Create a task SA-102 called 'Add worklog tools to MCP server'"
- "Log 2h on SA-102: added worklog tools"
- "Add a subtask 'write tests' under SA-102"
- "Show worklogs for this project in October"
- "List my tasks in progress"

Ambiguous or missing ticket references write nothing and tell you why. To work in a workspace other than the default, name it (and its project and member); the helper list tools find the ids.

## What It Exposes

- `list_workspaces`
- `list_projects`
- `list_members`
- `list_tasks`
- `get_task`
- `create_task`
- `update_task`
- `delete_task`
- `create_worklog`
- `list_worklogs`
- `update_worklog`
- `delete_worklog`
- `log_work` (quick worklog by task name/ticket code)

The helper list tools are included so a client can discover workspace, project, and member ids before creating or editing tasks.

## Defaults (SIS Freelance)

To avoid passing ids on every call, the server reads three optional env vars (set them in `.env`; see `.env.example`):

- `DEFAULT_WORKSPACE_ID` - the SIS Freelance workspace
- `DEFAULT_PROJECT_ID` - the SIS Dev Work project
- `DEFAULT_MEMBER_ID` - **your own** member id in that workspace (run `list_members` to find it)

When a tool is called without `workspaceId` / `projectId` / `memberId` (or `createdById`), these are used. The project and member defaults only apply to the default workspace; if you pass a different `workspaceId` you must also pass the project and member explicitly. Explicit ids always win.

Quick examples (no ids needed):

- "Log 2h on SA-102: added worklog tools" -> `log_work` with `task: "SA-102"`, `duration: "2h"`. Ticket codes are matched against task names ignoring dashes and spaces, and nothing is written unless exactly one task matches.
- "Create a task 'SA-1003 Fix login'" -> `create_task` with just `name`.
- "Add a subtask 'write tests' under SA-102" -> `create_task` with `name` and `parentTask: "SA-102"` (the subtask lands in the parent's project).

## Worklogs

Worklog time is always in minutes.

- `create_worklog` takes `workspaceId`, `taskId`, `memberId`, `timeSpentMinutes`, and optional `dateWorked` (ISO datetime, defaults to now) and `workDescription`.
- `list_worklogs` takes `workspaceId` plus optional `projectId`, `taskId`, `memberId`, `from` (inclusive), `to` (exclusive), and `limit` (default 100, max 500). Use `from`/`to` for a date range, e.g. all of October is `from: 2026-10-01T00:00:00Z`, `to: 2026-11-01T00:00:00Z`. The response includes `totalMinutes`, `totalCount`, and `byTask` / `byMember` breakdowns covering every match, not just the returned page.
- `update_worklog` and `delete_worklog` take `workspaceId` and `worklogId`.

## Repo MCP Config

The repo root [`.mcp.json`](../.mcp.json) points Codex to the server:

```json
{
  "mcpServers": {
    "fasta-work": {
      "command": "node",
      "args": [
        "--env-file=.env",
        "./mcp/task-manager-server.mjs"
      ]
    }
  }
}
```

## Team Setup

1. Clone the repo.
2. Install dependencies:

```bash
npm install
```

3. Create a local env file from [`.env.example`](../.env.example):

```bash
cp .env.example .env
```

4. Fill in the real values.

For the MCP server alone, the required values are `DATABASE_URL` and, for the no-id shortcuts, `DEFAULT_MEMBER_ID` set to **your own** member id (see Defaults). `DEFAULT_WORKSPACE_ID` and `DEFAULT_PROJECT_ID` are pre-filled in `.env.example`.

5. Register the MCP server so it works from any directory.

For Claude Code (user scope):

```bash
./scripts/install-claude-task-mcp.sh
```

For Codex:

```bash
./scripts/install-codex-task-mcp.sh
```

These helpers register the server globally for the current user using absolute paths to this repo clone, so each teammate can run it on their own machine after cloning. Then start a new session.

## Manual Run

```bash
npm run mcp:tasks
```

## Manual Registration

If you prefer to add it yourself instead of using the helper scripts:

```bash
claude mcp add --scope user fasta-work -- \
  node \
  --env-file=/ABSOLUTE/PATH/TO/project_management/.env \
  /ABSOLUTE/PATH/TO/project_management/mcp/task-manager-server.mjs
```

For Codex:

```bash
codex mcp add fasta-work -- \
  node \
  --env-file=/ABSOLUTE/PATH/TO/project_management/.env \
  /ABSOLUTE/PATH/TO/project_management/mcp/task-manager-server.mjs
```

## Notes

- The server uses Prisma directly against the local `.env` `DATABASE_URL`.
- It creates, updates, and deletes standard tasks, subtasks and worklogs. Event editing is intentionally out of scope.
- The install helpers remove any existing `fasta-work` entry (and the legacy `project-management-tasks` one) before adding the current repo clone.
- `claude mcp list` may warn that `fasta-work` is defined in two scopes (the repo `.mcp.json` and your user config). They start the same server, so it is harmless.
- The server can fall back to another local SDK copy if needed, but the intended setup is to use this repo's own installed `@modelcontextprotocol/sdk`.

## Troubleshooting

- **Tools not found:** start a new session; run `/mcp` (Claude Code) or `codex mcp get fasta-work` to check it is registered and connected.
- **Server fails to start:** check `.env` exists with a valid `DATABASE_URL`, `npm install` has been run, and the clone has not moved.
- **"no default is configured":** set the `DEFAULT_*` value named in the error in `.env`, or pass the id explicitly, then start a new session.
