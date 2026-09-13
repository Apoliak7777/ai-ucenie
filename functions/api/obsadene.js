// Cloudflare Pages Functions (keby stránka bežala celá na Pages). Logika je v lib/rezervacie.js.
import { zoznamObsadene } from "../../lib/rezervacie.js";

export async function onRequestGet({ env }) {
  return zoznamObsadene(env);
}
