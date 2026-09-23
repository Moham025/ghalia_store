-- =====================================================================
-- GALIA STORE — Schéma Supabase v1.3
-- Supabase > SQL Editor > New query > Run
--
-- Script IDEMPOTENT : le relancer ne casse rien et ne duplique rien.
--
-- Changements v1.3 :
--   * Table admins : le rôle « authenticated » ne suffit plus à être admin
--   * Table parametres : les frais de livraison n'existent qu'à UN endroit
--   * Quartier obligatoire (le livreur en a besoin)
--   * Script rendu rejouable (if not exists / drop policy if exists)
--
-- Codes d'âge (marquage physique du client, NE PAS MODIFIER) :
--   1 = 0-2 ans | 2 = 3-5 ans | 3 = 6-9 ans | 4 = 10-13 ans
-- Code photo "3.2" -> age_code 3, item_no 2, SKU A3-002
-- =====================================================================


-- =====================================================================
-- 1. PARAMÈTRES — source unique des valeurs qui doivent rester cohérentes
--    entre l'affichage et le calcul du total.
-- =====================================================================
create table if not exists parametres (
  cle           text primary key,
  valeur_entier integer,
  valeur_texte  text,
  libelle       text
);

insert into parametres (cle, valeur_entier, libelle) values
  ('frais_livraison', 1000, 'Frais de livraison à Ouagadougou, en FCFA')
on conflict (cle) do nothing;


-- =====================================================================
-- 2. ADMINISTRATEURS
--    Être connecté ne suffit pas : il faut figurer ici.
--    Après création de ton compte dans Supabase > Authentication :
--      insert into admins (user_id, email)
--      select id, email from auth.users where email = 'ton@email';
-- =====================================================================
create table if not exists admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

create or replace function est_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from admins a where a.user_id = auth.uid());
$$;

revoke all on function est_admin() from public;
grant execute on function est_admin() to authenticated;


-- =====================================================================
-- 3. CATEGORIES  (affichage et filtres uniquement)
--    Chaque catégorie décrit un filtre (champ + valeur) sur products.
-- =====================================================================
create table if not exists categories (
  id         bigint generated always as identity primary key,
  nom        text     not null,
  slug       text     not null unique,
  champ      text     not null check (champ in ('age_code','type_article','genre')),
  valeur     text     not null,
  ordre      smallint not null default 0,
  image_url  text,
  actif      boolean  not null default true,
  created_at timestamptz not null default now()
);


-- =====================================================================
-- 4. PRODUCTS
-- =====================================================================
create table if not exists products (
  id           bigint generated always as identity primary key,
  photo_code   text     not null unique,             -- '3.2'
  sku          text     not null unique,             -- 'A3-002'
  age_code     smallint not null check (age_code between 1 and 4),
  item_no      integer  not null check (item_no > 0),
  age_label    text     not null,                    -- '6-9 ans'
  titre        text     not null,
  description  text,
  prix         integer  not null check (prix > 0),   -- FCFA
  prix_promo   integer  check (prix_promo > 0),
  couleur      text,
  type_article text,                                 -- texte libre
  genre        text     not null default 'mixte'
                 check (genre in ('fille','garcon','mixte')),
  emplacement  text,                                 -- repère carton, interne
  piece_unique boolean  not null default true,
  actif        boolean  not null default false,      -- publié si photo OK
  en_vedette   boolean  not null default false,
  vues         integer  not null default 0,
  created_at   timestamptz not null default now(),
  unique (age_code, item_no),
  constraint promo_inferieure check (prix_promo is null or prix_promo < prix)
);

comment on column products.age_code is
  '1 = 0-2 ans | 2 = 3-5 ans | 3 = 6-9 ans | 4 = 10-13 ans (codage du client, ne pas modifier)';


-- =====================================================================
-- 5. VARIANTS — LE STOCK VIT ICI, ET NULLE PART AILLEURS
-- =====================================================================
create table if not exists variants (
  id         bigint generated always as identity primary key,
  product_id bigint   not null references products(id) on delete cascade,
  taille     text     not null,                      -- 'unique', '7-8 ans'
  stock      integer  not null default 0 check (stock >= 0),
  ordre      smallint not null default 0,
  unique (product_id, taille)
);


-- =====================================================================
-- 6. PRODUCT_IMAGES
--    Contrainte DEFERRABLE : sans cela, réordonner les photos casse
--    la transaction à mi-parcours.
-- =====================================================================
create table if not exists product_images (
  id         bigint   generated always as identity primary key,
  product_id bigint   not null references products(id) on delete cascade,
  url        text     not null,
  position   smallint not null default 1 check (position > 0),
  constraint image_position_unique unique (product_id, position)
    deferrable initially deferred
);


