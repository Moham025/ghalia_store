import { cookies } from 'next/headers';
import { checkOrigin, supa, type AuthSession } from '@/lib/store';
export async function POST(req:Request){
 try {checkOrigin(req);const {email,password}=await req.json() as {email?:unknown;password?:unknown};if(typeof email!=='string'||typeof password!=='string'||email.length>254||password.length>512)return Response.json({error:'Identifiants invalides.'},{status:400});
 const session=await supa<AuthSession>('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})});
 const admin=await supa('/rest/v1/rpc/est_admin',{method:'POST',body:'{}'},session.access_token);
 if(admin!==true)return Response.json({error:'Ce compte n’est pas administrateur de la boutique.'},{status:403});
 const jar=await cookies();const secure=new URL(req.url).protocol==='https:';
 jar.set('ghalia_session',session.access_token,{httpOnly:true,secure,sameSite:'strict',path:'/',maxAge:Math.max(60,session.expires_in-60)});
 jar.set('ghalia_refresh',session.refresh_token,{httpOnly:true,secure,sameSite:'strict',path:'/',maxAge:604800});
 return Response.json({ok:true});
 }catch{return Response.json({error:'Connexion impossible. Vérifie tes identifiants et les droits de ton compte.'},{status:401});}
}
export async function DELETE(req:Request){try{checkOrigin(req);const jar=await cookies();const token=jar.get('ghalia_session')?.value;if(token)await supa('/auth/v1/logout',{method:'POST'},token).catch(()=>null);jar.delete('ghalia_session');jar.delete('ghalia_refresh');return Response.json({ok:true});}catch{return Response.json({error:'Déconnexion impossible.'},{status:400});}}
