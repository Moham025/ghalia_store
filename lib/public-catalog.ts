import { cache } from 'react';
import { configured, getCatalog, supa } from './store';
import type { Product } from './types';

export const getPublicCatalog = cache(() => getCatalog());

// Both metadata and the page use the same request-scoped result.
export const getPublicProduct = cache(async (sku: string): Promise<Product | null> => {
  if (!/^A[1-4]-\d{3,6}$/.test(sku) || !configured()) return null;
  const products = await supa<Product[]>(
    '/rest/v1/products?select=id,photo_code,sku,age_code,item_no,age_label,titre,description,prix,couleur,genre,type_article,actif,product_images(url,position),variants(taille,stock)' +
    `&sku=eq.${encodeURIComponent(sku)}&actif=eq.true&limit=1`,
  );
  return products[0] ?? null;
});
