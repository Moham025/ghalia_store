import assert from 'node:assert/strict';
import { productSchema } from '../lib/validation.ts';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const seed=JSON.parse(readFileSync(new URL('../lib/catalog-seed.json',import.meta.url),'utf8'));
assert.equal(seed.length,95);
assert.equal(new Set(seed.map(p=>p.photo_code)).size,seed.length);
for(const p of seed){assert.equal(productSchema.safeParse(p).success,true);assert.equal(p.actif,false);for(const im of p.product_images){const file=new URL('../public'+im.url,import.meta.url);assert.ok(existsSync(file));assert.ok(statSync(file).size<=150000);}}
const draft=seed[0];
assert.equal(productSchema.safeParse({...draft,actif:true}).success,false,'Unknown price and stock cannot be published');
assert.equal(productSchema.safeParse({...draft,prix:5000,actif:true,variants:[{taille:'2 ans',stock:1}]}).success,true);
assert.equal(productSchema.safeParse({...draft,prix:5000,actif:true,variants:[{taille:'2 ans',stock:0}]}).success,false);
assert.equal(productSchema.safeParse({...draft,prix:-1}).success,false);
assert.equal(productSchema.safeParse({...draft,prix:5000.5}).success,false);
assert.equal(productSchema.safeParse({...draft,variants:[{taille:'2 ans',stock:1},{taille:'2 ANS',stock:2}]}).success,false);
assert.equal(productSchema.safeParse({...draft,photo_code:'1.0'}).success,false);
assert.equal(productSchema.safeParse({...draft,variants:[{taille:'2 ans',stock:-1}]}).success,false);
console.log('Catalogue verified: 95 draft references, all web images under 150 KB, publication/price/stock validation passed.');
