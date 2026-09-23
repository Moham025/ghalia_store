import { cover, money, type Product } from './types';

export function whatsappOrderUrl(product: Product, size: string): string {
  const photoUrl = cover(product);
  const message = [
    'Bonjour Ghalia Store ! Je souhaite commander :',
    product.titre,
    `Référence : ${product.sku}`,
    `Taille : ${size}`,
    `Prix affiché : ${money(product.prix!)}`,
    'Pouvez-vous confirmer la disponibilité et la livraison ?',
    photoUrl ? `Photo de l’article :\n${photoUrl}` : null,
  ].filter(Boolean).join('\n');

  return `https://wa.me/22656886505?text=${encodeURIComponent(message)}`;
}
