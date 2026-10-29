import test from "node:test";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import assert from "node:assert/strict";
test("migration denies cross-owner, nonmember and anonymous access in local PostgreSQL", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role authenticator; create role service_role;
 create function public.exec_sql(sql_text text) returns void language plpgsql security definer as $$begin execute sql_text;end$$;
 grant execute on function public.exec_sql(text) to public, anon, authenticated, service_role;
 create schema auth; create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to authenticated;
 grant execute on function auth.uid() to authenticated;`);
    await db.exec(
      readFileSync(
        new URL(
          "../supabase/migrations/20261029040937_foundry_private_workspace.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    const hardening = readFileSync(
      new URL(
        "../supabase/migrations/20261029041112_expose_foundry_schema_and_restrict_unsafe_rpc.sql",
        import.meta.url,
      ),
      "utf8",
    );
    await db.exec(hardening);
    const grants = (
      await db.query(
        `select has_function_privilege('anon','public.exec_sql(text)','execute') as anon, has_function_privilege('authenticated','public.exec_sql(text)','execute') as authenticated, has_function_privilege('service_role','public.exec_sql(text)','execute') as server`,
      )
    ).rows[0];
    assert.deepEqual(grants, {
      anon: false,
      authenticated: false,
      server: true,
    });
    let config = (
      await db.query(
        `select rolconfig from pg_roles where rolname='authenticator'`,
      )
    ).rows[0].rolconfig;
    assert.ok(
      config.includes("pgrst.db_schemas=public, graphql_public, foundry"),
    );
    await db.exec(
      `alter role authenticator set pgrst.db_schemas='public, existing_custom';`,
    );
    await db.exec(hardening);
    config = (
      await db.query(
        `select rolconfig from pg_roles where rolname='authenticator'`,
      )
    ).rows[0].rolconfig;
    assert.ok(
      config.includes("pgrst.db_schemas=public, existing_custom, foundry"),
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
