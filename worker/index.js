// Cloudflare Worker: rezervácie + admin API pre stránku, ktorá beží na GitHub Pages.
// Nasadenie: npm run api:deploy   (wrangler deploy -c worker/wrangler.toml)
// Adresa po nasadení (ai-ucenie.<účet>.workers.dev) sa zapisuje do index.html a admin/index.html (premenná API).

import { json, corsHlavicky, sCors, spracujRezervaciu, zoznamObsadene } from "../lib/rezervacie.js";
import { adminApi } from "../lib/admin.js";

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHlavicky(origin) });
    }

    const cesta = new URL(request.url).pathname.replace(/\/+$/, "") || "/";
    let odpoved;
    if (cesta === "/api/rezervacia" && request.method === "POST") odpoved = await spracujRezervaciu(request, env);
    else if (cesta === "/api/obsadene" && request.method === "GET") odpoved = await zoznamObsadene(env);
    else if (cesta.startsWith("/admin/api/")) odpoved = await adminApi(request, env, cesta.slice("/admin/api/".length));
    else if (cesta === "/") odpoved = json({ ok: true, sluzba: "AI Učenie rezervácie", stranka: "https://aiucenie.online/" });
    else odpoved = json({ ok: false, chyba: "Neznáma adresa." }, 404);

    return sCors(odpoved, origin);
  },
};
