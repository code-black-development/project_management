# Task MCP Server

This repo includes a local MCP server for task management at [`mcp/task-manager-server.mjs`](../mcp/task-manager-server.mjs).

## What It Exposes

- `list_workspaces`
- `list_projects`
- `list_members`
- `list_tasks`
- `get_task`
- `create_task`
- `update_task`
- `delete_task`

The helper list tools are included so a client can discover workspace, project, and member ids before creating or editing tasks.

## Repo MCP Config

The repo root [`.mcp.json`](../.mcp.json) points Codex to the server:

```json
{
  "mcpServers": {
    "project-management-tasks": {
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

For the MCP server alone, the only required value is `DATABASE_URL`.

5. Register the MCP server with Codex:

```bash
./scripts/install-codex-task-mcp.sh
```

That helper registers the server globally in the current user's Codex config using absolute paths to this repo clone, so each teammate can run it on their own machine after cloning.

## Manual Run

```bash
npm run mcp:tasks
```

## Manual Codex Registration

If you prefer to add it yourself instead of using the helper script:

```bash
codex mcp add project-management-tasks -- \
  node \
  --env-file=/ABSOLUTE/PATH/TO/project_management/.env \
  /ABSOLUTE/PATH/TO/project_management/mcp/task-manager-server.mjs
```

## Notes

- The server uses Prisma directly against the local `.env` `DATABASE_URL`.
- It creates, updates, and deletes standard tasks only. Event editing is intentionally out of scope for this first pass.
- The install helper removes any existing `project-management-tasks` Codex entry before adding the current repo clone.
- The server can fall back to another local SDK copy if needed, but the intended setup is to use this repo's own installed `@modelcontextprotocol/sdk`.
