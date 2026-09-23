-- À exécuter APRÈS 01-base.sql, dans un nouveau projet Supabase.
-- Les prix peuvent manquer sur les brouillons. Aucune clé secrète requise.
begin;
alter table public.products alter column prix drop not null;
alter table public.products drop constraint if exists produit_publie_avec_prix;
alter table public.products add constraint produit_publie_avec_prix check (not actif or prix is not null);
update storage.buckets set file_size_limit = 250000, allowed_mime_types = array['image/webp'] where id='produits';
grant select on public.products, public.product_images, public.variants, public.parametres, public.categories to anon;
grant select, insert, update, delete on public.products, public.product_images, public.variants to authenticated;
grant select on public.admins, public.parametres, public.categories, public.order_items to authenticated;
grant usage, select on all sequences in schema public to authenticated;

create or replace function public.enregistrer_produit(fiche jsonb)
returns bigint language plpgsql security invoker set search_path=public as $$
declare
 pid bigint; code text; ac integer; ino integer; prix_article integer; publier boolean;
 v jsonb; im jsonb; total_stock integer; previous_code text;
begin
 if not public.est_admin() then raise exception 'ADMIN_REQUIS'; end if;
 code := fiche->>'photo_code';
 if code is null or code !~ '^[1-4]\.[1-9][0-9]{0,5}$' then raise exception 'REFERENCE_INVALIDE'; end if;
 ac := split_part(code,'.',1)::integer; ino := split_part(code,'.',2)::integer;
 prix_article := (fiche->>'prix')::integer; publier := coalesce((fiche->>'actif')::boolean,false);
 if length(btrim(coalesce(fiche->>'titre','')))<2 or length(fiche->>'titre')>120 then raise exception 'TITRE_INVALIDE'; end if;
 if jsonb_typeof(fiche->'variants') is distinct from 'array' or jsonb_typeof(fiche->'product_images') is distinct from 'array' then raise exception 'FICHE_INVALIDE'; end if;
 if jsonb_array_length(fiche->'variants')>20 or jsonb_array_length(fiche->'product_images')>8 then raise exception 'FICHE_TROP_LONGUE'; end if;
 select coalesce(sum((value->>'stock')::integer),0) into total_stock from jsonb_array_elements(fiche->'variants');
 if publier and (prix_article is null or prix_article<1 or total_stock<1 or jsonb_array_length(fiche->'product_images')<1) then raise exception 'PHOTO_PRIX_STOCK_REQUIS'; end if;
 pid := nullif(greatest(coalesce((fiche->>'id')::bigint,0),0),0);
 if pid is not null then
   select photo_code into previous_code from public.products where id=pid for update;
   if not found or previous_code<>code then raise exception 'REFERENCE_NON_MODIFIABLE'; end if;
   update public.products set titre=btrim(fiche->>'titre'),description=fiche->>'description',prix=prix_article,couleur=fiche->>'couleur',genre=fiche->>'genre',type_article=fiche->>'type_article',actif=publier where id=pid;
 else
   insert into public.products(photo_code,sku,age_code,item_no,age_label,titre,description,prix,couleur,genre,type_article,actif)
   values(code,'A'||ac||'-'||lpad(ino::text,greatest(3,length(ino::text)),'0'),ac,ino,(array['0–2 ans','3–5 ans','6–9 ans','10–13 ans'])[ac],btrim(fiche->>'titre'),fiche->>'description',prix_article,fiche->>'couleur',fiche->>'genre',fiche->>'type_article',publier) returning id into pid;
 end if;
 if (select count(distinct lower(btrim(value->>'taille'))) from jsonb_array_elements(fiche->'variants'))<>jsonb_array_length(fiche->'variants') then raise exception 'TAILLE_DUPLIQUEE'; end if;
 -- Preserve variant IDs already referenced by orders; removed sizes become unavailable.
 update public.variants set stock=0 where product_id=pid;
 for v in select value from jsonb_array_elements(fiche->'variants') loop
   if length(btrim(coalesce(v->>'taille','')))=0 or length(v->>'taille')>40 or (v->>'stock')::integer not between 0 and 9999 then raise exception 'TAILLE_OU_STOCK_INVALIDE'; end if;
   insert into public.variants(product_id,taille,stock) values(pid,btrim(v->>'taille'),(v->>'stock')::integer)
   on conflict(product_id,taille) do update set stock=excluded.stock;
 end loop;
 delete from public.variants where product_id=pid and taille not in (select btrim(value->>'taille') from jsonb_array_elements(fiche->'variants')) and not exists(select 1 from public.order_items oi where oi.variant_id=variants.id);
 delete from public.product_images where product_id=pid;
 for im in select value from jsonb_array_elements(fiche->'product_images') loop
   if coalesce(im->>'url','') !~ '^https://[^/]+/storage/v1/object/public/produits/catalogue/[0-9a-f-]+\.webp$' then raise exception 'PHOTO_INVALIDE'; end if;
   insert into public.product_images(product_id,url,position) values(pid,im->>'url',(im->>'position')::smallint);
 end loop;
 return pid;
end;
$$;
revoke all on function public.enregistrer_produit(jsonb) from public, anon;
grant execute on function public.enregistrer_produit(jsonb) to authenticated;
commit;
