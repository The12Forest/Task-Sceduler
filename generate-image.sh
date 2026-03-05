#!/bin/bash
set -euo pipefail

IMAGE_NAME="task-scheduler"
REGISTRY="ghcr.io"

# ── Prompt for inputs ─────────────────────────────────────────────────────────
read -rp "GitHub username: " GITHUB_USER
read -rp "Image version (e.g. 1.0.0): " VERSION
read -rp "Dockerfile path [./Dockerfile]: " DOCKERFILE_INPUT
DOCKERFILE="${DOCKERFILE_INPUT:-./Dockerfile}"
read -rsp "GitHub Personal Access Token (write:packages scope): " CR_PAT
echo ""

if [ -z "${GITHUB_USER}" ] || [ -z "${VERSION}" ] || [ -z "${CR_PAT}" ]; then
  echo "ERROR: username, version, and token are all required."
  exit 1
fi

if [ ! -f "${DOCKERFILE}" ]; then
  echo "ERROR: Dockerfile not found at '${DOCKERFILE}'"
  exit 1
fi

FULL_IMAGE="${REGISTRY}/${GITHUB_USER}/${IMAGE_NAME}"

# ── Login to GitHub Container Registry ───────────────────────────────────────
echo "→ Logging in to ${REGISTRY} as ${GITHUB_USER}..."
echo "${CR_PAT}" | docker login "${REGISTRY}" -u "${GITHUB_USER}" --password-stdin

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
