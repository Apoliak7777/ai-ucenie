// AI Učenie — rezervácie v Google tabuľke (Google Apps Script).
//
// Ako nasadiť (raz):
//   1. sheets.new → nová tabuľka (názov hocijaký, napr. "AI Učenie rezervácie")
//   2. Rozšírenia → Apps Script → zmazať ukážkový kód, vložiť tento súbor, Ctrl+S
//   3. Nasadiť → Nová verzia nasadenia → typ Webová aplikácia
//        Spustiť ako: Ja        Kto má prístup: Ktokoľvek
//      → Nasadiť → povoliť prístup (Google sa spýta, klikni Povoliť)
//   4. Skopírovať "Webová adresa aplikácie" (končí na /exec) a dať ju do index.html
//      a admin/index.html do premennej API.
// Zmena kódu = vložiť nový kód, Ctrl+S, Nasadiť → Spravovať nasadenia → ceruzka → Verzia: Nová → Nasadiť.
//
// Stránka na GitHub Pages sem posiela:
//   GET  ?akcia=obsadene                       zoznam obsadených termínov (verejné)
//   POST {akcia:"rezervacia", slot, termin, balik, meno, mail, tel, poznamka}   nová rezervácia
//   POST {akcia:"rezervacie", heslo}           zoznam pre /admin
//   POST {akcia:"zmaz", heslo, id}             zmazanie z /admin, termín sa uvoľní

var ADMIN_HESLO = "SEM-NAPIS-HESLO-DO-ADMINU";   // heslo, ktoré sa zadáva na aiucenie.online/admin
var MOJ_MAIL = "info@aiucenie.online";          // kam chodia nové rezervácie
var ZNACKA = "AI Učenie";
var WEB = "aiucenie.online";
var HAROK = "rezervacie";
var STLPCE = ["id", "slot", "termin", "balik", "meno", "mail", "tel", "poznamka", "kedy"];

function harok_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var h = ss.getSheetByName(HAROK);
  if (!h) {
    h = ss.insertSheet(HAROK);
    h.getRange(1, 1, 1, STLPCE.length).setValues([STLPCE]).setFontWeight("bold");
    h.setFrozenRows(1);
  }
  return h;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function text_(v) {
  if (v === null || v === undefined) return "";
  if (Object.prototype.toString.call(v) === "[object Date]") {
    return Utilities.formatDate(v, "Europe/Bratislava", "yyyy-MM-dd H:mm");
  }
  return String(v);
}

function riadky_() {
  var h = harok_();
  var posledny = h.getLastRow();
  if (posledny < 2) return [];
  var v = h.getRange(2, 1, posledny - 1, STLPCE.length).getValues();
  var out = [];
  for (var i = 0; i < v.length; i++) {
    if (text_(v[i][0]) === "") continue;
    out.push({
      id: text_(v[i][0]), slot: text_(v[i][1]), termin: text_(v[i][2]), balik: text_(v[i][3]),
      meno: text_(v[i][4]), mail: text_(v[i][5]), tel: text_(v[i][6]), poznamka: text_(v[i][7]),
      kedy: text_(v[i][8]), riadok: i + 2
    });
  }
  return out;
}

