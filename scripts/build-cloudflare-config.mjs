import fs from 'node:fs';
import path from 'node:path';
import { targetRoot } from './target-root.mjs';
const root=targetRoot();
const dataFile=path.join(root,'assets/data/legacy-redirects.json');
fs.mkdirSync(path.dirname(dataFile),{recursive:true});
if(!fs.existsSync(dataFile)) fs.writeFileSync(dataFile,'[]\n','utf8');
const legacy=JSON.parse(fs.readFileSync(dataFile,'utf8'));
const contentRedirectsFile=path.join(root,'assets/data/content-redirects.json');
const contentRedirects=fs.existsSync(contentRedirectsFile)?JSON.parse(fs.readFileSync(contentRedirectsFile,'utf8')):[];
if(!Array.isArray(legacy)) throw new Error('legacy-redirects.json debe ser un array');
if(!Array.isArray(contentRedirects)) throw new Error('content-redirects.json debe ser un array');
const headers=`/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: SAMEORIGIN\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n\n/administracion.html\n  Cache-Control: no-store\n  X-Robots-Tag: noindex, nofollow\n`;
const verified=legacy.map(item=>{
  if(!item || typeof item.from!=='string' || typeof item.to!=='string') throw new Error('Redirección histórica inválida');
  const status=[301,302,307,308].includes(item.status)?item.status:301;
  return `${item.from} ${item.to} ${status}`;
});
const editorial=contentRedirects.map(item=>{
  const from=String(item?.from_path||item?.from||''); const to=String(item?.to_path||item?.to||'');
  if(!from.startsWith('/')||!to.startsWith('/')) throw new Error('Redirección editorial inválida');
  const status=[301,308].includes(Number(item.status_code||item.status))?Number(item.status_code||item.status):301;
  return `${from} ${to} ${status}`;
});
const redirects=['/index.html / 301','/animales/:slug/index.html /animales/:slug/ 301',...verified,...editorial].join('\n')+'\n';
fs.writeFileSync(path.join(root,'_headers'),headers,'utf8');
fs.writeFileSync(path.join(root,'_redirects'),redirects,'utf8');
console.log(`Configuración Cloudflare generada (${verified.length} históricas + ${editorial.length} editoriales).`);
