-- Apply only after reviewing against the existing project. Never reset the shared DB.
begin;
create schema foundry;
revoke all on schema foundry from public, anon;
grant usage on schema foundry to authenticated;

-- Admission is administrator-managed, independent of shared-project signup policy.
create table foundry.members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table foundry.members enable row level security;
alter table foundry.members force row level security;
revoke all on foundry.members from public, anon, authenticated;
grant select on foundry.members to authenticated;
create policy member_self_read on foundry.members for select to authenticated
using (user_id = (select auth.uid()));

-- One private owner workspace per user. No global shared workspace or service key.
create table foundry.workspaces (
  owner_id uuid primary key references foundry.members(user_id) on delete cascade,
  state jsonb not null check (jsonb_typeof(state) = 'object' and state->>'schemaVersion' = '1'),
  revision integer not null default 1 check (revision > 0),
  updated_at timestamptz not null default now(),
  constraint workspace_size check (octet_length(state::text) <= 5000000)
);
alter table foundry.workspaces enable row level security;
alter table foundry.workspaces force row level security;
revoke all on foundry.workspaces from public, anon, authenticated;
grant select, insert, update, delete on foundry.workspaces to authenticated;
create policy owner_read on foundry.workspaces for select to authenticated
using (owner_id = (select auth.uid()) and exists(select 1 from foundry.members where user_id = (select auth.uid())));
create policy owner_insert on foundry.workspaces for insert to authenticated
with check (owner_id = (select auth.uid()) and exists(select 1 from foundry.members where user_id = (select auth.uid())));
create policy owner_update on foundry.workspaces for update to authenticated
using (owner_id = (select auth.uid()) and exists(select 1 from foundry.members where user_id = (select auth.uid())))
with check (owner_id = (select auth.uid()) and exists(select 1 from foundry.members where user_id = (select auth.uid())));
create policy owner_delete on foundry.workspaces for delete to authenticated
using (owner_id = (select auth.uid()) and exists(select 1 from foundry.members where user_id = (select auth.uid())));

create function foundry.enforce_revision() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.owner_id <> old.owner_id then raise exception 'Workspace owner cannot change'; end if;
  if new.revision <> old.revision + 1 then raise exception 'Revision must increment by one'; end if;
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function foundry.enforce_revision() from public, anon, authenticated;
create trigger workspace_revision before update on foundry.workspaces
for each row execute function foundry.enforce_revision();
commit;
