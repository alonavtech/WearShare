#!/usr/bin/env bash
# WearShare: one-time server setup for a fresh Ubuntu 24.04 Vultr server.
#
# Run as root, AFTER cloning the repo to /opt/wearshare:
#     git clone https://github.com/YOUR-USER/WearShare.git /opt/wearshare
#     bash /opt/wearshare/deploy/setup.sh YOUR.DOMAIN.OR.203-0-113-5.sslip.io
#
# Safe to run again: it skips anything already done and never overwrites your .env.
set -euo pipefail

DOMAIN="${1:?Usage: bash setup.sh <domain>   e.g. 203-0-113-5.sslip.io}"
APP_DIR=/opt/wearshare
WEB_DIR=/var/www/wearshare
DATA_DIR=/var/lib/wearshare

[ "$(id -u)" -eq 0 ] || { echo "Run as root (you are logged in as root on a fresh Vultr server)."; exit 1; }
[ -d "$APP_DIR/backend" ] || { echo "Clone the repo to $APP_DIR first (see the top of this file)."; exit 1; }

echo "==> 1/7 Installing system packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y python3-venv python3-pip git curl gnupg ufw rsync debian-keyring debian-archive-keyring apt-transport-https

echo "==> 2/7 Installing Caddy (web server with automatic HTTPS)"
if ! command -v caddy >/dev/null 2>&1; then
  if curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg \
     && curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' -o /etc/apt/sources.list.d/caddy-stable.list; then
    chmod o+r /usr/share/keyrings/caddy-stable-archive-keyring.gpg /etc/apt/sources.list.d/caddy-stable.list
    apt-get update -y
  else
    echo "   (official Caddy repository unreachable; falling back to Ubuntu's own package)"
  fi
  apt-get install -y caddy
fi

echo "==> 3/7 Creating the service user and folders"
id -u wearshare >/dev/null 2>&1 || useradd --system --home-dir "$APP_DIR" --shell /usr/sbin/nologin wearshare
mkdir -p "$DATA_DIR/uploads" "$WEB_DIR"
chown -R wearshare:wearshare "$DATA_DIR"      # the only place the app may write: uploaded photos
chmod 755 "$WEB_DIR"

echo "==> 4/7 Installing the backend's Python packages"
cd "$APP_DIR/backend"
[ -d .venv ] || python3 -m venv .venv
.venv/bin/pip install --upgrade pip
.venv/bin/pip install -r requirements.txt

echo "==> 5/7 Preparing the private .env file"
if [ ! -f .env ]; then
  cp .env.example .env
  setenv() { if grep -q "^$1=" .env; then sed -i "s|^$1=.*|$1=$2|" .env; else echo "$1=$2" >> .env; fi; }
  setenv APP_ENV production
  setenv SECRET_KEY "$(python3 -c 'import secrets; print(secrets.token_hex(32))')"
  setenv UPLOAD_DIR "$DATA_DIR/uploads"
  setenv CORS_ORIGINS "https://$DOMAIN"
  echo "   created .env with safe defaults (you still have to add your keys, see the next steps below)"
else
  echo "   .env already exists, leaving it alone"
fi
chown root:wearshare .env
chmod 640 .env                                  # readable by the app, not by other users

echo "==> 6/7 Installing the background service and the web server config"
cp "$APP_DIR/deploy/wearshare.service" /etc/systemd/system/wearshare.service
sed "s|__DOMAIN__|$DOMAIN|g; s|__WEB_DIR__|$WEB_DIR|g" "$APP_DIR/deploy/Caddyfile.template" > /etc/caddy/Caddyfile
systemctl daemon-reload
systemctl enable wearshare
systemctl restart caddy

echo "==> 7/7 Firewall (only SSH, HTTP, HTTPS are reachable)"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

cat <<DONE

Server setup finished. The API is NOT started yet, because it needs your keys first.

NEXT STEPS
  1. Fill in the secrets:   nano $APP_DIR/backend/.env
       GROQ_API_KEY=...        DATABASE_URL=...     AUTH0_DOMAIN=...     AUTH0_AUDIENCE=...
     (save in nano: Ctrl+O, Enter, then Ctrl+X)
  2. Start the API:         systemctl start wearshare
  3. Check it is healthy:   curl -s http://127.0.0.1:8000/api/health
  4. Visit:                 https://$DOMAIN/docs
Logs if something is wrong: journalctl -u wearshare -n 50 --no-pager
DONE
