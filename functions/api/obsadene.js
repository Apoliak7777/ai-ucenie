// GET /api/obsadene — zoznam už obsadených termínov, widget si ho stiahne pri načítaní.

import { json, zabezpecTabulku } from "../../lib/rezervacie.js";

export async function onRequestGet({ env }) {
  if (!env.DB) {
    return json({ ok: false, chyba: "Databáza nie je pripojená (Pages → Settings → Bindings → D1 ako DB)." }, 500);
  }
  await zabezpecTabulku(env.DB);
  const { results } = await env.DB.prepare("SELECT slot FROM rezervacie").all();
  return json({ obsadene: results.map((r) => r.slot) });
}
