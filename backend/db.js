// Auto-select database adapter based on DATABASE_URL environment variable
// If DATABASE_URL is set (e.g., Supabase PostgreSQL), use PostgreSQL
// Otherwise, use SQLite for local development

const usePostgres = !!process.env.DATABASE_URL;

let db;

if (usePostgres) {
  console.log("Using PostgreSQL database (DATABASE_URL detected)");
  db = await import("./db-postgres.js");
} else {
  console.log("Using SQLite database (local development mode)");
  db = await import("./db-sqlite.js");
}

export default db.default;
