// Spoločný kód rezervačných Functions (Cloudflare Pages).
// Statická stránka ostáva ako je; toto beží len pod /api/.

import { WorkerMailer } from "worker-mailer";

// Čo sa nemení sa nenastavuje v Cloudflare — stačí tajomstvo SMTP_HESLO.
// Každú z týchto hodnôt ale ide prebiť premennou v Pages → Settings → Variables.
const PREDVOLENE = {
  SMTP_SERVER: "smtp.hostinger.com",
  SMTP_PORT: "465",
  SMTP_UZIVATEL: "apoliak@apoliak.online",
  MOJ_MAIL: "apoliak@apoliak.online",
  ZNACKA: "AI Učenie",
  WEB: "ai.apoliak.online",
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

// Jedno SMTP spojenie, dva maily. Vráti zoznam chýb (prázdny = všetko odišlo).
export async function posliMaily(env, r) {
  const heslo = nastavenie(env, "SMTP_HESLO");
  if (!heslo) return ["SMTP_HESLO nie je nastavené (Pages → Settings → Variables and Secrets)"];

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