-- =====================================================================
-- 7. COMMANDES
-- =====================================================================
create sequence if not exists numero_commande_seq start 1;

create table if not exists orders (
  id              bigint  generated always as identity primary key,
  numero          text    not null unique default
                    'GAL-' || lpad(nextval('numero_commande_seq')::text, 4, '0'),
  client_nom      text    not null,
  telephone       text    not null,
  quartier        text    not null,                  -- requis : le livreur en a besoin
  note            text,
  sous_total      integer not null check (sous_total >= 0),
  frais_livraison integer not null check (frais_livraison >= 0),
  total           integer not null check (total >= 0),
  statut          text    not null default 'nouvelle'
                    check (statut in ('nouvelle','confirmee','livree','annulee')),
  created_at      timestamptz not null default now()
);

create table if not exists order_items (
  id            bigint   generated always as identity primary key,
  order_id      bigint   not null references orders(id) on delete cascade,
  variant_id    bigint   not null references variants(id),
  sku           text     not null,
  titre         text     not null,
  taille        text     not null,
  quantite      smallint not null check (quantite > 0),
  prix_unitaire integer  not null check (prix_unitaire > 0)
);


-- =====================================================================
-- 8. INDEX
-- =====================================================================
create index if not exists idx_products_age     on products (age_code)     where actif;
create index if not exists idx_products_type    on products (type_article) where actif;
create index if not exists idx_products_genre   on products (genre)        where actif;
create index if not exists idx_products_recents on products (created_at desc) where actif;
create index if not exists idx_images_produit   on product_images (product_id, position);
create index if not exists idx_variants_produit on variants (product_id);
create index if not exists idx_orders_statut    on orders (statut, created_at desc);


-- =====================================================================
-- 9. STOCK — décrémenté par la base, pas par l'application
--    Statuts qui réservent le stock : confirmee, livree.
--    Toute entrée débite, toute sortie recrédite.
--    La clause « and stock >= quantite » verrouille la ligne : deux
--    confirmations simultanées ne peuvent pas passer toutes les deux.
-- =====================================================================
create or replace function appliquer_stock_sur_statut()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ligne     record;
  reservait boolean := old.statut in ('confirmee','livree');
  reserve   boolean := new.statut in ('confirmee','livree');
begin
  if reservait = reserve then
    return new;
  end if;

  if reserve then
    for ligne in
      select variant_id, quantite from order_items where order_id = new.id
    loop
      update variants
         set stock = stock - ligne.quantite
       where id = ligne.variant_id
         and stock >= ligne.quantite;
      if not found then
        raise exception 'Stock insuffisant pour la variante % (commande %)',
          ligne.variant_id, new.numero;
      end if;
    end loop;
  else
    for ligne in
      select variant_id, quantite from order_items where order_id = new.id
    loop
      update variants
         set stock = stock + ligne.quantite
       where id = ligne.variant_id;
    end loop;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_stock_commande on orders;
create trigger trg_stock_commande
before update of statut on orders
for each row
when (old.statut is distinct from new.statut)
execute function appliquer_stock_sur_statut();


-- =====================================================================
-- 10. COMPTEUR DE VUES
--     JS : await supabase.rpc('incrementer_vues', { p_sku: 'A3-002' })
-- =====================================================================
create or replace function incrementer_vues(p_sku text)
returns void
language sql
security definer
set search_path = public
as $$
  update products set vues = vues + 1 where sku = p_sku and actif;
$$;

grant execute on function incrementer_vues(text) to anon, authenticated;


