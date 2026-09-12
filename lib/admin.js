// /admin: prehľad rezervácií za heslom. Heslo je tajomstvo ADMIN_HESLO v Cloudflare
// (Pages → Settings → Variables and Secrets), lokálne v .dev.vars. Prihlasuje sa cez
// HTTP Basic: prehliadač sa sám spýta na meno (ľubovoľné) a heslo a pamätá si ho do zavretia okna.

import { json, zabezpecTabulku } from "./rezervacie.js";

function nepovoleny() {
  return new Response("Prihlásenie je potrebné.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="AI Ucenie", charset="UTF-8"',
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

// porovnanie bez skratky pri prvom rozdiele, aby sa z času odpovede nedalo nič vyčítať
function rovnake(a, b) {
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  if (x.length !== y.length) return false;
  let r = 0;
  for (let i = 0; i < x.length; i++) r |= x[i] ^ y[i];
  return r === 0;
}

function overeny(request, heslo) {
  const h = request.headers.get("Authorization") || "";
  if (!h.startsWith("Basic ")) return false;
  let raw;
  try {
    raw = atob(h.slice(6));
  } catch (_) {
    return false;
  }
  const text = new TextDecoder().decode(Uint8Array.from(raw, (c) => c.charCodeAt(0)));
  const i = text.indexOf(":");
  return rovnake(i >= 0 ? text.slice(i + 1) : "", heslo);
}

export async function obsluzAdmin(request, env, cesta) {
  if (!env.ADMIN_HESLO) {
    return new Response("V Cloudflare chýba tajomstvo ADMIN_HESLO (Pages → Settings → Variables and Secrets).", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  if (!overeny(request, env.ADMIN_HESLO)) return nepovoleny();

  const metoda = request.method;

  if (cesta === "" || cesta === "index.html") {
    if (metoda !== "GET") return json({ ok: false, chyba: "Nepovolená metóda." }, 405);
    return new Response(STRANKA, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  if (!env.DB) return json({ ok: false, chyba: "Databáza nie je pripojená (Bindings → D1 ako DB)." }, 500);
  await zabezpecTabulku(env.DB);

  if (cesta === "api/rezervacie") {
    if (metoda !== "GET") return json({ ok: false, chyba: "Nepovolená metóda." }, 405);
    const { results } = await env.DB
      .prepare("SELECT id, slot, termin, balik, meno, mail, tel, poznamka, kedy FROM rezervacie ORDER BY slot")
      .all();
    return json({ rezervacie: results });
  }

  const m = cesta.match(/^api\/rezervacie\/(\d+)$/);
  if (m) {
    if (metoda !== "DELETE") return json({ ok: false, chyba: "Nepovolená metóda." }, 405);
    const r = await env.DB.prepare("DELETE FROM rezervacie WHERE id = ?").bind(Number(m[1])).run();
    return json({ ok: true, zmazane: r.meta.changes });
  }

  return json({ ok: false, chyba: "Neznáma adresa." }, 404);
}

// Stránka je tu ako text, lebo Pages Functions nevedia importovať .html bez ďalšej konfigurácie.
const STRANKA = `<!doctype html>
<html lang="sk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Rezervácie: AI Učenie</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='8' fill='%231F45D8'/%3E%3Ctext x='32' y='44' font-family='Georgia,serif' font-weight='600' font-size='34' text-anchor='middle' fill='%23fff'%3EA%3C/text%3E%3C/svg%3E">
<style>
@font-face{font-family:'Newsreader';font-style:normal;font-weight:500;font-display:swap;src:url('/fonts/newsreader-500-latin-ext.woff2') format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:'Newsreader';font-style:normal;font-weight:500;font-display:swap;src:url('/fonts/newsreader-500-latin.woff2') format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:'Manrope';font-style:normal;font-weight:200 800;font-display:swap;src:url('/fonts/manrope-latin-ext.woff2') format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:'Manrope';font-style:normal;font-weight:200 800;font-display:swap;src:url('/fonts/manrope-latin.woff2') format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
:root{color-scheme:light dark;--bg:#F8F7F4;--surface:#FFFFFF;--ink:#151517;--ink-2:#3A3A3E;--muted:#6E6E74;
  --line:rgba(21,21,23,.13);--box-line:rgba(21,21,23,.08);--acc:#1F45D8;--acc-soft:rgba(31,69,216,.08);--err:#B3261E;
  --shadow:0 1px 2px rgba(21,21,23,.06),0 24px 48px -28px rgba(21,21,23,.32);
  --display:"Newsreader",Georgia,serif;--body:"Manrope","Segoe UI",system-ui,sans-serif;--r:6px}
@media (prefers-color-scheme:dark){:root{--bg:#141416;--surface:#1D1D20;--ink:#EDEBE6;--ink-2:#C9C7C1;--muted:#9A9893;
  --line:rgba(237,235,230,.15);--box-line:rgba(237,235,230,.10);--acc:#8FA5FF;--acc-soft:rgba(143,165,255,.12);--err:#F2A19A;
  --shadow:0 1px 2px rgba(0,0,0,.4),0 24px 48px -28px rgba(0,0,0,.8)}}
*,*::before,*::after{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--body);font-size:16px;line-height:1.55}
a{color:inherit}
:focus-visible{outline:2px solid var(--acc);outline-offset:3px;border-radius:4px}
.shell{max-width:1040px;margin-inline:auto;padding-inline:clamp(16px,4vw,40px)}
.top{display:flex;align-items:center;justify-content:space-between;gap:16px;height:64px}
.brand{font-family:var(--display);font-weight:500;font-size:1.25rem;text-decoration:none}
.top a:not(.brand){font-size:.92rem;font-weight:600;color:var(--ink-2);text-decoration:none;padding:10px 0}
h1{font-family:var(--display);font-weight:500;font-size:clamp(1.9rem,4vw,2.5rem);line-height:1.1;margin:28px 0 8px}
h2{font-family:var(--display);font-weight:500;font-size:1.4rem;margin:36px 0 12px;display:flex;align-items:baseline;gap:10px}
h2 span{font-family:var(--body);font-size:.9rem;font-weight:600;color:var(--muted)}
.sub{color:var(--ink-2);margin:0 0 6px;max-width:64ch}
.stav{margin-top:16px;font-size:.92rem;color:var(--muted)}
.stav.err{color:var(--err);font-weight:600}
.zoznam{display:grid;gap:10px}
.r{display:grid;grid-template-columns:150px minmax(0,1fr) auto;gap:6px 22px;align-items:start;padding:16px 18px;
  background:var(--surface);border:1px solid var(--box-line);border-radius:8px;box-shadow:var(--shadow)}
.r.min{opacity:.6}
.r__kedy b{display:block;font-family:var(--display);font-size:1.25rem;line-height:1.15;font-variant-numeric:tabular-nums}
.r__kedy small{display:block;color:var(--muted);font-size:.82rem;margin-top:4px}
.r__kto{min-width:0}
.r__kto b{font-weight:700}
.r__kto .k{display:flex;flex-wrap:wrap;gap:4px 16px;margin-top:2px}
.r__kto .k a{color:var(--ink);text-decoration:none;border-bottom:1px solid var(--acc);font-weight:600;padding:6px 0}
.r__kto .balik{color:var(--ink-2);font-size:.92rem;margin-top:4px}
.r__kto .pozn{margin-top:8px;padding:10px 12px;background:var(--acc-soft);border-left:3px solid var(--acc);border-radius:0 var(--r) var(--r) 0;white-space:pre-wrap;word-break:break-word;font-size:.95rem}
.r__kto .prijate{color:var(--muted);font-size:.82rem;margin-top:8px}
.zmaz{font:inherit;font-weight:600;font-size:.88rem;color:var(--err);background:transparent;border:1px solid var(--line);border-radius:var(--r);
  padding:9px 14px;cursor:pointer;white-space:nowrap}
.zmaz:hover{border-color:var(--err)}
.zmaz:disabled{opacity:.5;cursor:progress}
.prazdne{padding:18px;border:1px dashed var(--line);border-radius:8px;color:var(--muted)}
.foot{margin:48px 0 40px;font-size:.85rem;color:var(--muted)}
@media (max-width:720px){.r{grid-template-columns:1fr}.zmaz{justify-self:start}}
</style>
</head>
<body>
<header class="shell top">
  <a class="brand" href="/admin">Rezervácie</a>
  <a href="/">Späť na stránku</a>
</header>
<main class="shell">
  <h1>Kto si rezervoval hodinu</h1>
  <p class="sub">Všetko, čo ľudia vyplnili na stránke. Zmazaním sa termín uvoľní späť do ponuky, takže ho môže vziať niekto iný.</p>
  <p class="stav" id="stav">Načítavam…</p>
  <section>
    <h2>Nadchádzajúce <span id="n1"></span></h2>
    <div class="zoznam" id="z1"></div>
  </section>
  <section>
    <h2>Prebehnuté <span id="n2"></span></h2>
    <div class="zoznam" id="z2"></div>
  </section>
  <p class="foot">Prihlásenie si prehliadač pamätá do zavretia okna. Heslo sa mení v Cloudflare (Settings → Variables and Secrets → ADMIN_HESLO).</p>
</main>
<script>
(function(){
  "use strict";
  var $ = function(id){ return document.getElementById(id); };
  var DNI = ["Ne","Po","Ut","St","Št","Pi","So"];

  function slotNaDatum(slot){
    var m = slot.match(/^(\\d{4})-(\\d{2})-(\\d{2}) (\\d{1,2}):(\\d{2})$/);
    return m ? new Date(+m[1], +m[2]-1, +m[3], +m[4], +m[5]) : null;
  }
  function pekne(d){
    return DNI[d.getDay()] + " " + d.getDate() + ". " + (d.getMonth()+1) + ". " + d.getFullYear() +
           " o " + d.getHours() + ":" + (d.getMinutes() < 10 ? "0" : "") + d.getMinutes();
  }
  function prijate(kedy){
    /* D1 ukladá UTC bez označenia pásma */
    var d = new Date(kedy.replace(" ", "T") + "Z");
    return isNaN(d) ? kedy : new Intl.DateTimeFormat("sk-SK", { dateStyle: "medium", timeStyle: "short" }).format(d);
  }
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){ return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]; }); }

  function riadok(r, minuly){
    var d = slotNaDatum(r.slot);
    var el = document.createElement("article");
    el.className = "r" + (minuly ? " min" : "");
    el.setAttribute("data-id", r.id);
    var tel = (r.tel || "").replace(/\\s+/g, "");
    el.innerHTML =
      '<div class="r__kedy"><b>' + esc(d ? pekne(d) : r.termin) + '</b><small>' + esc(r.slot) + '</small></div>' +
      '<div class="r__kto"><b>' + esc(r.meno) + '</b>' +
        '<div class="k"><a href="mailto:' + esc(r.mail) + '">' + esc(r.mail) + '</a>' +
        (tel ? '<a href="tel:' + esc(tel) + '">' + esc(r.tel) + '</a>' : '') + '</div>' +
        '<div class="balik">' + esc(r.balik || "Jedna hodina") + '</div>' +
        (r.poznamka && r.poznamka !== "-" ? '<div class="pozn">' + esc(r.poznamka) + '</div>' : '') +
        '<div class="prijate">Prijaté ' + esc(prijate(r.kedy)) + '</div></div>' +
      '<button type="button" class="zmaz">Zmazať</button>';
    return el;
  }

  function nacitaj(){
    fetch("/admin/api/rezervacie", { headers: { "Accept": "application/json" } })
      .then(function(r){ if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function(j){
        var teraz = Date.now(), b = [], m = [];
        (j.rezervacie || []).forEach(function(r){
          var d = slotNaDatum(r.slot);
          (d && d.getTime() + 60*60*1000 < teraz ? m : b).push(r);
        });
        m.reverse();
        var z1 = $("z1"), z2 = $("z2");
        z1.innerHTML = ""; z2.innerHTML = "";
        b.forEach(function(r){ z1.appendChild(riadok(r, false)); });
        m.forEach(function(r){ z2.appendChild(riadok(r, true)); });
        if (!b.length) z1.innerHTML = '<p class="prazdne">Zatiaľ žiadna nadchádzajúca rezervácia.</p>';
        if (!m.length) z2.innerHTML = '<p class="prazdne">Nič.</p>';
        $("n1").textContent = b.length; $("n2").textContent = m.length;
        $("stav").textContent = "Spolu " + (b.length + m.length) + ". Aktualizované " +
          new Intl.DateTimeFormat("sk-SK", { timeStyle: "short" }).format(new Date()) + ".";
        $("stav").className = "stav";
      })
      .catch(function(e){
        $("stav").textContent = "Načítanie zlyhalo (" + e.message + "). Obnov stránku.";
        $("stav").className = "stav err";
      });
  }

  document.addEventListener("click", function(ev){
    var b = ev.target.closest(".zmaz"); if (!b) return;
    var el = b.closest(".r"), id = el.getAttribute("data-id");
    var meno = el.querySelector(".r__kto b").textContent, kedy = el.querySelector(".r__kedy b").textContent;
    if (!confirm("Zmazať rezerváciu?\\n\\n" + meno + ", " + kedy + "\\n\\nTermín sa uvoľní späť do ponuky.")) return;
    b.disabled = true; b.textContent = "Mažem…";
    fetch("/admin/api/rezervacie/" + id, { method: "DELETE", headers: { "Accept": "application/json" } })
      .then(function(r){ if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function(){ nacitaj(); })
      .catch(function(e){ b.disabled = false; b.textContent = "Zmazať"; alert("Nepodarilo sa zmazať (" + e.message + ")."); });
  });

  nacitaj();
})();
</script>
</body>
</html>
`;
