const base=process.env.SUPABASE_URL;
const key=process.env.SUPABASE_PUBLISHABLE_KEY;
if(!base||!key)throw new Error('Configuration Supabase manquante.');
const headers={apikey:key,Authorization:`Bearer ${key}`};
const checks=[
 ['catalogue','/rest/v1/products?select=id,photo_code,titre,prix,product_images(url,position),variants(taille,stock)&actif=eq.true&limit=1'],
 ['administrateurs','/rest/v1/admins?select=user_id&limit=1'],
 ['commandes','/rest/v1/orders?select=id&limit=1'],
 ['auth','/auth/v1/settings'],
];
for(const [name,path] of checks){
 try{const r=await fetch(base+path,{headers,signal:AbortSignal.timeout(15000)});const data=await r.json();
 if(name==='schema'&&r.ok){const paths=Object.keys(data.paths||{});console.log(JSON.stringify({name,status:r.status,hasProducts:paths.includes('/products'),hasSave:paths.includes('/rpc/enregistrer_produit'),hasAdmin:paths.includes('/rpc/est_admin')}));}
 else if(name==='auth'&&r.ok)console.log(JSON.stringify({name,status:r.status,emailEnabled:data.external?.email,signupDisabled:data.disable_signup}));
 else console.log(JSON.stringify({name,status:r.status,...(Array.isArray(data)?{visibleRows:data.length}:{code:data.code||data.error_code,message:data.message||data.msg||data.error})}));
 }catch(e){console.log(JSON.stringify({name,error:e.message}));}
}
// Invalid empty draft: cannot insert a product, even if mistakenly callable.
const probe=await fetch(base+'/rest/v1/rpc/enregistrer_produit',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({fiche:{}}),signal:AbortSignal.timeout(15000)});
const result=await probe.json();
console.log(JSON.stringify({name:'save-function',status:probe.status,code:result.code,message:result.message}));
