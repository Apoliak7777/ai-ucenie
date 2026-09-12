# Rezervačný backend — záložná cesta pre vlastný VPS

> Ostrá verzia beží na **Cloudflare Pages** (`functions/api/` + D1), viď hlavný README.
> Toto je tá istá logika v Pythone pre prípad, že by sa stránka niekedy sťahovala na vlastný server.

Malý server v čistom Pythone (bez závislostí), ktorý stránke doplní to, čo statika nevie:

| Čo | Ako |
|---|---|
| rezervácia sa nestratí | zapíše sa do `rezervacie.sqlite` |
| dvaja si nevezmú ten istý čas | `slot` je v databáze UNIQUE, druhý dostane 409 a stránka ho vráti na výber |
| obsadené termíny vidí každý | widget si ich pri načítaní stiahne z `/api/obsadene` |
| maily | tebe príde rezervácia, klientovi potvrdenie — cez SMTP tvojej schránky |

## Súbory

| Súbor | Na čo |
|---|---|
| `rezervacie.py` | samotný server, počúva na `127.0.0.1:8787` |
| `nastavenia.vzor` | vzor nastavení — skopíruj ako `nastavenia.env` a vyplň |
| `instaluj.sh` | nasadenie na VPS: balíky, systemd služba, nginx vhost, HTTPS |
| `rezervacie.sqlite` | databáza, vznikne sama pri prvom spustení |

`nastavenia.env` a `rezervacie.sqlite` sú v `.gitignore` — heslo ani mená klientov sa do repa nedostanú.

## Nasadenie (jednorazovo)

```bash
git clone https://github.com/Apoliak7777/ai-ucenie.git /var/www/ai-ucenie
bash /var/www/ai-ucenie/server/instaluj.sh
```

Pri prvom behu skript vytvorí `nastavenia.env` a zastaví sa — doplň `SMTP_HESLO` a spusti ho znova.

## Aktualizácia po zmene v repe

```bash
cd /var/www/ai-ucenie && git pull && systemctl restart ai-ucenie
```

## Kde čo pozrieť

```bash
journalctl -u ai-ucenie -f                       # živý log backendu
sqlite3 /var/www/ai-ucenie/server/rezervacie.sqlite 'SELECT kedy,slot,meno,mail,balik FROM rezervacie ORDER BY id DESC'
```

## Lokálne skúšanie na Windows

```bash
cd server
copy nastavenia.vzor nastavenia.env      # a vyplň heslo
python rezervacie.py
```

Potom v `index.html` dočasne `ENDPOINT = "http://127.0.0.1:8787/api/rezervacia"`.
