-- Add Foundry to the observed existing API schema list without removing entries.
-- Protect private RLS tables from an optional legacy arbitrary-SQL RPC.
begin;
do $$
declare
  exposed text;
begin
  select substring(setting from length('pgrst.db_schemas=') + 1)
    into exposed
    from pg_roles r, unnest(r.rolconfig) setting
    where r.rolname = 'authenticator' and setting like 'pgrst.db_schemas=%';
  -- Used only when no role override exists. Verify this fallback against the
  -- target's live Data API configuration before applying to another project.
  exposed := coalesce(exposed, 'public, graphql_public');
  if not ('foundry' = any(regexp_split_to_array(exposed, '\s*,\s*'))) then
    execute format('alter role authenticator set pgrst.db_schemas = %L', exposed || ', foundry');
  end if;
  if to_regprocedure('public.exec_sql(text)') is not null then
    revoke execute on function public.exec_sql(text) from public, anon, authenticated;
    grant execute on function public.exec_sql(text) to service_role;
  end if;
end;
$$;
notify pgrst, 'reload config';
notify pgrst, 'reload schema';
commit;
