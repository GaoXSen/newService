#!/usr/bin/env bash

set -euo pipefail

SERVER_HOST="${SERVER_HOST:-81.70.201.126}"
SERVER_PORT="${SERVER_PORT:-22}"
SERVER_USER="${SERVER_USER:-codex}"
LOCAL_PORT="${LOCAL_PORT:-5433}"
REMOTE_PORT="${REMOTE_PORT:-5432}"
SSH_KEY_PATH="${SSH_KEY_PATH:-/tmp/codex-tencent}"
KNOWN_HOSTS_PATH="${KNOWN_HOSTS_PATH:-/tmp/codex_known_hosts}"

exec ssh \
  -i "${SSH_KEY_PATH}" \
  -o StrictHostKeyChecking=no \
  -o UserKnownHostsFile="${KNOWN_HOSTS_PATH}" \
  -N \
  -L "${LOCAL_PORT}:127.0.0.1:${REMOTE_PORT}" \
  -p "${SERVER_PORT}" \
  "${SERVER_USER}@${SERVER_HOST}"
