export const ages = ['0–2 ans', '3–5 ans', '6–9 ans', '10–13 ans'];
export type Product = { id: number; photo_code: string; sku: string; age_code: number; item_no: number; age_label: string; titre: string; description: string | null; prix: number | null; couleur: string | null; genre: string; type_article: string | null; actif: boolean; product_images: { url: string; position: number }[]; variants: { taille: string; stock: number }[] };
export const money = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' F CFA';
export const stock = (p: Product) => p.variants.reduce((s, v) => s + v.stock, 0);
export const cover = (p: Product) => [...p.product_images].sort((a,b)=>a.position-b.position)[0]?.url;
