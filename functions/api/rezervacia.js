// Cloudflare Pages Functions (keby stránka bežala celá na Pages). Logika je v lib/rezervacie.js.
import { spracujRezervaciu } from "../../lib/rezervacie.js";

export async function onRequestPost({ request, env }) {
  return spracujRezervaciu(request, env);
}
