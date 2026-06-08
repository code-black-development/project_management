#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
MCP_NAME="${MCP_NAME:-project-management-tasks}"
ENV_FILE="${ENV_FILE:-${REPO_ROOT}/.env}"
SERVER_FILE="${REPO_ROOT}/mcp/task-manager-server.mjs"

if ! command -v codex >/dev/null 2>&1; then
  echo "codex CLI is not installed or not on PATH." >&2
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

echo "Registering MCP server '${MCP_NAME}' with Codex..."

codex mcp remove "${MCP_NAME}" >/dev/null 2>&1 || true
codex mcp add "${MCP_NAME}" -- \
  node \
  "--env-file=${ENV_FILE}" \
  "${SERVER_FILE}"

echo
echo "Installed MCP server '${MCP_NAME}'."
echo "Check it with: codex mcp get ${MCP_NAME}"
echo "Repo root: ${REPO_ROOT}"
