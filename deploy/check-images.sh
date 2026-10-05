#!/bin/sh
set -eu
docker compose exec -T --interactive=false backend node -e '
  const assert = require("node:assert/strict");
  const fs = require("node:fs");
  for (const path of ["src", "test", "node_modules/typescript", "node_modules/ts-node", "node_modules/jest", "node_modules/eslint", "node_modules/@nestjs/cli"]) {
    assert.equal(fs.existsSync(path), false, "Unexpected development file: " + path);
  }
  console.log("Backend production image verified");
' </dev/null
docker compose run --rm --no-deps -T --interactive=false --entrypoint sh frontend -c '
  test -f /opt/frontend/index.html
  test ! -d /app/src
  test ! -d /app/node_modules
  echo "Frontend production image verified"
' </dev/null
