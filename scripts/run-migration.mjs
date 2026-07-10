import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Defina DATABASE_URL antes de rodar este script.");
  process.exit(1);
}

const migrationPath =
  process.argv[2] ??
  path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "supabase",
    "migrations",
    "0001_init.sql"
  );

const sql = readFileSync(migrationPath, "utf8");

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query(sql);
  console.log(`Migração aplicada com sucesso: ${migrationPath}`);
} catch (err) {
  console.error("Falha ao aplicar migração:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
