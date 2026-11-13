import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgres://rayana:rayana_secret@localhost:5432/rayana_db",
  },
  verbose: true,
  strict: true,
});
