#!/bin/sh
set -eu
# The named volume contains only generated frontend assets.
mkdir -p /var/www/frontend
find /var/www/frontend -mindepth 1 -maxdepth 1 -exec rm -rf {} +
cp -a /opt/frontend/. /var/www/frontend/
echo 'Frontend assets published'
