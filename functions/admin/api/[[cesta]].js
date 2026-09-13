// /admin/api/* na Cloudflare Pages (keby stránka bežala celá na Pages). Logika je v lib/admin.js.
// Samotná stránka /admin/ je statický súbor admin/index.html.
import { adminApi } from "../../../lib/admin.js";

export async function onRequest({ request, env, params }) {
  return adminApi(request, env, (params.cesta || []).join("/"));
}
