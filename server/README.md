# API rezervácií na VPS

Stránka `aiucenie.online` beží na GitHub Pages, ktorý vie len statické súbory. Tento malý server v čistom Pythone (bez závislostí) beží na Alexovom VPS a robí to, čo statika nevie:

| Čo | Ako |
|---|---|
| rezervácia sa nestratí | zapíše sa do `rezervacie.sqlite` |
| dvaja si nevezmú ten istý čas | `slot` je v databáze UNIQUE, druhý dostane 409 a stránka ho vráti na výber |
| obsadené termíny vidí každý | widget si ich pri načítaní stiahne z `/api/obsadene` |
| maily | tebe príde rezervácia, klientovi potvrdenie — cez SMTP schránky `info@aiucenie.online` |
| `/admin` | stránka `admin/index.html` si po zadaní hesla ťahá zoznam z `/admin/api/rezervacie` a maže cez `DELETE …/ID` |

Stránka volá API z inej domény, preto server odpovedá len `aiucenie.online`, `www.aiucenie.online`, `apoliak7777.github.io` a localhostu (CORS).

## Súbory

| Súbor | Na čo |
|---|---|
| `rezervacie.py` | samotný server, počúva na `127.0.0.1:8787`, nginx ho vystavuje s HTTPS |
| `nastavenia.vzor` | vzor nastavení; inštalátor z neho vyrobí `nastavenia.env` |
| `instaluj.sh` | inštalácia na VPS: balíky, kód z GitHubu, heslá, systemd služba, nginx vhost, certifikát |
| `rezervacie.sqlite` | databáza, vznikne sama pri prvom spustení |

`nastavenia.env` a `rezervacie.sqlite` sú v `.gitignore` — heslá ani mená klientov sa do repa nedostanú.

## Nasadenie (jeden príkaz na serveri ako root)

```bash
curl -fsSL https://raw.githubusercontent.com/Apoliak7777/ai-ucenie/main/server/instaluj.sh | bash
```

Pri prvom behu sa spýta na heslo schránky `info@aiucenie.online` a na heslo do `/admin`. Ten istý príkaz slúži aj na aktualizáciu po zmene v repe (heslá sa už nepýta).

API beží na `https://ai.apoliak.online/` (adresa, ktorá už v DNS mieri na VPS). Stránka ju má v premennej `API` v `index.html` a `admin/index.html`.

## Kde čo pozrieť

```bash
journalctl -u ai-ucenie -f                       # živý log
sqlite3 /var/www/ai-ucenie/server/rezervacie.sqlite 'SELECT kedy,slot,meno,mail,balik FROM rezervacie ORDER BY id DESC'
nano /var/www/ai-ucenie/server/nastavenia.env && systemctl restart ai-ucenie   # zmena hesla
```

## Lokálne skúšanie na Windows

```
copy server\nastavenia.vzor server\nastavenia.env      (doplniť SMTP_HESLO a ADMIN_HESLO)
python server\rezervacie.py                            (API na 8787)
python -m http.server 8791                             (statika)
```

Stránka aj `/admin` na `http://127.0.0.1:8791/` si API na 8787 nájdu samy.
