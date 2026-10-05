#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
# Set IMAGE_TAG in .env to a published commit SHA to pin or roll back a release.
docker compose pull
docker compose up -d --no-build --force-recreate frontend
docker compose up -d --no-build --wait database backend nginx pgadmin
docker compose ps -a
