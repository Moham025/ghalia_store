import { adminToken, checkOrigin, config, configured, getCatalog, supa } from '@/lib/store';
import { productSchema } from '@/lib/validation';
export async function GET(){
 if(!configured())return Response.json({configured:false,products:[]});
 try {return Response.json({configured:true,products:await getCatalog(true)});}catch(e){return Response.json({error:e instanceof Error?e.message:'Accès refusé.'},{status:401});}
}
export async function POST(req:Request){try{
 checkOrigin(req);const token=await adminToken();
 if(Number(req.headers.get('content-length')||0)>50000)return Response.json({error:'Fiche trop volumineuse.'},{status:413});
 const raw=await req.text();if(raw.length>50000)return Response.json({error:'Fiche trop volumineuse.'},{status:413});
 const parsed=productSchema.safeParse(JSON.parse(raw));if(!parsed.success)return Response.json({error:parsed.error.issues[0].message},{status:400});
 const p=parsed.data;const {url}=config();
 if(p.product_images.some(im=>!im.url.startsWith(url+'/storage/v1/object/public/produits/')))return Response.json({error:'Les photos doivent être importées dans le stockage de la boutique.'},{status:400});
 const id=await supa('/rest/v1/rpc/enregistrer_produit',{method:'POST',body:JSON.stringify({fiche:p})},token);
 return Response.json({ok:true,id});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'La sauvegarde a échoué.'},{status:400});}}
