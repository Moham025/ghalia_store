import { cookies } from 'next/headers';
import type { Product } from './types';
import seed from './catalog-seed.json';
export function config() { return { url: process.env.SUPABASE_URL?.replace(/\/$/, ''), key: process.env.SUPABASE_PUBLISHABLE_KEY }; }
export function configured() { const c = config(); return Boolean(c.url && c.key); }
export type AuthSession = {access_token:string;refresh_token:string;expires_in:number};
export async function supa<T=unknown>(path: string, init: RequestInit = {}, token?: string):Promise<T> {
  const { url, key } = config();
  if (!url || !key) throw new Error('Supabase doit être connecté avant de sauvegarder.');
  const headers = new Headers(init.headers); headers.set('apikey', key);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (typeof init.body === 'string') headers.set('Content-Type', 'application/json');
  const r = await fetch(url + path, {...init, headers, cache: 'no-store'});
  if (!r.ok) { console.error('Supabase request failed', r.status, path.split('?')[0]); throw new Error(r.status === 401 || r.status === 403 ? 'Accès refusé. Reconnecte-toi avec un compte administrateur.' : 'La sauvegarde ou le chargement a échoué. Vérifie la connexion et réessaie.'); }
  return (r.status === 204 ? null : await r.json()) as T;
}
export async function adminToken() {
  const jar=await cookies();
  let token = jar.get('ghalia_session')?.value;
  if(!token&&jar.get('ghalia_refresh')?.value){
    const session=await supa<AuthSession>('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:jar.get('ghalia_refresh')!.value})});
    token=session.access_token;
    const opts={httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict' as const,path:'/'};
    jar.set('ghalia_session',token!,{...opts,maxAge:Math.max(60,session.expires_in-60)});
    jar.set('ghalia_refresh',session.refresh_token,{...opts,maxAge:604800});
  }
  if (!token) throw new Error('Connexion administrateur requise.');
  const valid = await supa('/rest/v1/rpc/est_admin', {method:'POST',body:'{}'}, token);
  if (valid !== true) throw new Error('Ce compte ne possède pas les droits administrateur.');
  return token;
}
export async function getCatalog(admin = false): Promise<Product[]> {
  if (!configured()) return seed as Product[];
  const token = admin ? await adminToken() : undefined;
  return supa<Product[]>('/rest/v1/products?select=id,photo_code,sku,age_code,item_no,age_label,titre,description,prix,couleur,genre,type_article,actif,product_images(url,position),variants(taille,stock)&order=age_code,item_no&limit=1000' + (admin ? '' : '&actif=eq.true'), {}, token);
}
export function checkOrigin(req: Request) { const o = req.headers.get('origin'); if (!o || new URL(req.url).origin !== o) throw new Error('Origine de la requête refusée.'); }
