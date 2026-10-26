<div align="center">

[![Slovencina](https://img.shields.io/badge/SK-Sloven%C4%8Dina-30363d?style=for-the-badge)](README.md) [![English](https://img.shields.io/badge/EN-English-2ea043?style=for-the-badge)](README.en.md)

</div>

<div align="center">

# 🎓 AI Učenie (AI Tutoring)

**Static website for online AI training for small businesses and sole traders — a free 15-minute intro call, then €25 per 60 minutes one-on-one, with a booking widget and no backend at all.**

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Zero Build](https://img.shields.io/badge/build-none-success?style=flat-square)
![Zero Dependencies](https://img.shields.io/badge/dependencies-0-success?style=flat-square)

[Quick Start](#-quick-start) - [Schedule Setup](#️-schedule-setup) - [Known Limitations](#️-known-limitations)

</div>

---

## 📑 Table of Contents

- [🔎 Overview](#-overview)
- [✨ Features](#-features)
- [🚀 Quick Start](#-quick-start)
- [📁 Project Structure](#-project-structure)
- [⚙️ Schedule Setup](#️-schedule-setup)
- [📮 Booking Delivery](#-booking-delivery)
- [🛠️ Technologies](#️-technologies)
- [🌍 Deployment](#-deployment)
- [⚠️ Known Limitations](#️-known-limitations)
- [📄 License](#-license)

---

## 🔎 Overview

**AI Učenie** is a landing and booking page for online AI training aimed at small businesses and sole traders, where people learn to use AI (ChatGPT, Claude) on their own everyday work — shared screen, their real tasks, no lecture.

The whole site lives in a single `index.html` file: markup, CSS and JavaScript are inline. There is no backend, no build step and no package manager. The booking widget computes free slots from a weekly plan, the client chooses a free intro call or a paid lesson, a day and a time, and sends the booking in one click via Gmail, Outlook, their mail program, SMS or by copying it (or to a custom endpoint).

The user interface is entirely in Slovak (`<html lang="sk">`), in the formal register. Design: paper and ink, light theme with a system dark variant, one blue accent, Newsreader serif headings, fonts and images self-hosted in the repo, no third-party requests on load. Order: hero with a real sample of the lesson summary and three facts → what AI can do in seven industries (tabs) → how it works → who teaches (with certificates) → pricing → FAQ → booking, with a sticky bar on mobile.

---

## ✨ Features

- 📅 **Three-step booking widget** - slot → contact details → sending, with visual step states and animated transitions.
- 🆓 **Free intro call or a lesson** - a toggle in the first step; buttons across the page (`data-typ="free"` / `"paid"`) set it automatically, changing the price, the note prompt and the `.ics` duration.
- 🗂️ **Industry tabs** - seven industries (accounting, real estate, marketing, HR, travel, insurance, other offices), each with four tasks, a sample prompt and a personal-data warning; a link like `aiucenie.online/#reality` opens that industry directly (for targeted campaigns).
- 🗓️ **Automatic free slots** - the next `POCET_DNI` days are generated from the weekly `PLAN`; today's slots are only offered 2 hours ahead and weekends are skipped.
- 📦 **Package picker inside the booking** - single hour, two in a row, 3 h / 6 h bundle or a small team; the choice is included in the submitted data.
- 📮 **One-click sending** - Gmail, Outlook, the mail program (`mailto:`), SMS on mobile or copying the text; optionally `fetch` to a custom endpoint (FormSubmit, Web3Forms) that falls back to these paths when it fails.
- 🎓 **Verifiable certificates** - three certificate previews in `img/` with links to verify them with the issuer.
- 🕳️ **Honeypot** - a hidden `web` field; when a spam bot fills it in, the booking is silently dropped.
- ⏰ **Stale-slot check** - if the tab was left open too long and the chosen slot has passed, the widget sends the client back to the picker instead of submitting a booking in the past.
- 📆 **Calendar export (.ics)** - with reminders one day and one hour before the lesson, and the organizer set.
- 🚫 **Works without JavaScript** - the content stays visible and the booking box shows an e-mail address and phone number instead.
- ♿ **Accessibility** - skip link, WAI-ARIA tabs (arrow keys, Home/End), `aria-pressed` on day chips, `aria-label` on slots, `role="alert"` on errors, `prefers-reduced-motion` support, non-breaking spaces after one-letter Slovak prepositions.
- 🔍 **SEO & sharing** - JSON-LD (`Service` + `FAQPage`), Open Graph with a custom 1200×630 image, sitemap, robots.txt, custom 404.

---

## 🚀 Quick Start

```bash
git clone https://github.com/Apoliak7777/ai-ucenie.git
cd ai-ucenie
```

Open `index.html` in a browser — that's it. No install, no dependencies.

For a local server (relative links, robots/sitemap):

```bash
python -m http.server 8000
```

---

## 📁 Project Structure

```
ai-ucenie/
├── index.html            # the whole page: markup + CSS + JS inline
├── ochrana-udajov.html   # privacy policy subpage (noindex)
├── 404.html              # custom not-found page
├── og-image.png          # 1200×630 link-sharing image
├── og-image.svg          # OG image source (fonts from fonts/, PNG is a browser capture of it)
├── fonts/                # Newsreader (headings) + Manrope (text), self-hosted, no Google Fonts
├── img/                  # certificate previews for the "who teaches you" section
├── robots.txt            # indexing allowed, privacy page excluded
├── sitemap.xml           # single URL
├── .nojekyll             # disables Jekyll on GitHub Pages
├── CNAME                 # aiucenie.online domain for GitHub Pages
└── PRECITAJ-MA.txt       # editing and deployment notes (Slovak)
```

---

## ⚙️ Schedule Setup

Everything is configured in one place — at the top of the `<script>` block in `index.html`:

| Variable | Meaning |
|---|---|
| `PLAN` | times per weekday (`1` = Monday … `6` = Saturday, `0` = Sunday); Monday to Friday from 15:00, slots every 70 minutes = 60 min lesson + 10 min break |
| `OBSADENE` | manual list of taken slots in the `"2026-07-28 9:00"` format |
| `POCET_DNI` | how many days with free slots to offer |
| `MOJ_MAIL` | where bookings are delivered |

---

## 📮 Booking Delivery

After clicking Continue, the third step shows the finished booking (type, slot, package, name, e-mail, phone, note) and the client sends it in one click: **Gmail** and **Outlook** open in the browser with the e-mail pre-filled, **Other mail program** opens `mailto:`, mobile gets **SMS** to `MOJ_TEL`, and **Copy text** puts the whole booking on the clipboard. Plus an `.ics` calendar file and the phone number in case none of that works.

| Variable | Meaning |
|---|---|
| `MOJ_MAIL` | where bookings go (`info@aiucenie.online`) |
| `MOJ_TEL` | number for SMS (`+421902464022`) |
| `ENDPOINT` | empty = the client sends it (default); set = the booking is sent via `fetch` in the background, e.g. to FormSubmit or Web3Forms |
| `ENDPOINT_EXTRA` | extra fields the service requires (e.g. `access_key`) |

Example for FormSubmit (no sign-up, the first booking has to be confirmed in an e-mail from FormSubmit):

```js
var ENDPOINT = "https://formsubmit.co/ajax/info@aiucenie.online";
var ENDPOINT_EXTRA = { _subject: "Nová rezervácia: AI Učenie", _template: "table" };
```

When delivery via `ENDPOINT` fails, the widget offers the e-mail paths on its own. When `ENDPOINT` is switched on, the service must be added to `ochrana-udajov.html` as a data processor.

---

## 🛠️ Technologies

| Technology | Usage |
|---|---|
| HTML5 | semantic markup, `role="tablist"` tabs, `<details>` for the booking preview, native `<form>` |
| CSS3 | custom properties, grid, `clamp()`, gradients, animations |
| Vanilla JS (ES5) | booking widget, slot generation, `.ics` export |
| JSON-LD | `Service` and `FAQPage` structured data |

---

## 🌍 Deployment

GitHub Pages from `main`, `CNAME` = `aiucenie.online`, A records at Hostinger point to GitHub. Deploy = push to `main`, live within a minute or two. Nothing else is needed: the site is pure static files.

---

## ⚠️ Known Limitations

- 🗓️ **`OBSADENE` is a manual list** - two people can book the same slot; a taken slot must be added to `OBSADENE` in `index.html` after every agreed lesson.
- 📮 **The client sends the booking** - without `ENDPOINT` the page cannot tell whether the booking was actually sent; that is why it offers five paths (Gmail, Outlook, `mailto:`, SMS, copy) and a phone number.
- 📊 **No analytics** - the page does not count visits, so there is no way to tell how many campaign recipients opened it.
- 🕐 **Times are in Slovak time** - the widget does not convert time zones; the page says so.

---

## 📄 License

This project is published without a license — all rights reserved. Feel free to read the code to learn from it, but please don't reuse the texts, design or images without asking.

---

<div align="center">

**Alex Poliak**

[![Web](https://img.shields.io/badge/apoliak.online-0b1020?style=flat-square)](https://apoliak.online)
[![GitHub](https://img.shields.io/badge/GitHub-Apoliak7777-181717?style=flat-square&logo=github)](https://github.com/Apoliak7777)
[![Email](https://img.shields.io/badge/Email-alexpoliak21%40gmail.com-EA4335?style=flat-square&logo=gmail&logoColor=white)](mailto:info@aiucenie.online)

</div>
