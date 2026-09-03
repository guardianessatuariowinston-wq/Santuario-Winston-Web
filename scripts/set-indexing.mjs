import fs from 'node:fs';
import path from 'node:path';
import { targetRoot, publicRootPages } from './target-root.mjs';
const root=targetRoot();
const production=process.env.WINSTON_PRODUCTION==='1';
const value=production?'index,follow':'noindex,nofollow';
const residents=JSON.parse(fs.readFileSync(path.join(root,'assets/data/habitantes.json'),'utf8'));
const pages=[...publicRootPages(root),...residents.map(r=>`animales/${r.slug}/index.html`)];
for(const rel of pages){
  const file=path.join(root,rel); let html=fs.readFileSync(file,'utf8');
  if(/<meta name="robots"[^>]*>/i.test(html)) html=html.replace(/<meta name="robots"[^>]*>/i,`<meta name="robots" content="${value}"/>`);
  else html=html.replace('</title>',`</title><meta name="robots" content="${value}"/>`);
  fs.writeFileSync(file,html,'utf8');
}
for(const rel of ['404.html']){
  const file=path.join(root,rel); if(!fs.existsSync(file)) continue;
  let html=fs.readFileSync(file,'utf8');
  if(/<meta name="robots"[^>]*>/i.test(html)) html=html.replace(/<meta name="robots"[^>]*>/i,'<meta name="robots" content="noindex,nofollow"/>');
  else html=html.replace('</title>','</title><meta name="robots" content="noindex,nofollow"/>');
  fs.writeFileSync(file,html,'utf8');
}
fs.writeFileSync(path.join(root,'robots.txt'),production
  ? 'User-agent: *\nAllow: /\n\nSitemap: https://santuariowinston.org/sitemap.xml\n'
  : 'User-agent: *\nDisallow: /\n','utf8');
console.log(`${pages.length} páginas públicas configuradas: ${value}`);
