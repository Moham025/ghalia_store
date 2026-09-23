'use client';
export default function ProductError({ reset }: { reset: () => void }) {
  return <main className="empty"><h1>Impossible de charger cet article</h1><p>Réessaie dans quelques instants.</p><button className="primary" onClick={reset}>Réessayer</button><a href="/#collection">Retour à la collection</a></main>;
}
