#!/bin/bash
# Nasadenie ai.apoliak.online na VPS (Debian 12, nginx).
#
# Spustenie na serveri ako root:
#   git clone https://github.com/Apoliak7777/ai-ucenie.git /var/www/ai-ucenie
#   bash /var/www/ai-ucenie/server/instaluj.sh
#
# Aktualizácia po zmene v repe:
#   cd /var/www/ai-ucenie && git pull && systemctl restart ai-ucenie
#
# Skript sa dá púšťať opakovane — nič existujúce na serveri neprepisuje,
# okrem vlastného vhostu ai.apoliak.online a vlastnej systemd služby.

set -euo pipefail

DOMENA="ai.apoliak.online"
CIEL="/var/www/ai-ucenie"
SLUZBA="ai-ucenie"
PORT="8787"
CERT_MAIL="apoliak@apoliak.online"

cerveny() { printf '\033[31m%s\033[0m\n' "$*"; }
zeleny()  { printf '\033[32m%s\033[0m\n' "$*"; }

[ "$(id -u)" = "0" ] || { cerveny "Spusti ako root (sudo bash instaluj.sh)."; exit 1; }
[ -f "$CIEL/index.html" ] || { cerveny "V $CIEL nie je index.html — najprv git clone (viď hlavička skriptu)."; exit 1; }

# ---------- 1. balíky ----------
echo "== balíky"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq nginx python3 certbot python3-certbot-nginx git >/dev/null
zeleny "nginx, python3, certbot, git sú nainštalované"

# ---------- 2. nastavenia backendu ----------
echo "== nastavenia"
if [ ! -f "$CIEL/server/nastavenia.env" ]; then
  cp "$CIEL/server/nastavenia.vzor" "$CIEL/server/nastavenia.env"
  chmod 600 "$CIEL/server/nastavenia.env"
  cerveny "Vytvoril som $CIEL/server/nastavenia.env — VYPLŇ V ŇOM SMTP_HESLO a spusti skript znova."
  exit 2
fi
if ! grep -qE '^SMTP_HESLO=.+' "$CIEL/server/nastavenia.env"; then
  cerveny "V $CIEL/server/nastavenia.env chýba SMTP_HESLO. Vyplň ho a spusti skript znova."
  exit 2
fi
zeleny "nastavenia.env je vyplnený"

# ---------- 3. práva ----------
chown -R www-data:www-data "$CIEL"
chmod 600 "$CIEL/server/nastavenia.env"

# ---------- 4. systemd služba ----------
echo "== služba $SLUZBA"
cat > "/etc/systemd/system/$SLUZBA.service" <<UNIT
[Unit]
Description=AI Ucenie - rezervacny backend
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=$CIEL/server
ExecStart=/usr/bin/python3 $CIEL/server/rezervacie.py
Restart=always
RestartSec=3
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable --now "$SLUZBA" >/dev/null
sleep 1
if systemctl is-active --quiet "$SLUZBA"; then
  zeleny "služba beží"
else
  cerveny "služba nebeží — journalctl -u $SLUZBA -n 30"
  journalctl -u "$SLUZBA" -n 30 --no-pager || true
  exit 1
fi

# ---------- 5. nginx vhost ----------
echo "== nginx"
cat > "/etc/nginx/sites-available/$DOMENA" <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name $DOMENA;

    root $CIEL;
    index index.html;
    charset utf-8;

    # server/ a .git nesmú byť z internetu čitateľné
    location ~ ^/(server|\.git)(/|$) { return 404; }

    location /api/ {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header Host \$host;
        proxy_read_timeout 60s;
    }

    location / {
        try_files \$uri \$uri/ =404;
    }
    error_page 404 /404.html;

    gzip on;
    gzip_types text/html text/css application/javascript application/json image/svg+xml;
    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy strict-origin-when-cross-origin;
}
NGINX
ln -sf "/etc/nginx/sites-available/$DOMENA" "/etc/nginx/sites-enabled/$DOMENA"
nginx -t
systemctl reload nginx
zeleny "vhost $DOMENA je zapnutý"

# ---------- 6. HTTPS ----------
echo "== certifikát"
if [ -d "/etc/letsencrypt/live/$DOMENA" ]; then
  zeleny "certifikát už existuje, preskakujem"
else
  certbot --nginx -d "$DOMENA" --non-interactive --agree-tos -m "$CERT_MAIL" --redirect
  zeleny "certifikát vydaný, HTTP presmerované na HTTPS"
fi

# ---------- 7. kontrola ----------
echo "== kontrola"
sleep 1
if curl -fsS "http://127.0.0.1:$PORT/api/obsadene" >/dev/null; then
  zeleny "backend odpovedá na /api/obsadene"
else
  cerveny "backend neodpovedá"
  exit 1
fi
if curl -fsS -o /dev/null "https://$DOMENA/"; then
  zeleny "https://$DOMENA/ odpovedá"
else
  cerveny "https://$DOMENA/ zvonku neodpovedá — skontroluj DNS a firewall (porty 80, 443)"
fi

echo
zeleny "HOTOVO. Stránka: https://$DOMENA/   log backendu: journalctl -u $SLUZBA -f"
