import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";

const envText = readFileSync(".env.production.local", "utf8");
const env = {};

for (const line of envText.split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const index = line.indexOf("=");
  if (index === -1) continue;
  const key = line.slice(0, index);
  let value = line.slice(index + 1);
  if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
  env[key] = value;
}

const dbUrl = env.POSTGRES_URL_NON_POOLING || env.POSTGRES_URL;
if (!dbUrl) {
  console.error("Missing POSTGRES_URL_NON_POOLING or POSTGRES_URL in .env.production.local.");
  process.exit(1);
}

const child = spawn("npx", ["supabase", "db", "query", "--db-url", dbUrl, "--file", "supabase/schema.sql"], {
  stdio: "inherit"
});

child.on("exit", (code) => process.exit(code ?? 0));
