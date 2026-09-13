// API pre /admin (prehľad rezervácií). Stránka samotná je statický súbor admin/index.html,
// ktorý sa po zadaní hesla pýta sem. Heslo je tajomstvo ADMIN_HESLO (wrangler secret put ADMIN_HESLO)
// a posiela sa v hlavičke Authorization: Bearer <heslo>. Bez správneho hesla nič nevráti.

import { json, zabezpecTabulku } from "./rezervacie.js";

// porovnanie bez skratky pri prvom rozdiele, aby sa z času odpovede nedalo nič vyčítať
function rovnake(a, b) {
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  if (x.length !== y.length) return false;
  let r = 0;
  for (let i = 0; i < x.length; i++) r |= x[i] ^ y[i];
  return r === 0;
}

export function overeny(request, heslo) {
  const h = request.headers.get("Authorization") || "";
  if (!h.startsWith("Bearer ")) return false;
  return rovnake(h.slice(7).trim(), heslo);
}

// cesta = to, čo je za /admin/api/  ("rezervacie" alebo "rezervacie/ID")
export async function adminApi(request, env, cesta) {
  if (!env.ADMIN_HESLO) return json({ ok: false, chyba: "Chýba tajomstvo ADMIN_HESLO (wrangler secret put ADMIN_HESLO)." }, 500);
  if (!overeny(request, env.ADMIN_HESLO)) return json({ ok: false, chyba: "Nesprávne heslo." }, 401);
  if (!env.DB) return json({ ok: false, chyba: "Databáza nie je pripojená (D1 binding DB)." }, 500);
  await zabezpecTabulku(env.DB);

  const metoda = request.method;
  cesta = cesta.replace(/^\/+|\/+$/g, "");

  if (cesta === "rezervacie") {
    if (metoda !== "GET") return json({ ok: false, chyba: "Nepovolená metóda." }, 405);
    const { results } = await env.DB
      .prepare("SELECT id, slot, termin, balik, meno, mail, tel, poznamka, kedy FROM rezervacie ORDER BY slot")
      .all();
    return json({ rezervacie: results });
  }

  const m = cesta.match(/^rezervacie\/(\d+)$/);
  if (m) {
    if (metoda !== "DELETE") return json({ ok: false, chyba: "Nepovolená metóda." }, 405);
    const r = await env.DB.prepare("DELETE FROM rezervacie WHERE id = ?").bind(Number(m[1])).run();
    return json({ ok: true, zmazane: r.meta.changes });
  }

  return json({ ok: false, chyba: "Neznáma adresa." }, 404);
}
