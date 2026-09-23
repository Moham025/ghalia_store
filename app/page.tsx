import Catalog from './catalog';
import { getCatalog, configured } from '@/lib/store';
export const dynamic = 'force-dynamic';
export default async function Home() {
  try { return <Catalog products={await getCatalog()} preview={!configured()} />; }
  catch { return <Catalog products={[]} error="Le catalogue est momentanément indisponible. Réessaie dans quelques instants." />; }
}
