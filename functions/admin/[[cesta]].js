// /admin/* → api/rezervacie (GET zoznam), api/rezervacie/ID (DELETE). Logika je v lib/admin.js.
import { obsluzAdmin } from "../../lib/admin.js";

export async function onRequest({ request, env, params }) {
  return obsluzAdmin(request, env, (params.cesta || []).join("/"));
}
