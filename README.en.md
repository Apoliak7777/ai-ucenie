<div align="center">

[![Slovencina](https://img.shields.io/badge/SK-Sloven%C4%8Dina-30363d?style=for-the-badge)](README.md) [![English](https://img.shields.io/badge/EN-English-2ea043?style=for-the-badge)](README.en.md)

</div>

<div align="center">

# 🎓 AI Učenie (AI Tutoring)

**Static website for booking private one-on-one online AI lessons — €25 per 60 minutes, with a three-step booking widget and no backend at all.**

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

**AI Učenie** is a landing and booking page for private online lessons where people learn to use AI on their own everyday work — shared screen, their real tasks, no lecture.

The whole site lives in a single `index.html` file: markup, CSS and JavaScript are inline. There is no backend, no build step and no package manager. The booking widget computes free slots from a weekly plan, the client picks a day, time and package, and the booking is delivered either to a custom endpoint or via a pre-filled e-mail.

The user interface is entirely in Slovak (`<html lang="sk">`) and the site is ready to be deployed as GitHub Pages on the `ai.apoliak.online` domain.

---

## ✨ Features

- 📅 **Three-step booking widget** - pick a slot → contact details → confirmation, with visual step states and animated transitions.
- 🗓️ **Automatic free slots** - the next `POCET_DNI` days are generated from the weekly `PLAN`; today's slots are only offered 2 hours ahead and Sundays are skipped.
- 📦 **Package picker inside the booking** - single hour, two in a row, 3 h / 6 h bundle or a small team; the choice is included in the submitted data.
- 📮 **Two delivery paths** - `fetch` to a custom endpoint (e.g. Web3Forms), with automatic fallback to a pre-filled `mailto:` when no endpoint is set or the request fails.
- 🕳️ **Honeypot** - a hidden `web` field; when a spam bot fills it in, the booking is silently dropped.
- ⏰ **Stale-slot check** - if the tab was left open too long and the chosen slot has passed, the widget sends the client back to the picker instead of submitting a booking in the past.
- 📆 **Calendar export (.ics)** - with reminders one day and one hour before the lesson, and the organizer set.
- 🚫 **Works without JavaScript** - the content stays visible and the booking box shows an e-mail address and phone number instead.
- ♿ **Accessibility** - skip link, `aria-pressed` on day chips, `aria-label` on slots, `role="alert"` on errors, `prefers-reduced-motion` support.
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
├── og-image.svg          # OG image source
├── robots.txt            # indexing allowed, privacy page excluded
├── sitemap.xml           # single URL
├── .nojekyll             # disables Jekyll on GitHub Pages
└── PRECITAJ-MA.txt       # editing and deployment notes (Slovak)
```

---

## ⚙️ Schedule Setup

Everything is configured in one place — at the top of the `<script>` block in `index.html`:

| Variable | Meaning |
|---|---|
| `PLAN` | times per weekday (`1` = Monday … `6` = Saturday, `0` = Sunday); slots run every 75 minutes = 60 min lesson + 15 min break |
| `OBSADENE` | manual list of taken slots in the `"2026-07-28 9:00"` format |
| `POCET_DNI` | how many days with free slots to offer |
| `MOJ_MAIL` | where bookings are delivered |

---

## 📮 Booking Delivery

| Variable | Meaning |
|---|---|
| `ENDPOINT` | empty = a pre-filled e-mail opens for the client; set = the booking is sent via `fetch` in the background |
| `ENDPOINT_EXTRA` | extra fields the service requires (e.g. `access_key`) |

Example for Web3Forms:

```js
var ENDPOINT = "https://api.web3forms.com/submit";
var ENDPOINT_EXTRA = { access_key: "your-key", subject: "Nová rezervácia — AI Učenie" };
```

When delivery fails, the widget shows an error and offers e-mail as the fallback path on its own.

---

## 🛠️ Technologies

| Technology | Usage |
|---|---|
| HTML5 | semantic markup, `<details>` for the FAQ, native `<form>` |
| CSS3 | custom properties, grid, `clamp()`, gradients, animations |
| Vanilla JS (ES5) | booking widget, slot generation, `.ics` export |
| JSON-LD | `Service` and `FAQPage` structured data |

---

## 🌍 Deployment

The site is ready for GitHub Pages with the custom domain `ai.apoliak.online` (CNAME record `ai → apoliak7777.github.io`). For now it lives as a repository only — deployment comes later.

---

## ⚠️ Known Limitations

- 🗓️ **`OBSADENE` is a manual list** - two people can book the same slot; taken slots must be added by hand after every booking until a calendar integration exists.
- 📮 **Without an endpoint, bookings go through `mailto:`** - if the client has no mail client configured, the booking may never be sent.
- 🕐 **Times are in Slovak time** - the widget does not convert time zones; the page says so.

---

## 📄 License

This project is published without a license — all rights reserved. Feel free to read the code to learn from it, but please don't reuse the texts, design or images without asking.

---

<div align="center">

**Alex Poliak**

[![Web](https://img.shields.io/badge/apoliak.online-0b1020?style=flat-square)](https://apoliak.online)
[![GitHub](https://img.shields.io/badge/GitHub-Apoliak7777-181717?style=flat-square&logo=github)](https://github.com/Apoliak7777)
[![Email](https://img.shields.io/badge/Email-alexpoliak21%40gmail.com-EA4335?style=flat-square&logo=gmail&logoColor=white)](mailto:alexpoliak21@gmail.com)

</div>
