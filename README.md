<div align="center">

[![Slovencina](https://img.shields.io/badge/SK-Sloven%C4%8Dina-2ea043?style=for-the-badge)](README.md) [![English](https://img.shields.io/badge/EN-English-30363d?style=for-the-badge)](README.en.md)

</div>

<div align="center">

# 🎓 AI Učenie

**Statická web stránka na rezerváciu súkromných online hodín práce s AI — jeden na jedného, 25 € za 60 minút, s trojkrokovým rezervačným widgetom bez jediného backendu.**

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Zero Build](https://img.shields.io/badge/build-none-success?style=flat-square)
![Zero Dependencies](https://img.shields.io/badge/dependencies-0-success?style=flat-square)

[Rýchly štart](#-rýchly-štart) - [Nastavenie termínov](#️-nastavenie-termínov) - [Známe obmedzenia](#️-známe-obmedzenia)

</div>

---

## 📑 Obsah

- [🔎 Prehľad](#-prehľad)
- [✨ Funkcie](#-funkcie)
- [🚀 Rýchly štart](#-rýchly-štart)
- [📁 Štruktúra projektu](#-štruktúra-projektu)
- [⚙️ Nastavenie termínov](#️-nastavenie-termínov)
- [📮 Odosielanie rezervácií](#-odosielanie-rezervácií)
- [🛠️ Technológie](#️-technológie)
- [🌍 Nasadenie](#-nasadenie)
- [⚠️ Známe obmedzenia](#️-známe-obmedzenia)
- [📄 Licencia](#-licencia)

---

## 🔎 Prehľad

**AI Učenie** je prezentačná a rezervačná stránka pre súkromné online hodiny, na ktorých sa človek učí používať AI na svojej vlastnej práci — zdieľaná obrazovka, jeho reálne úlohy, žiadna prednáška.

Celý web žije v jednom súbore `index.html`: markup, CSS aj JavaScript sú inline. Nie je tu backend, build step ani package manager. Rezervačný widget si sám vypočíta voľné termíny z týždenného plánu, klient si vyberie deň, čas a balík, a rezervácia odíde buď na vlastný endpoint, alebo cez predvyplnený e-mail.

Používateľské rozhranie je kompletne v slovenčine (`<html lang="sk">`). Dizajn: papier a atrament, svetlá téma s tmavou podľa systému, jeden modrý akcent, nadpisy serifom Newsreader, písma hostované priamo v repe, žiadne cudzie požiadavky pri načítaní. V hero stojí skutočná ukážka zápisu, ktorý klient po hodine dostane; rezervačný widget je na konci stránky, na mobile ho pripomína lepiaci pás.

---

## ✨ Funkcie

- 📅 **Trojkrokový rezervačný widget** - výber termínu → kontakt → potvrdenie, s vizuálnym stavom krokov a animovanými prechodmi.
- 🗓️ **Automatické voľné termíny** - z týždenného plánu `PLAN` sa vygeneruje najbližších `POCET_DNI` dní; dnešné termíny sa ponúkajú len 2 hodiny dopredu a víkend sa vynecháva.
- 📦 **Výber balíka priamo v rezervácii** - jedna hodina, dve za sebou, balík 3 h / 6 h alebo malý tím; vybraný balík ide aj do odoslaných dát.
- 📮 **Dve cesty odoslania** - `fetch` na vlastný endpoint (napr. Web3Forms), s automatickým návratom na predvyplnený `mailto:` keď endpoint nie je nastavený alebo zlyhá.
- 🕳️ **Pasca na roboty** - skryté pole `web`; keď ho spam bot vyplní, rezervácia sa ticho zahodí.
- ⏰ **Kontrola prešlého termínu** - ak mal klient stránku otvorenú pridlho a termín medzitým prešiel, widget ho vráti na výber namiesto odoslania rezervácie do minulosti.
- 📆 **Export do kalendára (.ics)** - s pripomienkou deň vopred aj hodinu pred začiatkom a organizátorom.
- 🚫 **Funguje aj bez JavaScriptu** - obsah stránky je viditeľný a v rezervačnom boxe sa zobrazí e-mail a telefón.
- ♿ **Prístupnosť** - skip-link, `aria-pressed` na dňoch, `aria-label` na termínoch, `role="alert"` na chybách, `prefers-reduced-motion`.
- 🔍 **SEO a zdieľanie** - JSON-LD (`Service` + `FAQPage`), Open Graph s vlastným obrázkom 1200×630, sitemap, robots.txt, vlastná 404.

---

## 🚀 Rýchly štart

```bash
git clone https://github.com/Apoliak7777/ai-ucenie.git
cd ai-ucenie
```

Otvor `index.html` v prehliadači — to je celé. Žiadna inštalácia, žiadne závislosti.

Na lokálny server (kvôli relatívnym odkazom a robots/sitemap) stačí:

```bash
python -m http.server 8000
```

---

## 📁 Štruktúra projektu

```
ai-ucenie/
├── index.html            # celá stránka: markup + CSS + JS inline
├── ochrana-udajov.html   # GDPR podstránka (noindex)
├── 404.html              # vlastná stránka pre neexistujúce adresy
├── og-image.png          # obrázok 1200×630 na zdieľanie odkazu
├── og-image.svg          # zdroj OG obrázka (písma z fonts/, PNG sa z neho fotí v prehliadači)
├── fonts/                # Newsreader (nadpisy) + Manrope (text), hostované tu, nie na Google Fonts
├── robots.txt            # indexovanie povolené, GDPR stránka mimo
├── sitemap.xml           # jedna URL
├── .nojekyll             # vypína Jekyll na GitHub Pages
├── PRECITAJ-MA.txt       # poznámky k úpravám a nasadeniu
├── admin/index.html      # prehľad rezervácií za heslom (statika, dáta z Workera)
├── worker/               # Cloudflare Worker: rezervácie + admin API (index.js, wrangler.toml)
├── lib/                  # spoločná logika: rezervacie.js (validácia, D1, SMTP, CORS), admin.js
├── functions/            # tá istá logika ako Pages Functions (keby stránka bežala celá na Pages)
├── schema.sql            # tabuľka rezervácií (vzniká aj sama pri prvom dopyte)
├── package.json          # worker-mailer + wrangler (api:dev, api:deploy, api:logs)
└── server/               # tá istá logika v Pythone pre VPS — záložná cesta (vlastný README)
```

---

## ⚙️ Nastavenie termínov

Všetko sa nastavuje na jednom mieste — na začiatku `<script>` bloku v `index.html`:

| Premenná | Význam |
|---|---|
| `PLAN` | časy podľa dňa v týždni (`1` = pondelok … `6` = sobota, `0` = nedeľa); pondelok až piatok od 15:00, sloty po 70 minútach = 60 min hodina + 10 min pauza |
| `OBSADENE` | ručný zoznam obsadených termínov vo formáte `"2026-07-28 9:00"` |
| `POCET_DNI` | koľko dní s voľnými termínmi sa ponúkne |
| `MOJ_MAIL` | kam chodia rezervácie |

---

## 📮 Odosielanie rezervácií

| Premenná | Význam |
|---|---|
| `API` | adresa Workera (`https://ai-ucenie.<účet>.workers.dev`); na localhoste sa automaticky použije `http://127.0.0.1:8787` |
| `ENDPOINT` | `API + "/api/rezervacia"` (predvolené); prázdne = klientovi sa otvorí predvyplnený e-mail |
| `OBSADENE_URL` | `API + "/api/obsadene"` — odtiaľ si widget pri načítaní stiahne už obsadené termíny |
| `ENDPOINT_EXTRA` | polia navyše, keby sa `ENDPOINT` nasmeroval na externú službu |

Stránka beží na GitHub Pages, ktorý vie len statické súbory, preto rezervácie spracúva **Cloudflare Worker** (`worker/`, logika v `lib/`): zapíše rezerváciu do D1, termín drží obsadený pre všetkých (druhý záujemca dostane 409 a widget ho vráti na výber) a cez SMTP schránky `info@aiucenie.online` pošle mail tebe aj potvrdenie klientovi. Worker prijíma dopyty len z `aiucenie.online`, `www.aiucenie.online`, `apoliak7777.github.io` a localhostu (CORS). Jediné, čo treba nastaviť v Cloudflare, sú tajomstvá `SMTP_HESLO` a `ADMIN_HESLO` a D1 databáza — zvyšok má predvolené hodnoty v `lib/rezervacie.js`.

Keď Worker neodpovedá, widget zobrazí chybu a sám ponúkne e-mail ako záložnú cestu.

---

## 🛠️ Technológie

| Technológia | Použitie |
|---|---|
| HTML5 | sémantický markup, `<details>` pre FAQ, natívny `<form>` |
| CSS3 | custom properties, grid, `clamp()`, gradienty, animácie |
| Vanilla JS (ES5) | rezervačný widget, generovanie termínov, `.ics` export |
| JSON-LD | štruktúrované dáta `Service` a `FAQPage` |

---

## 🌍 Nasadenie

**Stránka: GitHub Pages** z vetvy `main` (súbor `CNAME` = `aiucenie.online`, A záznamy u Hostingera mieria na GitHub). Nasadenie = push do `main`.

**Rezervácie a admin API: Cloudflare Worker** (zadarmo, bez zmeny DNS):

1. účet na dash.cloudflare.com, potom `npx wrangler login`
2. `npx wrangler d1 create ai-ucenie` → `database_id` do `worker/wrangler.toml`
3. `npx wrangler secret put SMTP_HESLO -c worker/wrangler.toml` (heslo `info@aiucenie.online`) a `npx wrangler secret put ADMIN_HESLO -c worker/wrangler.toml` (heslo do `/admin`)
4. `npm run api:deploy` → vypíše `https://ai-ucenie.<účet>.workers.dev`; tú adresu zapísať do premennej `API` v `index.html` a `admin/index.html` a pushnúť

Lokálne skúšanie v rovnakom rozložení: `npm install`, `worker/.dev.vars` podľa `worker/.dev.vars.vzor`, `npm run api:dev` (Worker na 8787) a `python -m http.server 8791` (statika), otvoriť `http://127.0.0.1:8791/`.

**Prehľad rezervácií:** `/admin/` je statická stránka (`admin/index.html`), ktorá si po zadaní hesla ťahá dáta z Workera (`Authorization: Bearer`, tajomstvo `ADMIN_HESLO`); ukáže nadchádzajúce a prebehnuté rezervácie so všetkými údajmi a tlačidlom Zmazať, ktoré termín uvoľní späť do ponuky. Je mimo indexu (`robots.txt`, `noindex`).

Alternatívy: celá stránka na Cloudflare Pages (`functions/` sú pripravené, apex doména vtedy potrebuje DNS na Cloudflare, v HTML `API = ""`) alebo vlastný VPS (rovnaká logika v Pythone v [`server/README.md`](server/README.md)).

---

## ⚠️ Známe obmedzenia

- 🗓️ **Obsadenosť drží backend, nie kalendár** - termíny dohodnuté mimo stránky (telefón, mail) treba dopísať do `OBSADENE` v `index.html`, inak ich widget ponúka ďalej.
- 📮 **Keď backend nebeží, ide rezervácia cez `mailto:`** - ak klient nemá v systéme nastavený mailový program, rezervácia sa nemusí odoslať.
- ✉️ **Maily sú „best effort“** - rezervácia sa zapíše vždy; keď SMTP zlyhá (zlé heslo, výpadok), je to v logu Workera (`npm run api:logs`) a rezervácia ostáva v D1 aj v `/admin`.
- 🕐 **Časy sú v slovenskom čase** - widget neprepočítava časové pásma, na stránke je to uvedené.

---

## 📄 Licencia

Tento projekt je zverejnený bez licencie — všetky práva vyhradené. Kód si môžeš prezerať na štúdium, ale texty, dizajn a obrázky prosím nepoužívaj bez opýtania.

---

<div align="center">

**Alex Poliak**

[![Web](https://img.shields.io/badge/apoliak.online-0b1020?style=flat-square)](https://apoliak.online)
[![GitHub](https://img.shields.io/badge/GitHub-Apoliak7777-181717?style=flat-square&logo=github)](https://github.com/Apoliak7777)
[![Email](https://img.shields.io/badge/Email-alexpoliak21%40gmail.com-EA4335?style=flat-square&logo=gmail&logoColor=white)](mailto:info@aiucenie.online)

</div>
