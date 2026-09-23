-- Remplace cette adresse par celle du compte créé dans Authentication > Users.
insert into public.admins (user_id,email)
select id,email from auth.users where email='REMPLACER_PAR_TON_EMAIL'
on conflict (user_id) do nothing;
