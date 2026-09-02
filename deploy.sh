#!/usr/bin/env bash
set -Eeuo pipefail

DOMAIN="${DOMAIN:-realms.happymonkey.ai}"
PORT="${PORT:-9412}"
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
OLD_ROOT="${OLD_ROOT:-$HOME/projects/projects/MRPGRealms}"
SYSTEMD_DIR="$HOME/.config/systemd/user"
NGINX_AVAILABLE="/etc/nginx/sites-available/${DOMAIN}.conf"
NGINX_ENABLED="/etc/nginx/sites-enabled/${DOMAIN}.conf"
ACME_AVAILABLE="/etc/nginx/sites-available/${DOMAIN}-acme.conf"
ACME_ENABLED="/etc/nginx/sites-enabled/${DOMAIN}-acme.conf"

log() { printf '\n[deploy] %s\n' "$*"; }
die() { printf '\n[deploy] ERROR: %s\n' "$*" >&2; exit 1; }

command -v npm >/dev/null || die "npm is required"
command -v systemctl >/dev/null || die "systemctl is required"
[[ -f "$ROOT/package.json" ]] || die "package.json not found at $ROOT"
[[ -f "$ROOT/deploy/nginx/${DOMAIN}.conf" ]] || die "nginx template missing: $ROOT/deploy/nginx/${DOMAIN}.conf"
[[ -f "$ROOT/deploy/systemd/mrpg-realms.service" ]] || die "systemd template missing"

log "Preparing environment in $ROOT"
if [[ ! -f "$ROOT/.env" && -f "$OLD_ROOT/.env" && "$OLD_ROOT" != "$ROOT" ]]; then
  install -m 600 "$OLD_ROOT/.env" "$ROOT/.env"
  log "Copied the existing environment file without printing its contents"
fi
[[ -f "$ROOT/.env" ]] || die "no .env found; create $ROOT/.env or set up the old deployment at $OLD_ROOT first"

ROOT="$ROOT" DOMAIN="$DOMAIN" PORT="$PORT" python3 - <<'PY'
import os
from pathlib import Path

path = Path(os.environ["ROOT"]) / ".env"
updates = {
    "NODE_ENV": "production",
    "PORT": os.environ["PORT"],
    "CLIENT_ORIGIN": f"https://{os.environ['DOMAIN']}",
    "VITE_SOCKET_URL": f"https://{os.environ['DOMAIN']}",
}
lines = path.read_text().splitlines()
seen = set()
out = []
for line in lines:
    if line.lstrip().startswith("#") or "=" not in line:
        out.append(line)
        continue
    key = line.split("=", 1)[0].strip()
    if key in updates:
        out.append(f"{key}={updates[key]}")
        seen.add(key)
    else:
        out.append(line)
for key, value in updates.items():
    if key not in seen:
        out.append(f"{key}={value}")
path.write_text("\n".join(out) + "\n")
path.chmod(0o600)
PY

log "Installing dependencies and building"
cd "$ROOT"
npm ci
npm run typecheck
npm test
npm run build
if [[ -f "$ROOT/public/favicon.svg" ]]; then
  chmod 644 "$ROOT/public/favicon.svg"
fi

log "Installing and starting the user service"
install -d -m 700 "$SYSTEMD_DIR"
install -m 644 "$ROOT/deploy/systemd/mrpg-realms.service" "$SYSTEMD_DIR/mrpg-realms.service"
systemctl --user daemon-reload
systemctl --user enable --now mrpg-realms.service
for _ in {1..10}; do
  if curl -fsS "http://127.0.0.1:${PORT}/health" >/tmp/mrpg-realms-health.json; then break; fi
  sleep 1
done
curl -fsS "http://127.0.0.1:${PORT}/health" >/dev/null || die "server health check failed on port $PORT"

log "Checking sudo access for nginx and certificate operations"
sudo -v

if [[ ! -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]]; then
  log "Installing temporary ACME HTTP vhost"
  sudo install -m 644 "$ROOT/deploy/nginx/${DOMAIN}.conf" "$NGINX_AVAILABLE"
  sudo python3 - "$NGINX_AVAILABLE" <<'PY'
from pathlib import Path
import sys
p = Path(sys.argv[1])
s = p.read_text()
start = s.index("server {\n    listen 443 ssl;")
p.write_text(s[:start].replace("        return 301 https://$host$request_uri;", "        root /var/www/html;\n        try_files $uri =404;"))
PY
  sudo rm -f "$NGINX_ENABLED"
  sudo ln -s "$NGINX_AVAILABLE" "$NGINX_ENABLED"
  sudo nginx -t
  sudo systemctl reload nginx
  sudo certbot certonly --webroot --webroot-path /var/www/html -d "$DOMAIN"
fi

log "Installing final nginx vhost"
sudo install -m 644 "$ROOT/deploy/nginx/${DOMAIN}.conf" "$NGINX_AVAILABLE"
sudo rm -f "$ACME_ENABLED" "$ACME_AVAILABLE"
sudo ln -sfn "$NGINX_AVAILABLE" "$NGINX_ENABLED"
sudo nginx -t
sudo systemctl reload nginx

log "Verifying public HTTPS and Socket.IO origin"
curl -fsS "https://${DOMAIN}/health" >/tmp/mrpg-realms-public-health.json
curl -fsS "https://${DOMAIN}/" >/tmp/mrpg-realms-public-index.html
printf '[deploy] public_health=ok\n'
printf '[deploy] public_index=ok\n'
printf '[deploy] service=%s\n' "$(systemctl --user is-active mrpg-realms.service)"
printf '[deploy] domain=https://%s\n' "$DOMAIN"
