export async function optimize(file:Blob):Promise<Blob>{
 if(file.size>15000000)throw new Error('Choisis une photo de moins de 15 Mo.');
 let bitmap:ImageBitmap;try{bitmap=await createImageBitmap(file);}catch{throw new Error('Photo illisible. Utilise une photo JPG, PNG ou WebP.');}
 const canvas=document.createElement('canvas');const ratio=Math.min(1,800/bitmap.width,1067/bitmap.height);canvas.width=Math.round(bitmap.width*ratio);canvas.height=Math.round(bitmap.height*ratio);
 const ctx=canvas.getContext('2d');if(!ctx){bitmap.close();throw new Error('Ce navigateur ne peut pas préparer la photo.');}ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
 for(const quality of [.84,.72,.6,.45]){const blob=await new Promise<Blob|null>(r=>canvas.toBlob(r,'image/webp',quality));if(blob?.type==='image/webp'&&blob.size<=150000)return blob;}
 throw new Error('Cette photo ne peut pas être optimisée. Essaie une image plus petite ou un navigateur récent.');
}
export async function upload(file:Blob){const body=await optimize(file);const r=await fetch('/api/upload',{method:'POST',body,headers:{'Content-Type':'image/webp'}});const data=await r.json() as {error?:string;url:string};if(!r.ok)throw new Error(data.error||'Import de photo impossible.');return data.url as string;}

