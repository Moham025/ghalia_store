import Catalog from './catalog';
import { configured } from '@/lib/store';
import { getPublicCatalog } from '@/lib/public-catalog';
import { cover } from '@/lib/types';
import { SITE_TITLE, SITE_DESCRIPTION } from '@/lib/site';
import { socialMetadata } from '@/lib/social-metadata';
export const dynamic = 'force-dynamic';
export async function generateMetadata() {
  const products = await getPublicCatalog().catch(() => []);
  const first = products.find(p => p.actif && cover(p));
  return socialMetadata(SITE_TITLE, SITE_DESCRIPTION, '/', first ? cover(first) : undefined);
}
export default async function Home() {
  try { return <Catalog products={await getPublicCatalog()} preview={!configured()} />; }
  catch { return <Catalog products={[]} error="Le catalogue est momentanément indisponible. Réessaie dans quelques instants." />; }
}
