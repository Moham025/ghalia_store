import { notFound } from 'next/navigation';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { Brand } from '@/components/brand';
import ProductDetails from '@/app/product-details';
import { getPublicProduct } from '@/lib/public-catalog';
import { ages, cover, money } from '@/lib/types';
import { productPath } from '@/lib/site';
import { socialMetadata } from '@/lib/social-metadata';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ sku: string }> };

export async function generateMetadata({ params }: Props) {
  const { sku } = await params;
  const product = await getPublicProduct(sku);
  if (!product) return { title: 'Article introuvable · Ghalia Store', robots: { index: false, follow: false }, openGraph: { images: [] }, twitter: { images: [] } };
  const price = product.prix ? ` · ${money(product.prix)}` : '';
  return socialMetadata(`${product.titre}${price} · Ghalia Store`, `${ages[product.age_code - 1]}${price}. Commande sur WhatsApp. Livraison à Ouagadougou à organiser avec la boutique.`, productPath(sku), cover(product));
}

export default async function ProductPage({ params }: Props) {
  const { sku } = await params;
  const product = await getPublicProduct(sku);
  if (!product) notFound();
  return <>
    <header className="header"><Brand /><a className="contact" href="https://wa.me/22656886505" target="_blank" rel="noreferrer"><MessageCircle size={19} /><span>Nous écrire</span></a></header>
    <main className="product-page"><a className="back-to-catalog" href="/#collection"><ArrowLeft size={17} />Voir la collection</a><article className="product-sheet"><ProductDetails key={product.sku} product={product} /></article></main>
  </>;
}
