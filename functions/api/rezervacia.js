// POST /api/rezervacia — zapíše termín do D1 a pošle maily.
// Widget v index.html sem posiela JSON: slot, termin, balik, meno, mail, tel, poznamka (+ pasca "web").

import { json, orez, MAIL_TVAR, SLOT_TVAR, zabezpecTabulku, posliMaily } from "../../lib/rezervacie.js";

export async function onRequestPost({ request, env }) {
  if (!env.DB) {
    return json({ ok: false, chyba: "Databáza nie je pripojená (Pages → Settings → Bindings → D1 ako DB)." }, 500);
  }

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
  // (Pages → Deployments → View details → Functions logs), rezervácia ostáva v D1.
  const chyby = await posliMaily(env, r);
  if (chyby.length) console.error("MAIL ZLYHAL -> " + chyby.join("; "));

  return json({ ok: true });
}
