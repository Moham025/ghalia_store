'use client';
import { useState } from 'react';
import { ArrowUpRight, Check, MessageCircle, Share2 } from 'lucide-react';
import { DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { ages, money, stock, type Product } from '@/lib/types';
import { productPath, productUrl } from '@/lib/site';
import { whatsappOrderUrl } from '@/lib/whatsapp';

export default function ProductDetails({ product, preview = false, modal = false }: { product: Product; preview?: boolean; modal?: boolean }) {
  const inStock = product.variants.filter(v => v.stock > 0);
  const [size, setSize] = useState(inStock.length === 1 ? inStock[0].taille : '');
  const [photo, setPhoto] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const images = [...product.product_images].sort((a, b) => a.position - b.position);
  const available = product.variants.find(v => v.taille === size)?.stock ?? 0;
  const priceKnown = product.prix !== null && product.prix > 0;
  const canOrder = !preview && priceKnown && available > 0;
  const description = product.description || 'Un ensemble pour accompagner les journées des petits.';

  async function share() {
    const url = productUrl(product.sku);
    if (navigator.share) {
      try { await navigator.share({ title: product.titre, url }); return; }
      catch (error) { if (error instanceof Error && error.name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(url); setCopied(true); }
    catch { setShowLink(true); }
  }

  return <>
    <div className="detail-images">
      {images[photo] && <img src={images[photo].url} alt={product.titre} width="800" height="1067" fetchPriority={modal ? 'auto' : 'high'} />}
      {images.length > 1 && <div className="thumbs">{images.map((im, i) => <button key={im.url} aria-label={`Photo ${i + 1}`} aria-pressed={photo === i} onClick={() => setPhoto(i)}><img src={im.url} alt="" /></button>)}</div>}
    </div>
    <div className="detail-copy">
      <span className="eyebrow">{ages[product.age_code - 1]}</span>
      {modal ? <DialogTitle className="detail-title">{product.titre}</DialogTitle> : <h1 className="detail-title">{product.titre}</h1>}
      <p className="detail-price">{priceKnown ? money(product.prix!) : 'Prix à venir'}</p>
      <p className="product-reference">Référence : {product.sku}</p>
      {product.couleur && <p>Couleur : {product.couleur}</p>}
      <fieldset className="sizes"><legend>Choisis la taille</legend>{product.variants.length ? product.variants.map(v => <button disabled={!v.stock || preview} aria-pressed={size === v.taille} className={size === v.taille ? 'chosen' : ''} key={v.taille} onClick={() => setSize(v.taille)}>{v.taille}{!v.stock ? ' · épuisée' : ''}</button>) : <p>Tailles à renseigner</p>}</fieldset>
      <div className="purchase-actions">
        {canOrder ? <a className="primary whatsapp" target="_blank" rel="noreferrer" href={whatsappOrderUrl(product, size)}><MessageCircle size={19} />Commander sur WhatsApp</a> : <button className="primary" disabled>{preview ? 'Bientôt disponible' : stock(product) === 0 ? 'Article épuisé' : !priceKnown ? 'Prix à venir' : 'Choisis une taille'}</button>}
        <p className="detail-note">Livraison à Ouagadougou : frais et disponibilité confirmés sur WhatsApp.</p>
      </div>
      {modal ? <DialogDescription>{description}</DialogDescription> : <p className="product-description">{description}</p>}
      {!preview && <div className="product-links"><button type="button" className="share-product" onClick={share}>{copied ? <Check size={17} /> : <Share2 size={17} />}{copied ? 'Lien copié' : 'Partager cet article'}</button>{modal && <a href={productPath(product.sku)}>Voir la fiche <ArrowUpRight size={16} /></a>}</div>}
      {copied && <span className="sr-only" role="status">Le lien de l’article est copié.</span>}
      {showLink && <label className="share-fallback">Lien à copier<input readOnly value={productUrl(product.sku)} onFocus={e => e.target.select()} /></label>}
    </div>
  </>;
}
