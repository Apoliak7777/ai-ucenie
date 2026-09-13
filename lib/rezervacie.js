// Spoločný kód rezervačného backendu. Beží na dvoch miestach s tou istou logikou:
//   - worker/index.js      = Cloudflare Worker na workers.dev (ostrá cesta, stránka je na GitHub Pages)
//   - functions/api/*.js   = Cloudflare Pages Functions (keby sa niekedy celá stránka presunula na Pages)

import { WorkerMailer } from "worker-mailer";

// Čo sa nemení sa nenastavuje v Cloudflare — stačia tajomstvá SMTP_HESLO a ADMIN_HESLO.
// Každú z týchto hodnôt ale ide prebiť premennou (wrangler.toml [vars] alebo dashboard).
const PREDVOLENE = {
  SMTP_SERVER: "smtp.hostinger.com",
  SMTP_PORT: "465",
  SMTP_UZIVATEL: "info@aiucenie.online",
  MOJ_MAIL: "info@aiucenie.online",
  ZNACKA: "AI Učenie",
  WEB: "aiucenie.online",
};

export function nastavenie(env, kluc) {
  const v = env && env[kluc];
  return v !== undefined && v !== null && String(v).trim() !== "" ? String(v).trim() : PREDVOLENE[kluc];
}

export function json(telo, stav = 200) {
  return new Response(JSON.stringify(telo), {
    status: stav,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export function orez(hodnota, strop) {
  if (typeof hodnota !== "string") return "";
  return hodnota.trim().slice(0, strop);
}

export const MAIL_TVAR = /^[^@\s]+@[^@\s.]+\.[^@\s]+$/;
export const SLOT_TVAR = /^\d{4}-\d{2}-\d{2} \d{1,2}:\d{2}$/;

// ---------- CORS: stránka na aiucenie.online (GitHub) volá Worker na inej doméne ----------

const POVOLENE_ORIGINY = ["https://aiucenie.online", "https://www.aiucenie.online", "https://apoliak7777.github.io"];

export function povolenyOrigin(origin) {
  if (!origin) return false;
  if (POVOLENE_ORIGINY.includes(origin)) return true;
  return /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin); // lokálne skúšanie
}

export function corsHlavicky(origin) {
  if (!povolenyOrigin(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function sCors(odpoved, origin) {
  const h = corsHlavicky(origin);
  if (!Object.keys(h).length) return odpoved;
  const nova = new Response(odpoved.body, odpoved);
  for (const [k, v] of Object.entries(h)) nova.headers.set(k, v);
  return nova;
}

// ---------- databáza ----------

// Tabuľka vznikne sama pri prvom dopyte — netreba nič spúšťať v D1 konzole.
// Flag prežije v rámci jednej inštancie, takže CREATE sa nespúšťa pri každom dopyte.
let tabulkaJe = false;
export async function zabezpecTabulku(db) {
  if (tabulkaJe) return;
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS rezervacie (
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
      )`
    )
    .run();
  tabulkaJe = true;
}

// ---------- verejné API ----------

// GET /api/obsadene — zoznam obsadených termínov, widget si ho stiahne pri načítaní.
export async function zoznamObsadene(env) {
  if (!env.DB) return json({ ok: false, chyba: "Databáza nie je pripojená (D1 binding DB)." }, 500);
  await zabezpecTabulku(env.DB);
  const { results } = await env.DB.prepare("SELECT slot FROM rezervacie").all();
  return json({ obsadene: results.map((r) => r.slot) });
}

// POST /api/rezervacia — zapíše termín do D1 a pošle maily.
// Widget posiela JSON: slot, termin, balik, meno, mail, tel, poznamka (+ pasca "web").
export async function spracujRezervaciu(request, env) {
  if (!env.DB) return json({ ok: false, chyba: "Databáza nie je pripojená (D1 binding DB)." }, 500);

  let data;
  try {
    data = await request.json();
  } catch (_) {
    return json({ ok: false, chyba: "Nečitateľné údaje." }, 400);
  }
  if (!data || typeof data !== "object") return json({ ok: false, chyba: "Nečitateľné údaje." }, 400);

  // pasca na roboty — widget toto pole posiela prázdne
  if (orez(data.web, 50)) return json({ ok: true });

  const r = {
    slot: orez(data.slot, 20),
    termin: orez(data.termin, 80),
    balik: orez(data.balik, 80) || "Jedna hodina",
    meno: orez(data.meno, 80),
    mail: orez(data.mail, 120),
    tel: orez(data.tel, 40),
    poznamka: orez(data.poznamka, 1200),
  };

  if (!SLOT_TVAR.test(r.slot)) return json({ ok: false, chyba: "Neplatný termín." }, 400);
  if (r.meno.length < 2) return json({ ok: false, chyba: "Chýba meno." }, 400);
  if (!MAIL_TVAR.test(r.mail)) return json({ ok: false, chyba: "Neplatný e-mail." }, 400);

  await zabezpecTabulku(env.DB);

  try {
    await env.DB.prepare(
      "INSERT INTO rezervacie (slot, termin, balik, meno, mail, tel, poznamka, ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    )
      .bind(r.slot, r.termin, r.balik, r.meno, r.mail, r.tel, r.poznamka, request.headers.get("CF-Connecting-IP") || "")
      .run();
  } catch (e) {
    const spr = String((e && e.message) || e);
    if (/UNIQUE/i.test(spr)) {
      return json(
        { ok: false, obsadene: true, chyba: "Tento termín si medzitým vzal niekto iný. Vyber si, prosím, iný." },
        409
      );
    }
    console.error("D1 zápis zlyhal:", spr);
    return json({ ok: false, chyba: "Zápis rezervácie zlyhal." }, 500);
  }

  // Rezervácia už je zapísaná — maily sú „best effort“. Keď zlyhajú, je to v logu
  // (Workers → ai-ucenie → Logs), rezervácia ostáva v D1 a v /admin.
  const chyby = await posliMaily(env, r);
  if (chyby.length) console.error("MAIL ZLYHAL -> " + chyby.join("; "));

  return json({ ok: true });
}

// ---------- maily ----------

// Jedno SMTP spojenie, dva maily. Vráti zoznam chýb (prázdny = všetko odišlo).
export async function posliMaily(env, r) {
  const heslo = nastavenie(env, "SMTP_HESLO");
  if (!heslo) return ["SMTP_HESLO nie je nastavené (wrangler secret put SMTP_HESLO)"];

  const znacka = nastavenie(env, "ZNACKA");
  const web = nastavenie(env, "WEB");
  const odosielatel = nastavenie(env, "SMTP_UZIVATEL");
  const port = Number(nastavenie(env, "SMTP_PORT")) || 465;

  const mne = [
    "Nová rezervácia",
    "",
    `Termín:   ${r.termin}`,
    `Balík:    ${r.balik}`,
    `Meno:     ${r.meno}`,
    `E-mail:   ${r.mail}`,
    `Telefón:  ${r.tel || "—"}`,
    "",
    "Na čom chce pracovať:",
    r.poznamka || "—",
    "",
    `Všetky rezervácie: https://${web}/admin/`,
    "",
  ].join("\n");

  const oslovenie = r.meno.split(/\s+/)[0] || r.meno;
  const jemu = [
    `Dobrý deň, ${oslovenie},`,
    "",
    `termín ${r.termin} je pre Vás zarezervovaný (${r.balik}).`,
    "",
    "Do 24 hodín Vám pošlem odkaz na stretnutie a podklady na platbu.",
    "Ak by Vám termín nevyhovoval, stačí odpísať na tento mail.",
    "",
    "Alex",
    web,
    "",
  ].join("\n");

  const chyby = [];
  let mailer;
  try {
    mailer = await WorkerMailer.connect({
      host: nastavenie(env, "SMTP_SERVER"),
      port,
      secure: port === 465, // Hostinger: 465 = TLS od začiatku; 587 by šlo cez STARTTLS
      startTls: port !== 465,
      authType: ["plain", "login"],
      credentials: { username: odosielatel, password: heslo },
    });
  } catch (e) {
    return [`SMTP spojenie: ${e && e.message ? e.message : e}`];
  }

  const spravy = [
    {
      to: { email: nastavenie(env, "MOJ_MAIL") },
      reply: { name: r.meno, email: r.mail },
      subject: `Rezervácia: ${r.termin} — ${r.meno}`,
      text: mne,
    },
    {
      to: { name: r.meno, email: r.mail },
      subject: `Potvrdenie rezervácie — ${znacka}`,
      text: jemu,
    },
  ];

  for (const s of spravy) {
    try {
      await mailer.send({ from: { name: znacka, email: odosielatel }, ...s });
    } catch (e) {
      chyby.push(`${s.to.email}: ${e && e.message ? e.message : e}`);
    }
  }
  try {
    if (typeof mailer.close === "function") await mailer.close();
  } catch (_) {
    /* spojenie sa zavrie s inštanciou */
  }
  return chyby;
}
