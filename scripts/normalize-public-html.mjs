import fs from 'node:fs';
import path from 'node:path';
import { targetRoot, publicRootPages } from './target-root.mjs';

const root = targetRoot();
let changed = 0;
for (const name of publicRootPages(root)) {
  const file = path.join(root, name);
  if (!fs.existsSync(file)) continue;
  const before = fs.readFileSync(file, 'utf8');
  let html = before;
  html = html.replace(/\s*<style data-vinext-fonts>[\s\S]*?<\/style>\s*/i, '\n');
  html = html.replace(/\s*<style>\s*:root\s*\{[\s\S]*?<\/style>\s*/i, '\n');
  html = html.replace(/class="__variable_geist_0tvmz3h\s+antialiased"/g, 'class="antialiased"');
  if (!/assets\/css\/winston-base\.css/i.test(html)) {
    html = html.replace(/<link rel="stylesheet" href="assets\/css\/winston-enhancements\.css"\/>/i,
      '<link rel="stylesheet" href="assets/css/winston-base.css"/><link rel="stylesheet" href="assets/css/winston-enhancements.css"/>');
  }
  if (html !== before) {
    fs.writeFileSync(file, html, 'utf8');
    changed++;
  }
}
console.log(`HTML público normalizado en ${changed} páginas (${root}).`);
