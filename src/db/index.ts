
import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL não configurada. Adicione a variável de ambiente do banco de dados Shifting Realities."
  );
}

const sql = neon(databaseUrl);

export const db = drizzle({
  client: sql,
  schema,
});

export type Database = typeof db;
