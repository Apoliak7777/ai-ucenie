<div align="center">

[![Slovencina](https://img.shields.io/badge/SK-Sloven%C4%8Dina-2ea043?style=for-the-badge)](README.md) [![English](https://img.shields.io/badge/EN-English-30363d?style=for-the-badge)](README.en.md)

</div>

<div align="center">

# 🎓 AI Učenie

**Statická web stránka online školenia AI pre malé firmy a živnostníkov — úvodný 15-minútový hovor zadarmo, potom 25 € za 60 minút jeden na jedného, s rezervačným widgetom bez jediného backendu.**

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

**AI Učenie** je prezentačná a rezervačná stránka pre online školenie AI pre malé firmy a živnostníkov, na ktorom sa človek učí používať AI (ChatGPT, Claude) na svojej vlastnej práci — zdieľaná obrazovka, jeho reálne úlohy, žiadna prednáška.

Celý web žije v jednom súbore `index.html`: markup, CSS aj JavaScript sú inline. Nie je tu backend, build step ani package manager. Rezervačný widget si sám vypočíta voľné termíny z týždenného plánu, klient si vyberie úvodný hovor zadarmo alebo platenú hodinu, deň a čas, a rezerváciu odošle jedným klikom cez Gmail, Outlook, svoj e-mailový program, SMS alebo skopírovaním (prípadne na vlastný endpoint).

Používateľské rozhranie je kompletne v slovenčine (`<html lang="sk">`), s vykaním. Dizajn: neutrálna svetlá téma s tmavou podľa systému, takmer čierny text a jediný akcent – limetkový „zvýrazňovač“ `#D6FF4B`; IBM Plex Sans na všetko, IBM Plex Mono na zadania pre AI; písma aj obrázky hostované priamo v repe, žiadne cudzie požiadavky pri načítaní. Poradie: hero so skutočnou ukážkou zápisu → pás so zárukou a cenami → čo AI zvládne v siedmich odboroch (záložky) → časová os priebehu → kto učí (vejár certifikátov) → cenník ako mriežka → otázky → rezervácia; na mobile ju pripomína lepiaci pás.

---

## ✨ Funkcie

- 📅 **Trojkrokový rezervačný widget** - termín → kontakt → odoslanie, s vizuálnym stavom krokov a animovanými prechodmi.
- 🆓 **Úvodný hovor zadarmo alebo hodina** - prepínač v prvom kroku; tlačidlá na stránke (`data-typ="free"` / `"paid"`) ho nastavia samy, mení sa cena, otázka v poznámke aj dĺžka v `.ics`.
- 🗂️ **Odbory v záložkách** - sedem odborov (účtovníctvo, reality, marketing, personalistika, cestovný ruch, poistenie, iné kancelárie) so štyrmi úlohami, ukážkou zadania a upozornením na osobné údaje; odkaz `aiucenie.online/#reality` otvorí rovno daný odbor (na cielené kampane).
- 🗓️ **Automatické voľné termíny** - z týždenného plánu `PLAN` sa vygeneruje najbližších `POCET_DNI` dní; dnešné termíny sa ponúkajú len 2 hodiny dopredu a víkend sa vynecháva.
- 📦 **Výber balíka priamo v rezervácii** - jedna hodina, dve za sebou, balík 3 h / 6 h alebo malý tím; vybraný balík ide aj do odoslaných dát.
- 📮 **Odoslanie jedným klikom** - Gmail, Outlook, e-mailový program (`mailto:`), SMS na mobile alebo skopírovanie textu; voliteľne `fetch` na vlastný endpoint (FormSubmit, Web3Forms) s návratom na tieto cesty, keď zlyhá.
- 🎓 **Certifikáty s overením** - náhľady troch certifikátov v `img/` ako vejár, s odkazmi na overenie u vydavateľa.
- ✨ **Jemné animácie** - zvýrazňovač pod nadpisom, zadanie pre AI sa vypíše ako pri písaní, posuvná čiara záložiek, časová os, ktorá sa nakreslí, vejár certifikátov, lepiaca hlavička; len `transform`/`opacity` (zvýrazňovač raz cez `background-size`), všetko vypína `prefers-reduced-motion`.
- 🕳️ **Pasca na roboty** - skryté pole `web`; keď ho spam bot vyplní, rezervácia sa ticho zahodí.
- ⏰ **Kontrola prešlého termínu** - ak mal klient stránku otvorenú pridlho a termín medzitým prešiel, widget ho vráti na výber namiesto odoslania rezervácie do minulosti.
- 📆 **Export do kalendára (.ics)** - s pripomienkou deň vopred aj hodinu pred začiatkom a organizátorom.
- 🚫 **Funguje aj bez JavaScriptu** - obsah stránky je viditeľný a v rezervačnom boxe sa zobrazí e-mail a telefón.
- ♿ **Prístupnosť** - skip-link, záložky podľa vzoru WAI-ARIA (šípky, Home/End), `aria-pressed` na dňoch, `aria-label` na termínoch, `role="alert"` na chybách, `prefers-reduced-motion`, pevné medzery za jednopísmenovými predložkami.
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
├── fonts/                # IBM Plex Sans + IBM Plex Mono, hostované tu, nie na Google Fonts (Newsreader a Manrope sa už nepoužívajú)
├── img/                  # náhľady certifikátov v sekcii Kto vás bude učiť
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

Po kliknutí na Pokračovať dostane klient v treťom kroku hotovú rezerváciu (typ, termín, balík, meno, mail, telefón, poznámka) a odošle ju jedným klikom: **Gmail** a **Outlook** sa otvoria v prehliadači s vyplneným mailom, **Iný e-mailový program** otvorí `mailto:`, na mobile je **SMS** na `MOJ_TEL` a **Skopírovať text** dá celú rezerváciu do schránky. K tomu `.ics` do kalendára a telefón, keby nič z toho nešlo.

| Premenná | Význam |
|---|---|
| `MOJ_MAIL` | kam rezervácie chodia (`info@aiucenie.online`) |
| `MOJ_TEL` | číslo pre SMS (`+421902464022`) |
| `ENDPOINT` | prázdne = klient odošle sám (predvolené); vyplnené = rezervácia sa odošle `fetch`-om na pozadí, napr. na FormSubmit alebo Web3Forms |
| `ENDPOINT_EXTRA` | polia navyše, ktoré služba vyžaduje (napr. `access_key`) |

Príklad pre FormSubmit (bez registrácie, prvú rezerváciu treba potvrdiť v maili od FormSubmit):

```js
var ENDPOINT = "https://formsubmit.co/ajax/info@aiucenie.online";
var ENDPOINT_EXTRA = { _subject: "Nová rezervácia: AI Učenie", _template: "table" };
```

Keď odoslanie cez `ENDPOINT` zlyhá, widget ponúkne cesty cez mail sám. Pri zapnutí `ENDPOINT` treba službu doplniť do `ochrana-udajov.html` ako sprostredkovateľa.

---

## 🛠️ Technológie

| Technológia | Použitie |
|---|---|
| HTML5 | sémantický markup, záložky s `role="tablist"`, `<details>` pre náhľad rezervácie, natívny `<form>` |
| CSS3 | custom properties, grid, `clamp()`, gradienty, animácie |
| Vanilla JS (ES5) | rezervačný widget, generovanie termínov, `.ics` export |
| JSON-LD | štruktúrované dáta `Service` a `FAQPage` |

---

## 🌍 Nasadenie

GitHub Pages z vetvy `main`, súbor `CNAME` = `aiucenie.online`, A záznamy u Hostingera mieria na GitHub. Nasadenie = push do `main`, o minútu-dve je zmena naživo. Nič iné netreba: stránka je čistá statika.

---

## ⚠️ Známe obmedzenia

- 🗓️ **`OBSADENE` je ručný zoznam** - dvaja ľudia si vedia rezervovať ten istý čas; obsadený termín treba po každej dohodnutej hodine dopísať do `OBSADENE` v `index.html`.
- 📮 **Rezerváciu odosiela klient** - bez `ENDPOINT` stránka nevie, či rezervácia naozaj odišla; ponúka preto päť ciest (Gmail, Outlook, `mailto:`, SMS, kopírovanie) a telefón.
- 📊 **Žiadna analytika** - stránka nemeria návštevy, takže sa nedá zistiť, koľko ľudí z kampane web otvorilo.
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
