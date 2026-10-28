-- Run after migration on a disposable Supabase local/test database, NOT production.
-- Plain SQL assertions; transaction rolls back all fixtures. Requires postgres/admin.
begin;
insert into auth.users (id) values
('00000000-0000-4000-8000-000000000001'),
('00000000-0000-4000-8000-000000000002'),
('00000000-0000-4000-8000-000000000003');
insert into foundry.members(user_id) values
('00000000-0000-4000-8000-000000000001'),('00000000-0000-4000-8000-000000000002');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
insert into foundry.workspaces(owner_id,state) values
('00000000-0000-4000-8000-000000000001','{"schemaVersion":1}');
update foundry.workspaces set state='{"schemaVersion":1,"test":true}', revision=2;
do $$begin
 if (select count(*) from foundry.workspaces) <> 1 then raise exception 'Owner read failed'; end if;
 begin
  insert into foundry.members(user_id) values ('00000000-0000-4000-8000-000000000003');
  raise exception 'Self-enrollment was allowed';
 exception when insufficient_privilege then null; end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',true);
do $$begin
 if (select count(*) from foundry.workspaces) <> 0 then raise exception 'Cross-owner read'; end if;
 update foundry.workspaces set revision=3;
 if found then raise exception 'Cross-owner update'; end if;
 delete from foundry.workspaces;
 if found then raise exception 'Cross-owner delete'; end if;
 begin
  insert into foundry.workspaces(owner_id,state) values ('00000000-0000-4000-8000-000000000001','{"schemaVersion":1}');
  raise exception 'Cross-owner insert';
 exception when insufficient_privilege then null; end;
end$$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',true);
do $$begin
 if (select count(*) from foundry.workspaces) <> 0 then raise exception 'Nonmember read'; end if;
 begin
  insert into foundry.workspaces(owner_id,state) values ('00000000-0000-4000-8000-000000000003','{"schemaVersion":1}');
  raise exception 'Nonmember insert';
 exception when insufficient_privilege then null; end;
end$$;
set local role anon;
do $$begin
 begin perform * from foundry.workspaces; raise exception 'Anonymous read';
 exception when insufficient_privilege then null; end;
end$$;
reset role;
rollback;
