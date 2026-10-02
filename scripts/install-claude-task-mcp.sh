#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
MCP_NAME="${MCP_NAME:-fasta-work}"
ENV_FILE="${ENV_FILE:-${REPO_ROOT}/.env}"
SERVER_FILE="${REPO_ROOT}/mcp/task-manager-server.mjs"

if ! command -v claude >/dev/null 2>&1; then
  echo "claude CLI is not installed or not on PATH." >&2
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing env file: ${ENV_FILE}" >&2
  echo "Start from ${REPO_ROOT}/.env.example and create a real .env first." >&2
  exit 1
fi

if [[ ! -f "${SERVER_FILE}" ]]; then
  echo "Missing MCP server file: ${SERVER_FILE}" >&2
  exit 1
fi

if [[ ! -d "${REPO_ROOT}/node_modules" ]]; then
  echo "Installing project dependencies..."
  (cd "${REPO_ROOT}" && npm install)
fi

echo "Registering MCP server '${MCP_NAME}' with Claude Code (user scope)..."

claude mcp remove --scope user "${MCP_NAME}" >/dev/null 2>&1 || true
claude mcp remove --scope user project-management-tasks >/dev/null 2>&1 || true  # legacy name
claude mcp add --scope user "${MCP_NAME}" -- \
  node \
  "--env-file=${ENV_FILE}" \
  "${SERVER_FILE}"

echo
echo "Installed MCP server '${MCP_NAME}' for all Claude Code sessions."
echo "Check it with: claude mcp get ${MCP_NAME}"
echo "Repo root: ${REPO_ROOT}"
