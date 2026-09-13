#!/bin/bash
# Inštalácia API rezervácií na VPS (Debian 12, nginx). Stránka sama beží na GitHub Pages.
#
# Jeden príkaz na serveri (ako root):
#   curl -fsSL https://raw.githubusercontent.com/Apoliak7777/ai-ucenie/main/server/instaluj.sh | bash
#
# Pri prvom behu sa spýta na dve heslá (napíšeš ich, neuvidíš ich):
#   - heslo schránky info@aiucenie.online (odchádzajú z nej potvrdenia)
#   - heslo do /admin
# Dá sa púšťať opakovane: stiahne novú verziu, reštartuje službu, nič existujúce na serveri
# neprepisuje okrem vlastného vhostu a vlastnej služby.

set -euo pipefail

DOMENA="ai.apoliak.online"        # adresa API; v DNS už mieri na tento server (stránka je aiucenie.online)
CIEL="/var/www/ai-ucenie"
SLUZBA="ai-ucenie"
PORT="8787"
REPO="https://github.com/Apoliak7777/ai-ucenie.git"
CERT_MAIL="info@aiucenie.online"

cerveny() { printf '\033[31m%s\033[0m\n' "$*"; }
zeleny()  { printf '\033[32m%s\033[0m\n' "$*"; }

[ "$(id -u)" = "0" ] || { cerveny "Spusti ako root (sudo bash instaluj.sh)."; exit 1; }

# ---------- 1. balíky ----------
echo "== balíky"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq nginx python3 certbot python3-certbot-nginx git >/dev/null
zeleny "nginx, python3, certbot, git sú nainštalované"

# ---------- 2. kód ----------
echo "== kód"
if [ -d "$CIEL/.git" ]; then
  git -C "$CIEL" pull -q --ff-only
  zeleny "repo aktualizované"
else
  git clone -q "$REPO" "$CIEL"
  zeleny "repo stiahnuté do $CIEL"
fi

# ---------- 3. nastavenia (heslá sa pýtajú len raz) ----------
echo "== nastavenia"
ENV="$CIEL/server/nastavenia.env"
if [ ! -f "$ENV" ]; then
  if [ ! -r /dev/tty ]; then
    cerveny "Bez terminálu neviem vypýtať heslá. Vytvor $ENV podľa server/nastavenia.vzor a spusti znova."
    exit 2
  fi
  printf 'Heslo schránky %s (nezobrazuje sa): ' "$CERT_MAIL" > /dev/tty
  read -r -s SMTP_HESLO < /dev/tty; echo > /dev/tty
  printf 'Heslo do /admin (nezobrazuje sa): ' > /dev/tty
  read -r -s ADMIN_HESLO < /dev/tty; echo > /dev/tty
  [ -n "$SMTP_HESLO" ] && [ -n "$ADMIN_HESLO" ] || { cerveny "Heslo nesmie byť prázdne."; exit 2; }
  sed -e "s|^SMTP_HESLO=.*|SMTP_HESLO=$SMTP_HESLO|" -e "s|^ADMIN_HESLO=.*|ADMIN_HESLO=$ADMIN_HESLO|" \
      "$CIEL/server/nastavenia.vzor" > "$ENV"
  chmod 600 "$ENV"
  zeleny "nastavenia.env vytvorený"
else
  zeleny "nastavenia.env už existuje, heslá sa nemenia (zmena: nano $ENV a systemctl restart $SLUZBA)"
fi
chown -R www-data:www-data "$CIEL"
chmod 600 "$ENV"

# ---------- 4. systemd služba ----------
echo "== služba $SLUZBA"
cat > "/etc/systemd/system/$SLUZBA.service" <<UNIT
[Unit]
Description=AI Ucenie - API rezervacii
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
systemctl enable "$SLUZBA" >/dev/null 2>&1 || true
systemctl restart "$SLUZBA"
sleep 1
if systemctl is-active --quiet "$SLUZBA"; then
  zeleny "služba beží"
else
  cerveny "služba nebeží:"
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

    client_max_body_size 64k;

    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header Host \$host;
        proxy_read_timeout 60s;
    }
}
NGINX
ln -sf "/etc/nginx/sites-available/$DOMENA" "/etc/nginx/sites-enabled/$DOMENA"
nginx -t
systemctl reload nginx
zeleny "vhost $DOMENA je zapnutý"

# ---------- 6. HTTPS ----------
echo "== certifikát"
if [ -d "/etc/letsencrypt/live/$DOMENA" ]; then
  zeleny "certifikát už existuje"
else
  certbot --nginx -d "$DOMENA" --non-interactive --agree-tos -m "$CERT_MAIL" --redirect
  zeleny "certifikát vydaný, HTTP presmerované na HTTPS"
fi

# ---------- 7. kontrola ----------
echo "== kontrola"
sleep 1
if curl -fsS "http://127.0.0.1:$PORT/api/obsadene" >/dev/null; then
  zeleny "API odpovedá na /api/obsadene"
else
  cerveny "API neodpovedá"
  exit 1
fi
if curl -fsS -o /dev/null "https://$DOMENA/"; then
  zeleny "https://$DOMENA/ odpovedá zvonku"
else
  cerveny "https://$DOMENA/ zvonku neodpovedá — skontroluj DNS (A záznam $DOMENA) a firewall (80, 443)"
fi

echo
zeleny "HOTOVO. API: https://$DOMENA/   Rezervácie: https://aiucenie.online/admin/   Log: journalctl -u $SLUZBA -f"
