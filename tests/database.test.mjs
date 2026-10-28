import test from "node:test";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
test("migration denies cross-owner, nonmember and anonymous access in local PostgreSQL", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated;
 create schema auth; create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to authenticated;
 grant execute on function auth.uid() to authenticated;`);
    await db.exec(
      readFileSync(
        new URL(
          "../supabase/migrations/202610290001_foundry.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    await db.exec(
      readFileSync(
        new URL("../supabase/tests/access.sql", import.meta.url),
        "utf8",
      ),
    );
  } finally {
    await db.close();
  }
});
