#!/bin/bash
set -euo pipefail

IMAGE_NAME="task-scheduler"
REGISTRY="ghcr.io"

# ── Check if already logged in to ghcr.io ────────────────────────────────────
DOCKER_CONFIG="${DOCKER_CONFIG:-${HOME}/.docker}"
ALREADY_LOGGED_IN=false
GITHUB_USER=""

if command -v jq &>/dev/null && [ -f "${DOCKER_CONFIG}/config.json" ]; then
  STORED_USER=$(jq -r '.auths["ghcr.io"].Username // empty' "${DOCKER_CONFIG}/config.json" 2>/dev/null || true)
  # Some credential helpers don't store inline; fall back to credsStore lookup
  if [ -z "${STORED_USER}" ]; then
    CREDS_STORE=$(jq -r '.credsStore // empty' "${DOCKER_CONFIG}/config.json" 2>/dev/null || true)
    if [ -n "${CREDS_STORE}" ] && command -v "docker-credential-${CREDS_STORE}" &>/dev/null; then
      STORED_USER=$(echo "ghcr.io" | "docker-credential-${CREDS_STORE}" get 2>/dev/null | jq -r '.Username // empty' 2>/dev/null || true)
    fi
  fi
  if [ -n "${STORED_USER}" ]; then
    GITHUB_USER="${STORED_USER}"
    ALREADY_LOGGED_IN=true
    echo "✓ Already logged in to ${REGISTRY} as ${GITHUB_USER}"
  fi
fi

# ── Prompt for inputs ─────────────────────────────────────────────────────────
if [ "${ALREADY_LOGGED_IN}" = false ]; then
  read -rp "GitHub username: " GITHUB_USER
  read -rsp "GitHub Personal Access Token (write:packages scope): " CR_PAT
  echo ""
  if [ -z "${GITHUB_USER}" ] || [ -z "${CR_PAT}" ]; then
    echo "ERROR: username and token are required."
    exit 1
  fi
fi

read -rp "Image version (e.g. 1.0.0): " VERSION
read -rp "Dockerfile path [./Dockerfile]: " DOCKERFILE_INPUT
DOCKERFILE="${DOCKERFILE_INPUT:-./Dockerfile}"

if [ -z "${VERSION}" ]; then
  echo "ERROR: version is required."
  exit 1
fi

if [ ! -f "${DOCKERFILE}" ]; then
  echo "ERROR: Dockerfile not found at '${DOCKERFILE}'"
  exit 1
fi

GITHUB_USER_LOWER=$(echo "${GITHUB_USER}" | tr '[:upper:]' '[:lower:]')
FULL_IMAGE="${REGISTRY}/${GITHUB_USER_LOWER}/${IMAGE_NAME}"

# ── Login to GitHub Container Registry (only if needed) ──────────────────────
if [ "${ALREADY_LOGGED_IN}" = false ]; then
  echo "→ Logging in to ${REGISTRY} as ${GITHUB_USER}..."
  if ! echo "${CR_PAT}" | docker login "${REGISTRY}" -u "${GITHUB_USER}" --password-stdin; then
    echo ""
    echo "ERROR: Login to ${REGISTRY} failed. Common causes:"
    echo ""
    echo "  1. Wrong token type — use a classic PAT (not fine-grained):"
    echo "     https://github.com/settings/tokens/new?scopes=write:packages,read:packages,delete:packages"
    echo ""
    echo "  2. Missing scopes — the token must have:"
    echo "     ✓ write:packages"
    echo "     ✓ read:packages"
    echo "     ✓ repo  (required for private repos)"
    echo ""
    echo "  3. Token expired or copied incorrectly — regenerate it."
    exit 1
  fi
fi

# ── Build ─────────────────────────────────────────────────────────────────────
echo "→ Building ${FULL_IMAGE}:${VERSION} (also tagging as latest)..."
docker build \
  --file "${DOCKERFILE}" \
  --tag "${FULL_IMAGE}:${VERSION}" \
  --tag "${FULL_IMAGE}:latest" \
  .

# ── Push ──────────────────────────────────────────────────────────────────────
echo "→ Pushing ${FULL_IMAGE}:${VERSION}..."
docker push "${FULL_IMAGE}:${VERSION}"

echo "→ Pushing ${FULL_IMAGE}:latest..."
docker push "${FULL_IMAGE}:latest"

echo ""
echo "✓ Done! Published:"
echo "    ${FULL_IMAGE}:${VERSION}"
echo "    ${FULL_IMAGE}:latest"