function overeny_(heslo) {
  var a = String(heslo || ""), b = ADMIN_HESLO;
  if (a.length !== b.length) return false;
  var r = 0;
  for (var i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function orez_(v, strop) {
  return typeof v === "string" ? v.trim().slice(0, strop) : "";
}

function doGet(e) {
  var akcia = (e && e.parameter && e.parameter.akcia) || "";
  if (akcia === "obsadene") {
    return json_({ obsadene: riadky_().map(function (r) { return r.slot; }) });
  }
  return json_({ ok: true, sluzba: "AI Učenie rezervácie", stranka: "https://" + WEB + "/" });
}

function doPost(e) {
  var d;
  try {
    d = JSON.parse(e.postData.contents);
  } catch (x) {
    return json_({ ok: false, chyba: "Nečitateľné údaje." });
  }
  if (!d || typeof d !== "object") return json_({ ok: false, chyba: "Nečitateľné údaje." });
  var akcia = d.akcia || "rezervacia";

  if (akcia === "rezervacia") return rezervacia_(d);

  if (akcia === "rezervacie" || akcia === "zmaz") {
    if (!overeny_(d.heslo)) return json_({ ok: false, neopravneny: true, chyba: "Nesprávne heslo." });
    if (akcia === "rezervacie") {
      return json_({
        rezervacie: riadky_().map(function (r) {
          return { id: r.id, slot: r.slot, termin: r.termin, balik: r.balik, meno: r.meno, mail: r.mail, tel: r.tel, poznamka: r.poznamka, kedy: r.kedy };
        }).sort(function (a, b) { return a.slot < b.slot ? -1 : a.slot > b.slot ? 1 : 0; })
      });
    }
    return zmaz_(d.id);
  }
  return json_({ ok: false, chyba: "Neznáma akcia." });
}

function rezervacia_(d) {
  // pasca na roboty — widget toto pole posiela prázdne
  if (orez_(d.web, 50)) return json_({ ok: true });

  var r = {
    slot: orez_(d.slot, 20), termin: orez_(d.termin, 80), balik: orez_(d.balik, 80) || "Jedna hodina",
    meno: orez_(d.meno, 80), mail: orez_(d.mail, 120), tel: orez_(d.tel, 40), poznamka: orez_(d.poznamka, 1200)
  };
  if (!/^\d{4}-\d{2}-\d{2} \d{1,2}:\d{2}$/.test(r.slot)) return json_({ ok: false, chyba: "Neplatný termín." });
  if (r.meno.length < 2) return json_({ ok: false, chyba: "Chýba meno." });
  if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(r.mail)) return json_({ ok: false, chyba: "Neplatný e-mail." });

  var zamok = LockService.getScriptLock();
  zamok.waitLock(10000);
  try {
    var existujuce = riadky_();
    for (var i = 0; i < existujuce.length; i++) {
      if (existujuce[i].slot === r.slot) {
        return json_({ ok: false, obsadene: true, chyba: "Tento termín si medzitým vzal niekto iný. Vyber si, prosím, iný." });
      }
    }
    var id = 0;
    for (var j = 0; j < existujuce.length; j++) id = Math.max(id, parseInt(existujuce[j].id, 10) || 0);
    id += 1;
    var kedy = Utilities.formatDate(new Date(), "Europe/Bratislava", "yyyy-MM-dd'T'HH:mm:ssXXX");
    var h = harok_();
    var riadok = h.getLastRow() + 1;
    // formát "@" = obyčajný text, aby tabuľka z "2026-09-16 15:00" nespravila dátum
    h.getRange(riadok, 1, 1, STLPCE.length).setNumberFormat("@")
      .setValues([[String(id), r.slot, r.termin, r.balik, r.meno, r.mail, r.tel, r.poznamka, kedy]]);
  } finally {
    zamok.releaseLock();
  }

  // maily sú „best effort“: rezervácia je už v tabuľke, keď mail zlyhá, je to v Apps Script → Vykonania
  try {
    MailApp.sendEmail({
      to: MOJ_MAIL, replyTo: r.mail, name: ZNACKA,
      subject: "Rezervácia: " + r.termin + " — " + r.meno,
      body: "Nová rezervácia\n\nTermín:   " + r.termin + "\nBalík:    " + r.balik + "\nMeno:     " + r.meno +
        "\nE-mail:   " + r.mail + "\nTelefón:  " + (r.tel || "—") + "\n\nNa čom chce pracovať:\n" + (r.poznamka || "—") +
        "\n\nVšetky rezervácie: https://" + WEB + "/admin/\n"
    });
  } catch (x) {
    console.error("Mail pre mňa zlyhal: " + x);
  }
  try {
    var oslovenie = r.meno.split(/\s+/)[0] || r.meno;
    MailApp.sendEmail({
      to: r.mail, replyTo: MOJ_MAIL, name: ZNACKA,
      subject: "Potvrdenie rezervácie — " + ZNACKA,
      body: "Dobrý deň, " + oslovenie + ",\n\ntermín " + r.termin + " je pre Vás zarezervovaný (" + r.balik + ").\n\n" +
        "Do 24 hodín Vám pošlem odkaz na stretnutie a podklady na platbu.\nAk by Vám termín nevyhovoval, stačí odpísať na tento mail.\n\nAlex\n" + WEB + "\n"
    });
  } catch (x) {
    console.error("Potvrdenie klientovi zlyhalo: " + x);
  }
  return json_({ ok: true });
}

function zmaz_(id) {
  id = String(id || "");
  var zamok = LockService.getScriptLock();
  zamok.waitLock(10000);
  try {
    var vsetky = riadky_();
    for (var i = 0; i < vsetky.length; i++) {
      if (vsetky[i].id === id) {
        harok_().deleteRow(vsetky[i].riadok);
        return json_({ ok: true, zmazane: 1 });
      }
    }
    return json_({ ok: true, zmazane: 0 });
  } finally {
    zamok.releaseLock();
  }
}
