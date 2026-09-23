import { Brand } from '@/components/brand';
export default function NotFound() {
  return <><header className="header"><Brand /></header><main className="empty"><h1>Cette page n’est pas disponible</h1><p>L’article a peut-être été retiré de la boutique.</p><a className="primary" href="/#collection">Voir les articles disponibles</a></main></>;
}
