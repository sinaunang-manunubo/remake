import sqlite3 from "sqlite3";
import fs from "fs";

if (!fs.existsSync("database")) fs.mkdirSync("database");

const db = new sqlite3.Database("./database/simsimi.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS simsimi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT UNIQUE,
      answer TEXT,
      taught_count INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS stats (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      total_interactions INTEGER DEFAULT 0
    )
  `);

  db.run(`INSERT OR IGNORE INTO stats (id) VALUES (1)`);
});

export default db;