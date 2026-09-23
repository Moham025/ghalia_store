"""Create web copies and a draft inventory; never modify source photos."""
from pathlib import Path
from PIL import Image, ImageOps
import json, re, hashlib

root = Path(__file__).resolve().parent.parent
source = Path(r'E:\Ghalia STore\photos')
dest = root / 'public' / 'photos'
dest.mkdir(parents=True, exist_ok=True)
groups = {}
for file in sorted(source.iterdir()):
    match = re.fullmatch(r'([1-4])\.(\d+)(?:_(\d+))?\.(?:jpg|jpeg|png)', file.name, re.I)
    if not match: continue
    age, number, position = int(match[1]), int(match[2]), int(match[3] or 1)
    code = f'{age}.{number}'
    digest = hashlib.sha256(file.read_bytes()).hexdigest()
    group = groups.setdefault(code, {'age':age,'number':number,'photos':[],'hashes':set()})
    if digest in group['hashes']: continue
    group['hashes'].add(digest)
    image = ImageOps.exif_transpose(Image.open(file)).convert('RGB')
    image.thumbnail((800,1067))
    output = dest / (file.stem + '.webp')
    image.save(output, 'WEBP', quality=83, method=6)
    if output.stat().st_size > 150000: image.save(output, 'WEBP', quality=68, method=6)
    group['photos'].append({'url':'/photos/'+output.name,'position':position})

ages=['0–2 ans','3–5 ans','6–9 ans','10–13 ans']
titles={'1.1':'Ensemble rose & imprimé tropical','1.2':'Ensemble rose à motif','1.3':'Ensemble bleu douceur','1.5':'Ensemble jaune soleil','1.17':'Haut et jupe fleurie','1.21':'Ensemble denim','1.25':'Ensemble vert tendre','1.56':'Ensemble jaune & imprimé','2.1':'Sweat gris et pantalon noir','2.3':'Ensemble à pois','2.4':'Ensemble colorblock','2.6':'Polo et jupe verte','2.8':'Ensemble esprit sport','2.12':'Polo orange et jupe marine','2.25':'Sweat bleu et pantalon noir','2.26':'Ensemble blanc dégradé','3.1':'Haut fleuri et pantalon','3.2':'Polo et jupe verte','3.4':'Ensemble blanc et orange','3.10':'Haut rose et jupe fleurie','3.13':'Ensemble à découvrir','3.37':'Haut rose et jean','4.1':'T-shirt rose et pantalon noir','4.2':'T-shirt noir et pantalon','4.3':'Ensemble rose','4.11':'Ensemble lilas','4.15':'Ensemble bleu ciel','4.17':'Ensemble rose vif','4.19':'Haut et jupe fleurie'}
items=[]
for i,(code,g) in enumerate(sorted(groups.items(),key=lambda x:(x[1]['age'],x[1]['number']))):
    photos=sorted(g['photos'],key=lambda p:p['position'])
    for n,p in enumerate(photos): p['position']=n+1
    items.append({'id':-(i+1),'photo_code':code,'sku':f"A{g['age']}-{g['number']:03}",'age_code':g['age'],'item_no':g['number'],'age_label':ages[g['age']-1],'titre':titles.get(code,'Ensemble enfant'),'description':None,'prix':None,'couleur':None,'genre':'mixte','type_article':'Ensemble','actif':False,'product_images':photos,'variants':[]})
(root/'lib'/'catalog-seed.json').write_text(json.dumps(items,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'products':len(items),'photos':sum(len(p['product_images']) for p in items),'bytes':sum(f.stat().st_size for f in dest.glob('*.webp'))}))