-- =====================================================================
-- 11. CRÉATION D'UNE COMMANDE — tout en une seule transaction
--
--     Appelée UNIQUEMENT par /api/commande avec la clé service_role.
--     Prix, frais et stock sont relus en base : un panier falsifié dans
--     le navigateur n'a aucun effet sur le total enregistré.
--     Si quoi que ce soit échoue, RIEN n'est écrit.
--
--     p_lignes : [{"variant_id": 12, "quantite": 2}, ...]
-- =====================================================================
create or replace function creer_commande(
  p_client_nom text,
  p_telephone  text,
  p_quartier   text,
  p_note       text,
  p_lignes     jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  l            record;
  v_order_id   bigint;
  v_numero     text;
  v_sous_total integer := 0;
  v_frais      integer;
  v_lignes     jsonb   := '[]'::jsonb;
  v_trouvees   integer := 0;
  v_demandees  integer;
begin
  if coalesce(btrim(p_client_nom), '') = '' then
    raise exception 'NOM_MANQUANT';
  end if;
  if coalesce(btrim(p_telephone), '') !~ '^[5-7][0-9]{7}$' then
    raise exception 'TELEPHONE_INVALIDE';
  end if;
  if coalesce(btrim(p_quartier), '') = '' then
    raise exception 'QUARTIER_MANQUANT';
  end if;
  if p_lignes is null or jsonb_typeof(p_lignes) <> 'array'
     or jsonb_array_length(p_lignes) = 0 then
    raise exception 'PANIER_VIDE';
  end if;

  -- Source unique des frais de livraison : jamais une constante en dur
  select valeur_entier into v_frais from parametres where cle = 'frais_livraison';
  if v_frais is null then
    raise exception 'FRAIS_LIVRAISON_NON_CONFIGURES';
  end if;

  select count(distinct (e->>'variant_id')::bigint)
    into v_demandees
    from jsonb_array_elements(p_lignes) e;

  for l in
    select d.variant_id,
           d.quantite,
           v.taille,
           v.stock,
           p.sku,
           p.titre,
           p.actif,
           coalesce(p.prix_promo, p.prix) as prix
      from (
        select (e->>'variant_id')::bigint as variant_id,
               sum((e->>'quantite')::int) as quantite
          from jsonb_array_elements(p_lignes) e
         group by 1
      ) d
      join variants v on v.id = d.variant_id
      join products p on p.id = v.product_id
     order by p.sku
  loop
    v_trouvees := v_trouvees + 1;

    if not l.actif then
      raise exception 'ARTICLE_INDISPONIBLE:%', l.titre;
    end if;
    if l.quantite < 1 or l.quantite > 20 then
      raise exception 'QUANTITE_INVALIDE';
    end if;
    if l.stock < l.quantite then
      raise exception 'STOCK_INSUFFISANT:% (%)', l.titre, l.taille;
    end if;

    v_sous_total := v_sous_total + l.prix * l.quantite;
    v_lignes := v_lignes || jsonb_build_object(
      'variant_id',    l.variant_id,
      'sku',           l.sku,
      'titre',         l.titre,
      'taille',        l.taille,
      'quantite',      l.quantite,
      'prix_unitaire', l.prix
    );
  end loop;

  if v_trouvees <> v_demandees then
    raise exception 'ARTICLE_INTROUVABLE';
  end if;

  insert into orders (client_nom, telephone, quartier, note,
                      sous_total, frais_livraison, total)
  values (btrim(p_client_nom),
          btrim(p_telephone),
          btrim(p_quartier),
          nullif(btrim(coalesce(p_note, '')), ''),
          v_sous_total, v_frais, v_sous_total + v_frais)
  returning id, numero into v_order_id, v_numero;

  insert into order_items (order_id, variant_id, sku, titre,
                           taille, quantite, prix_unitaire)
  select v_order_id,
         (e->>'variant_id')::bigint,
         e->>'sku',
         e->>'titre',
         e->>'taille',
         (e->>'quantite')::smallint,
         (e->>'prix_unitaire')::integer
    from jsonb_array_elements(v_lignes) e;

  -- Récapitulatif complet : /merci compose le message WhatsApp à partir
  -- de ceci, sans jamais relire la base.
  return jsonb_build_object(
    'numero',          v_numero,
    'sous_total',      v_sous_total,
    'frais_livraison', v_frais,
    'total',           v_sous_total + v_frais,
    'client_nom',      btrim(p_client_nom),
    'telephone',       btrim(p_telephone),
    'quartier',        btrim(p_quartier),
    'lignes',          v_lignes
  );
end;
$$;

-- INDISPENSABLE : en PostgreSQL, toute nouvelle fonction est exécutable
-- par PUBLIC. Sans ces révocations, n'importe qui appelle creer_commande
-- avec la clé anonyme et contourne la route serveur.
revoke all on function creer_commande(text, text, text, text, jsonb) from public;
revoke all on function creer_commande(text, text, text, text, jsonb) from anon;
revoke all on function creer_commande(text, text, text, text, jsonb) from authenticated;
grant execute on function creer_commande(text, text, text, text, jsonb) to service_role;


-- =====================================================================
-- 12. RLS
--
--    RÈGLE CENTRALE : le navigateur ne peut RIEN écrire.
--    Admin = présent dans la table admins, pas simplement connecté.
-- =====================================================================
alter table parametres     enable row level security;
alter table admins         enable row level security;
alter table categories     enable row level security;
alter table products       enable row level security;
alter table variants       enable row level security;
alter table product_images enable row level security;
alter table orders         enable row level security;
alter table order_items    enable row level security;

-- Lecture publique
drop policy if exists "param_lecture_publique" on parametres;
create policy "param_lecture_publique" on parametres
  for select to anon, authenticated using (true);

drop policy if exists "cat_lecture_publique" on categories;
create policy "cat_lecture_publique" on categories
  for select to anon, authenticated using (actif);

drop policy if exists "prod_lecture_publique" on products;
create policy "prod_lecture_publique" on products
  for select to anon, authenticated using (actif);

drop policy if exists "var_lecture_publique" on variants;
create policy "var_lecture_publique" on variants
  for select to anon, authenticated
  using (exists (select 1 from products p where p.id = product_id and p.actif));

drop policy if exists "img_lecture_publique" on product_images;
create policy "img_lecture_publique" on product_images
  for select to anon, authenticated
  using (exists (select 1 from products p where p.id = product_id and p.actif));

-- orders et order_items : AUCUNE politique publique. C'est volontaire.

-- Chacun voit sa propre ligne d'admin (pas de récursion possible)
drop policy if exists "admins_self" on admins;
create policy "admins_self" on admins
  for select to authenticated using (user_id = auth.uid());

-- Administration : réservée aux comptes listés dans admins
drop policy if exists "admin_parametres" on parametres;
create policy "admin_parametres" on parametres
  for all to authenticated using (est_admin()) with check (est_admin());

drop policy if exists "admin_categories" on categories;
create policy "admin_categories" on categories
  for all to authenticated using (est_admin()) with check (est_admin());

drop policy if exists "admin_products" on products;
create policy "admin_products" on products
  for all to authenticated using (est_admin()) with check (est_admin());

drop policy if exists "admin_variants" on variants;
create policy "admin_variants" on variants
  for all to authenticated using (est_admin()) with check (est_admin());

drop policy if exists "admin_images" on product_images;
create policy "admin_images" on product_images
  for all to authenticated using (est_admin()) with check (est_admin());

drop policy if exists "admin_orders" on orders;
create policy "admin_orders" on orders
  for all to authenticated using (est_admin()) with check (est_admin());

drop policy if exists "admin_order_items" on order_items;
create policy "admin_order_items" on order_items
  for all to authenticated using (est_admin()) with check (est_admin());


-- =====================================================================
-- 13. STOCKAGE DES PHOTOS
--     Chemin : produits/{sku}/{position}.webp   ex. produits/A3-002/1.webp
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('produits', 'produits', true)
on conflict (id) do nothing;

drop policy if exists "img_lecture_publique_storage" on storage.objects;
create policy "img_lecture_publique_storage" on storage.objects
  for select to anon, authenticated using (bucket_id = 'produits');

drop policy if exists "img_upload_admin" on storage.objects;
create policy "img_upload_admin" on storage.objects
  for insert to authenticated with check (bucket_id = 'produits' and est_admin());

drop policy if exists "img_maj_admin" on storage.objects;
create policy "img_maj_admin" on storage.objects
  for update to authenticated using (bucket_id = 'produits' and est_admin());

drop policy if exists "img_suppression_admin" on storage.objects;
create policy "img_suppression_admin" on storage.objects
  for delete to authenticated using (bucket_id = 'produits' and est_admin());


-- =====================================================================
-- 14. CATÉGORIES DE DÉPART
--     Tranches d'âge STRICTEMENT conformes au marquage des photos.
--     NE PAS MODIFIER sans re-marquer les 250 articles physiques.
-- =====================================================================
insert into categories (nom, slug, champ, valeur, ordre) values
  ('0 à 2 ans',   '0-2-ans',    'age_code',     '1',  1),
  ('3 à 5 ans',   '3-5-ans',    'age_code',     '2',  2),
  ('6 à 9 ans',   '6-9-ans',    'age_code',     '3',  3),
  ('10 à 13 ans', '10-13-ans',  'age_code',     '4',  4),
  ('Ensembles',   'ensembles',  'type_article', 'ensemble',   10),
  ('Robes',       'robes',      'type_article', 'robe',       11),
  ('Hauts',       'hauts',      'type_article', 'haut',       12),
  ('Bas',         'bas',        'type_article', 'bas',        13),
  ('Chaussures',  'chaussures', 'type_article', 'chaussures', 14),
  ('Filles',      'filles',     'genre',        'fille',      20),
  ('Garçons',     'garcons',    'genre',        'garcon',     21)
on conflict (slug) do nothing;


-- =====================================================================
-- 15. À FAIRE MANUELLEMENT APRÈS CE SCRIPT
--
--   1. Authentication > Providers : DÉSACTIVER les inscriptions
--   2. Authentication > Users : créer le compte administrateur
--   3. Exécuter, en remplaçant l'adresse :
--        insert into admins (user_id, email)
--        select id, email from auth.users where email = 'ton@email'
--        on conflict (user_id) do nothing;
--   4. Vercel > Firewall : ajouter une limite de débit sur /api/commande
--      (par exemple 10 requêtes par minute et par IP)
-- =====================================================================
