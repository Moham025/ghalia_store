import { adminToken, checkOrigin, config, supa } from '@/lib/store';
export async function POST(req:Request){try{
 checkOrigin(req);const token=await adminToken();
 if(Number(req.headers.get('content-length')||0)>300000)return Response.json({error:'Image trop lourde. Réduis sa taille puis réessaie.'},{status:413});
 const bytes=await req.arrayBuffer();const b=new Uint8Array(bytes);
 const webp=b.length>12&&String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP';
 if(!webp||b.length>250000)return Response.json({error:'Utilise une image WebP optimisée de moins de 250 Ko.'},{status:400});
 const path=`catalogue/${crypto.randomUUID()}.webp`;
 await supa('/storage/v1/object/produits/'+path,{method:'POST',body:bytes,headers:{'Content-Type':'image/webp','x-upsert':'false'}},token);
 return Response.json({url:config().url+'/storage/v1/object/public/produits/'+path});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Import impossible.'},{status:400});}}
