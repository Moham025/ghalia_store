export const SITE_URL = 'https://ghalia-store.ghalia-boutique.workers.dev';
export const SITE_TITLE = 'Ghalia Store · La mode des petits';
export const SITE_DESCRIPTION = 'Vêtements pour enfants de 0 à 13 ans à Ouagadougou. Choisis un article et prépare ta commande sur WhatsApp.';
export const productPath = (sku: string) => `/p/${encodeURIComponent(sku)}`;
export const productUrl = (sku: string) => SITE_URL + productPath(sku);
