import fs from "fs";
import path from "path";
import { pool } from "../config/database";
import { env } from "../config/env";

// Minimal migration runner — reads SQL files from migrations/ in order
async function migrate(): Promise<void> {
  // Ensure env is loaded
  console.log(`Running migrations on: ${env.DB_NAME}`);

  const migrationsDir = path.join(__dirname, "migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    console.log(`Applying: ${file}`);
    await pool.query(sql);
    console.log(`✅  Done: ${file}`);
  }

  await pool.end();
  console.log("All migrations applied.");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
