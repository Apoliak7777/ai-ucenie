-- Rezervácie pre ai.apoliak.online (Cloudflare D1).
-- Spustiť raz v D1 konzole (Workers & Pages → D1 → ai-ucenie → Console), alebo lokálne: npm run db:local
CREATE TABLE IF NOT EXISTS rezervacie (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  slot      TEXT NOT NULL UNIQUE,     -- "2026-09-15 9:00" — UNIQUE drží termín obsadený pre všetkých
  termin    TEXT NOT NULL,            -- ľudsky: "Pondelok 15. 9. o 9:00"
  balik     TEXT,
  meno      TEXT NOT NULL,
  mail      TEXT NOT NULL,
  tel       TEXT,
  poznamka  TEXT,
  ip        TEXT,
  kedy      TEXT NOT NULL DEFAULT (datetime('now'))
);
