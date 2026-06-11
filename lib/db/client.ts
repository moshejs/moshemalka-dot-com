import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type DB = ReturnType<typeof drizzle<typeof schema>>;

const g = globalThis as unknown as { __studyDb?: DB };

function build(): DB {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env.local (Neon connection string)."
    );
  }
  const sql = neon(url);
  return drizzle(sql, { schema });
}

export function getDb(): DB {
  if (!g.__studyDb) g.__studyDb = build();
  return g.__studyDb;
}

// Lazy proxy so importing this module doesn't require DATABASE_URL at build time.
export const db: DB = new Proxy({} as DB, {
  get(_, prop, recv) {
    return Reflect.get(getDb() as unknown as object, prop, recv);
  },
});
