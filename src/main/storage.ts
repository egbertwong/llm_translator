import { app } from "electron";
import path from "node:path";
import Database from "better-sqlite3";

type HistoryInput = {
  id: string;
  type: string;
  createdAt: number;
  payload: unknown;
};

type HistoryRow = {
  id: string;
  type: string;
  created_at: number;
  payload: string;
};

type SettingsRow = {
  data: string;
};

let db: Database.Database | null = null;

const ensureDb = () => {
  if (db) return db;
  const dbPath = path.join(app.getPath("userData"), "llm-translator.sqlite");
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS history (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      payload TEXT NOT NULL,
      position INTEGER NOT NULL
    );
  `);
  return db;
};

const safeParse = (value: string) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const loadSettings = () => {
  const row = ensureDb()
    .prepare("SELECT data FROM settings WHERE id = 1")
    .get() as SettingsRow | undefined;
  if (!row) return null;
  const parsed = safeParse(row.data);
  if (!parsed || typeof parsed !== "object") return null;
  return parsed;
};

export const saveSettings = (settings: unknown) => {
  const data = JSON.stringify(settings ?? {});
  ensureDb()
    .prepare(
      "INSERT INTO settings (id, data) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data"
    )
    .run(data);
};

export const loadHistory = () => {
  const rows = ensureDb()
    .prepare("SELECT id, type, created_at, payload FROM history ORDER BY position ASC")
    .all() as HistoryRow[];
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    createdAt: row.created_at,
    payload: safeParse(row.payload) ?? {}
  }));
};

export const saveHistory = (items: HistoryInput[]) => {
  const dbInstance = ensureDb();
  const clear = dbInstance.prepare("DELETE FROM history");
  const insert = dbInstance.prepare(
    "INSERT INTO history (id, type, created_at, payload, position) VALUES (?, ?, ?, ?, ?)"
  );
  const tx = dbInstance.transaction((entries: HistoryInput[]) => {
    clear.run();
    entries.forEach((item, index) => {
      insert.run(
        item.id,
        item.type,
        item.createdAt,
        JSON.stringify(item.payload ?? {}),
        index
      );
    });
  });
  tx(items);
};
