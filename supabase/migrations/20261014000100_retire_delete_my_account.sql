-- The old client-callable deletion path skipped every eligibility check.
-- Revoke it (all overloads) instead of dropping, so it can be inspected or restored.
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    where p.proname = 'delete_my_account'
      and p.pronamespace = 'public'::regnamespace
  loop
    execute format('revoke all on function %s from public, anon, authenticated', r.sig);
  end loop;
end $$;
