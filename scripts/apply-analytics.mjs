import fs from 'node:fs';
import path from 'node:path';
import { targetRoot, publicRootPages } from './target-root.mjs';
const root=targetRoot();
const token=(process.env.WINSTON_CF_WEB_ANALYTICS_TOKEN || '').trim();
const production=process.env.WINSTON_PRODUCTION==='1';
if(!production || !token) {
  console.log('Cloudflare Web Analytics preparado pero no activado.');
  process.exit(0);
}
const beacon=`<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='${JSON.stringify({token})}'></script>`;
for(const rel of publicRootPages(root)) {
  const file=path.join(root,rel); if(!fs.existsSync(file)) continue;
  let html=fs.readFileSync(file,'utf8');
  if(!html.includes('static.cloudflareinsights.com/beacon.min.js')) html=html.replace('</body>',`${beacon}</body>`);
  fs.writeFileSync(file,html,'utf8');
}
console.log('Cloudflare Web Analytics activado en producción mediante variable de entorno.');
