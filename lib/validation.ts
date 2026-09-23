import { z } from 'zod';
export const productSchema = z.object({
 id:z.number().int().optional(), photo_code:z.string().regex(/^[1-4]\.[1-9]\d{0,5}$/),
 titre:z.string().trim().min(2).max(120), description:z.string().max(2000).nullable(),
 prix:z.number().int().min(1).max(10000000).nullable(), couleur:z.string().max(80).nullable(),
 genre:z.enum(['fille','garcon','mixte']), type_article:z.string().max(60).nullable(), actif:z.boolean(),
 variants:z.array(z.object({taille:z.string().trim().min(1).max(40),stock:z.number().int().min(0).max(9999)})).max(20),
 product_images:z.array(z.object({url:z.string().max(1000),position:z.number().int().min(1).max(8)})).max(8)
}).superRefine((p,ctx)=>{
 if(new Set(p.variants.map(v=>v.taille.toLowerCase())).size!==p.variants.length)ctx.addIssue({code:'custom',message:'Chaque taille doit être unique.'});
 if(p.actif&&(!p.prix||!p.product_images.length||!p.variants.some(v=>v.stock>0)))ctx.addIssue({code:'custom',message:'Pour publier : ajoute une photo, un prix et au moins une taille en stock.'});
});
