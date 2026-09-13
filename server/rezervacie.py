#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Rezervačný backend pre aiucenie.online. Beží na Alexovom VPS, stránka sama je na GitHub Pages.

Čo robí:
  POST   /api/rezervacia            zapíše rezerváciu (SQLite), termín ostane obsadený pre všetkých,
                                    pošle mail Alexovi aj potvrdenie klientovi
  GET    /api/obsadene              zoznam obsadených termínov pre widget
  GET    /admin/api/rezervacie      zoznam rezervácií (heslo v hlavičke Authorization: Bearer …)
  DELETE /admin/api/rezervacie/ID   zmaže rezerváciu, termín sa uvoľní

Stránka na aiucenie.online sem volá cez CORS, preto sa odpovedá len povoleným doménam.
Beží pod systemd, počúva len na localhoste, nginx ho vystavuje s HTTPS.
Nastavenia sa čítajú zo súboru nastavenia.env vedľa tohto skriptu.
"""

import hmac
import json
import os
import re
import smtplib
import sqlite3
import ssl
import sys
import threading
from email.message import EmailMessage
from email.utils import formataddr, formatdate
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

KDE = os.path.dirname(os.path.abspath(__file__))
DB = os.path.join(KDE, "rezervacie.sqlite")


# ---------- nastavenia ----------

def nacitaj_nastavenia():
    cesta = os.path.join(KDE, "nastavenia.env")
    if not os.path.exists(cesta):
        sys.exit("Chýba súbor nastavenia.env — skopíruj nastavenia.vzor a vyplň ho.")
    n = {}
    with open(cesta, encoding="utf-8") as f:
        for riadok in f:
            riadok = riadok.strip()
            if not riadok or riadok.startswith("#") or "=" not in riadok:
                continue
            k, v = riadok.split("=", 1)
            n[k.strip()] = v.strip().strip('"').strip("'")
    for povinne in ("SMTP_SERVER", "SMTP_PORT", "SMTP_UZIVATEL", "SMTP_HESLO", "MOJ_MAIL", "ADMIN_HESLO"):
        if not n.get(povinne):
            sys.exit("V nastavenia.env chýba " + povinne)
    return n


N = nacitaj_nastavenia()
PORT = int(N.get("PORT", "8787"))
ZNACKA = N.get("ZNACKA", "AI Učenie")
WEB = N.get("WEB", "aiucenie.online")

# odkiaľ smie stránka volať (CORS); localhost je na lokálne skúšanie
POVOLENE_ORIGINY = {"https://aiucenie.online", "https://www.aiucenie.online", "https://apoliak7777.github.io"}
LOKALNY_ORIGIN = re.compile(r"^http://(127\.0\.0\.1|localhost)(:\d+)?$")


def povoleny_origin(origin):
    return bool(origin) and (origin in POVOLENE_ORIGINY or bool(LOKALNY_ORIGIN.match(origin)))


# ---------- databáza ----------

zamok = threading.Lock()


def db():
    spoj = sqlite3.connect(DB, timeout=10)
    spoj.execute("""CREATE TABLE IF NOT EXISTS rezervacie(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slot TEXT NOT NULL UNIQUE,
        termin TEXT NOT NULL,
        balik TEXT,
        meno TEXT NOT NULL,
        mail TEXT NOT NULL,
        tel TEXT,
        poznamka TEXT,
        ip TEXT,
        kedy TEXT NOT NULL DEFAULT (datetime('now'))
    )""")
    spoj.commit()
    return spoj


# ---------- maily ----------

def posli_mail(komu, predmet, telo, odpovedat_na=None):
    sprava = EmailMessage()
    sprava["From"] = formataddr((ZNACKA, N["SMTP_UZIVATEL"]))
    sprava["To"] = komu
    sprava["Subject"] = predmet
    sprava["Date"] = formatdate(localtime=True)
    if odpovedat_na:
        sprava["Reply-To"] = odpovedat_na
    sprava.set_content(telo)

    port = int(N["SMTP_PORT"])
    kontext = ssl.create_default_context()
    if port == 465:
        with smtplib.SMTP_SSL(N["SMTP_SERVER"], port, context=kontext, timeout=30) as s:
            s.login(N["SMTP_UZIVATEL"], N["SMTP_HESLO"])
            s.send_message(sprava)
    else:
        with smtplib.SMTP(N["SMTP_SERVER"], port, timeout=30) as s:
            s.starttls(context=kontext)
            s.login(N["SMTP_UZIVATEL"], N["SMTP_HESLO"])
            s.send_message(sprava)


# ---------- validácia ----------

MAIL_TVAR = re.compile(r"^[^@\s]+@[^@\s.]+\.[^@\s]+$")
SLOT_TVAR = re.compile(r"^\d{4}-\d{2}-\d{2} \d{1,2}:\d{2}$")


def orez(hodnota, strop):
    if not isinstance(hodnota, str):
        return ""
    return hodnota.strip()[:strop]


# ---------- HTTP ----------

class Obsluha(BaseHTTPRequestHandler):
    server_version = "rezervacie"
    sys_version = ""

    def log_message(self, tvar, *argumenty):
        sys.stdout.write("%s %s\n" % (self.klient_ip(), tvar % argumenty))
        sys.stdout.flush()

    def klient_ip(self):
        return self.headers.get("X-Real-IP") or self.client_address[0]

    def cesta(self):
        return self.path.split("?", 1)[0].rstrip("/") or "/"

    def cors(self):
        origin = self.headers.get("Origin") or ""
        if povoleny_origin(origin):
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
            self.send_header("Access-Control-Max-Age", "86400")
            self.send_header("Vary", "Origin")

    def odpovedz(self, kod, telo):
        data = json.dumps(telo, ensure_ascii=False).encode("utf-8")
        self.send_response(kod)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.cors()
        self.end_headers()
        self.wfile.write(data)

    def overeny(self):
        h = self.headers.get("Authorization") or ""
        return h.startswith("Bearer ") and hmac.compare_digest(h[7:].strip(), N["ADMIN_HESLO"])

    def do_OPTIONS(self):
        self.send_response(204)
        self.cors()
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_HEAD(self):
        # monitorovacie nástroje sa pýtajú HEAD; stačí potvrdiť, že server žije
        self.send_response(200)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self):
        cesta = self.cesta()
        if cesta == "/":
            return self.odpovedz(200, {"ok": True, "sluzba": "AI Učenie rezervácie", "stranka": "https://%s/" % WEB})
        if cesta == "/api/obsadene":
            spoj = db()
            sloty = [r[0] for r in spoj.execute("SELECT slot FROM rezervacie")]
            spoj.close()
            return self.odpovedz(200, {"obsadene": sloty})
        if cesta == "/admin/api/rezervacie":
            if not self.overeny():
                return self.odpovedz(401, {"ok": False, "chyba": "Nesprávne heslo."})
            spoj = db()
            spoj.row_factory = sqlite3.Row
            riadky = [dict(r) for r in spoj.execute(
                "SELECT id, slot, termin, balik, meno, mail, tel, poznamka, kedy FROM rezervacie ORDER BY slot")]
            spoj.close()
            return self.odpovedz(200, {"rezervacie": riadky})
        return self.odpovedz(404, {"ok": False, "chyba": "Neznáma adresa."})

    def do_DELETE(self):
        m = re.match(r"^/admin/api/rezervacie/(\d+)$", self.cesta())
        if not m:
            return self.odpovedz(404, {"ok": False, "chyba": "Neznáma adresa."})
        if not self.overeny():
            return self.odpovedz(401, {"ok": False, "chyba": "Nesprávne heslo."})
        with zamok:
            spoj = db()
            kurzor = spoj.execute("DELETE FROM rezervacie WHERE id = ?", (int(m.group(1)),))
            spoj.commit()
            zmazane = kurzor.rowcount
            spoj.close()
        return self.odpovedz(200, {"ok": True, "zmazane": zmazane})

    def do_POST(self):
        if self.cesta() != "/api/rezervacia":
            return self.odpovedz(404, {"ok": False, "chyba": "Neznáma adresa."})

        try:
            dlzka = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            dlzka = 0
        if dlzka <= 0 or dlzka > 20000:
            return self.odpovedz(400, {"ok": False, "chyba": "Prázdna alebo pridlhá požiadavka."})

        try:
            data = json.loads(self.rfile.read(dlzka).decode("utf-8"))
        except Exception:
            return self.odpovedz(400, {"ok": False, "chyba": "Nečitateľné údaje."})
        if not isinstance(data, dict):
            return self.odpovedz(400, {"ok": False, "chyba": "Nečitateľné údaje."})

        # pasca na roboty — widget toto pole posiela prázdne
        if orez(data.get("web"), 50):
            return self.odpovedz(200, {"ok": True})

        slot = orez(data.get("slot"), 20)
        termin = orez(data.get("termin"), 80)
        meno = orez(data.get("meno"), 80)
        mail = orez(data.get("mail"), 120)
        tel = orez(data.get("tel"), 40)
        balik = orez(data.get("balik"), 80) or "Jedna hodina"
        poznamka = orez(data.get("poznamka"), 1200)

        if not SLOT_TVAR.match(slot):
            return self.odpovedz(400, {"ok": False, "chyba": "Neplatný termín."})
        if len(meno) < 2:
            return self.odpovedz(400, {"ok": False, "chyba": "Chýba meno."})
        if not MAIL_TVAR.match(mail):
            return self.odpovedz(400, {"ok": False, "chyba": "Neplatný e-mail."})

        with zamok:
            spoj = db()
            try:
                spoj.execute(
                    "INSERT INTO rezervacie(slot,termin,balik,meno,mail,tel,poznamka,ip) "
                    "VALUES(?,?,?,?,?,?,?,?)",
                    (slot, termin, balik, meno, mail, tel, poznamka, self.klient_ip()))
                spoj.commit()
            except sqlite3.IntegrityError:
                spoj.close()
                return self.odpovedz(409, {
                    "ok": False, "obsadene": True,
                    "chyba": "Tento termín si medzitým vzal niekto iný. Vyber si, prosím, iný."})
            finally:
                try:
                    spoj.close()
                except Exception:
                    pass

        moj = (
            "Nová rezervácia\n\n"
            "Termín:   %s\n"
            "Balík:    %s\n"
            "Meno:     %s\n"
            "E-mail:   %s\n"
            "Telefón:  %s\n\n"
            "Na čom chce pracovať:\n%s\n\n"
            "Všetky rezervácie: https://%s/admin/\n"
        ) % (termin, balik, meno, mail, tel or "—", poznamka or "—", WEB)

        oslovenie = meno.split()[0] if meno.split() else meno
        jeho = (
            "Dobrý deň, %s,\n\n"
            "termín %s je pre Vás zarezervovaný (%s).\n\n"
            "Do 24 hodín Vám pošlem odkaz na stretnutie a podklady na platbu.\n"
            "Ak by Vám termín nevyhovoval, stačí odpísať na tento mail.\n\n"
            "Alex\n%s\n"
        ) % (oslovenie, termin, balik, WEB)

        chyby = []
        for komu, predmet, telo, odpoved in (
                (N["MOJ_MAIL"], "Rezervácia: %s — %s" % (termin, meno), moj, mail),
                (mail, "Potvrdenie rezervácie — %s" % ZNACKA, jeho, None)):
            try:
                posli_mail(komu, predmet, telo, odpoved)
            except Exception as e:
                chyby.append("%s: %s" % (komu, e))

        if chyby:
            # rezervácia je zapísaná a v /admin ju vidno, len mail neodišiel — nech je to v logu
            sys.stdout.write("MAIL ZLYHAL -> %s\n" % "; ".join(chyby))
            sys.stdout.flush()

        return self.odpovedz(200, {"ok": True})


def main():
    db().close()
    server = ThreadingHTTPServer(("127.0.0.1", PORT), Obsluha)
    sys.stdout.write("rezervacie bezi na 127.0.0.1:%d\n" % PORT)
    sys.stdout.flush()
    server.serve_forever()


if __name__ == "__main__":
    main()
