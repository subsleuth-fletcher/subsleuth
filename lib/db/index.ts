import { neon } from "@neondatabase/serverless";
import { drizzle, NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let dbInstance: NeonHttpDatabase<typeof schema> | null = null;

export function getDb(): NeonHttpDatabase<typeof schema> {
  if (!dbInstance) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    const sql = neon(process.env.DATABASE_URL);
    dbInstance = drizzle(sql, { schema });
  }
  return dbInstance;
}

// For backwards compatibility - will throw if DATABASE_URL is not set
export const db = (() => {
  // Only create db if DATABASE_URL exists (runtime check)
  if (typeof process !== "undefined" && process.env?.DATABASE_URL) {
    return getDb();
  }
  // Return a placeholder that will be replaced at runtime
  return null as unknown as NeonHttpDatabase<typeof schema>;
})();

export * from "./schema";
