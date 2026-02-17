#!/usr/bin/env bash
set -euo pipefail

CONFIG_PATH="${1:-config/config.yaml}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

exec go run ./cmd/sso/main.go --config "${SCRIPT_DIR}/${CONFIG_PATH}"
