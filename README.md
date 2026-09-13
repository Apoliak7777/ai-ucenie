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

Používateľské rozhranie je kompletne v slovenčine (`<html lang="sk">`). Dizajn: papier a atrament, svetlá téma s tmavou podľa systému, jeden modrý akcent, nadpisy serifom Newsreader, písma hostované priamo v repe, žiadne cudzie požiadavky pri načítaní. V hero stojí skutočná ukážka zápisu, ktorý klient po hodine dostane; rezervačný widget je na konci stránky, na mobile ho pripomína lepiaci pás. Rezervácia je obyčajný e-mail od klienta, stránka nepotrebuje žiadny server.

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
├── CNAME                 # doména aiucenie.online pre GitHub Pages
└── PRECITAJ-MA.txt       # poznámky k úpravám a nasadeniu
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

Po kliknutí na Potvrdiť sa klientovi otvorí jeho mailový program s hotovým mailom pre `MOJ_MAIL` (termín, balík, meno, mail, telefón, poznámka). Stačí ho odoslať; k tomu dostane `.ics` do kalendára a tlačidlo „Neotvoril sa mail?“.

| Premenná | Význam |
|---|---|
| `MOJ_MAIL` | kam rezervácie chodia (`info@aiucenie.online`) |
| `ENDPOINT` | prázdne = cesta cez mail (predvolené); vyplnené = rezervácia sa odošle `fetch`-om na pozadí, napr. na Web3Forms |
| `ENDPOINT_EXTRA` | polia navyše, ktoré služba vyžaduje (napr. `access_key`) |

Príklad pre Web3Forms:

```js
var ENDPOINT = "https://api.web3forms.com/submit";
var ENDPOINT_EXTRA = { access_key: "tvoj-kluc", subject: "Nová rezervácia: AI Učenie" };
```

Keď odoslanie cez `ENDPOINT` zlyhá, widget zobrazí chybu a sám ponúkne e-mail ako záložnú cestu.

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

GitHub Pages z vetvy `main`, súbor `CNAME` = `aiucenie.online`, A záznamy u Hostingera mieria na GitHub. Nasadenie = push do `main`, o minútu-dve je zmena naživo. Nič iné netreba: stránka je čistá statika.

---

## ⚠️ Známe obmedzenia

- 🗓️ **`OBSADENE` je ručný zoznam** - dvaja ľudia si vedia rezervovať ten istý čas; obsadený termín treba po každej dohodnutej hodine dopísať do `OBSADENE` v `index.html`.
- 📮 **Rezervácia ide cez `mailto:`** - klientovi sa otvorí jeho mailový program s vyplneným mailom; ak žiadny nastavený nemá, musí mail napísať sám (adresa a telefón sú na stránke).
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
