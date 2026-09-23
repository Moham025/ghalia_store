import type { Metadata } from 'next';
import { SITE_URL } from './site';

export function socialMetadata(title: string, description: string, path: string, image?: string): Metadata {
  const url = new URL(path, SITE_URL).href;
  const images = image ? [{ url: new URL(image, SITE_URL).href, alt: title }] : [];
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'website', siteName: 'Ghalia Store', locale: 'fr_FR', images },
    twitter: { card: images.length ? 'summary_large_image' : 'summary', title, description, images },
  };
}
