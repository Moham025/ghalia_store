import { ages, type Product } from './types';

export const DEFAULT_PRICE = 3000;

export function sizeFromReference(reference: string): string {
  const match = reference.match(/^([1-4])\.[1-9]\d{0,5}$/);
  return match ? ages[Number(match[1]) - 1] : '';
}

export function prepareEditor(product: Product): Product {
  const copy = structuredClone(product);
  const size = sizeFromReference(copy.photo_code);
  return {
    ...copy,
    prix: copy.prix ?? DEFAULT_PRICE,
    variants: copy.variants.length
      ? copy.variants.map(v => v.taille.trim() ? v : { taille: size, stock: v.stock || 1 })
      : [{ taille: size, stock: 1 }],
  };
}

export function updateEditorReference(product: Product, reference: string, automaticSize: boolean): Product {
  const size = sizeFromReference(reference);
  return {
    ...product,
    photo_code: reference,
    ...(size ? { age_code: Number(reference[0]), age_label: size } : {}),
    variants: automaticSize && product.variants.length === 1
      ? [{ ...product.variants[0], taille: size }]
      : product.variants,
  };
}

export function additionalVariant(product: Product): Product['variants'][number] {
  const size = sizeFromReference(product.photo_code);
  const normalize = (value: string) => value.trim().replace(/[–—]/g, '-').toLowerCase();
  return { taille: product.variants.some(v => normalize(v.taille) === normalize(size)) ? '' : size, stock: 1 };
}
