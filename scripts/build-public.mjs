import { spawnSync } from 'node:child_process';
const production = process.env.WINSTON_PRODUCTION === '1';
const run = (script) => {
  const result = spawnSync(process.execPath, [script], { stdio: 'inherit', env: process.env });
  if (result.status !== 0) process.exit(result.status ?? 1);
};
run('scripts/extract-habitantes.mjs');
run('scripts/update-habitantes-directory.mjs');
run('scripts/build-storefront.mjs');
run('scripts/update-storefront-links.mjs');
run('scripts/update-public-shell.mjs');
run('scripts/build-habitantes.mjs');
run('scripts/update-public-domain.mjs');
run('scripts/build-sitemap.mjs');
run('scripts/set-indexing.mjs');
console.log(`Build público completo (${production ? 'producción' : 'staging'}).`);
