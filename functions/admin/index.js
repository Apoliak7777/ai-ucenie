// GET /admin → prehľad rezervácií (za heslom). Logika je v lib/admin.js.
import { obsluzAdmin } from "../../lib/admin.js";

export async function onRequest({ request, env }) {
  return obsluzAdmin(request, env, "");
}
