import { money, type Product } from './types';
import { productUrl } from './site';

export function whatsappOrderUrl(product: Product, size: string): string {
  const message = [
    'Bonjour Ghalia Store ! Je souhaite commander :',
    product.titre,
    `Référence : ${product.sku}`,
    `Taille : ${size}`,
    `Prix affiché : ${money(product.prix!)}`,
    'Pouvez-vous confirmer la disponibilité et la livraison ?',
    `Article :\n${productUrl(product.sku)}`,
  ].filter(Boolean).join('\n');

  return `https://wa.me/22656886505?text=${encodeURIComponent(message)}`;
}
