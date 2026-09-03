import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { repoRoot, publicRootPages } from './target-root.mjs';

const root=repoRoot;
const dist=path.join(root,'dist');
const runNode=(script,env={})=>{
  const result=spawnSync(process.execPath,[script],{cwd:root,stdio:'inherit',env:{...process.env,...env}});
  if(result.status!==0) process.exit(result.status??1);
};
const copyDir=(from,to)=>fs.cpSync(from,to,{recursive:true});
const copyFile=(rel)=>{
  const from=path.join(root,rel); if(!fs.existsSync(from)) return;
  const to=path.join(dist,rel); fs.mkdirSync(path.dirname(to),{recursive:true}); fs.copyFileSync(from,to);
};

console.log('1/5 · Regenerando staging canónico...');
runNode('scripts/build-public.mjs',{WINSTON_PRODUCTION:'0',WINSTON_BUILD_ROOT:''});

console.log('2/5 · Creando dist/ limpio...');
fs.rmSync(dist,{recursive:true,force:true});
fs.mkdirSync(dist,{recursive:true});
copyDir(path.join(root,'assets'),path.join(dist,'assets'));
copyDir(path.join(root,'animales'),path.join(dist,'animales'));
for(const contentDir of ['blog','aprende','historias']) if(fs.existsSync(path.join(root,contentDir))) copyDir(path.join(root,contentDir),path.join(dist,contentDir));
if(fs.existsSync(path.join(root,'documentos'))) copyDir(path.join(root,'documentos'),path.join(dist,'documentos'));
for(const rel of [...publicRootPages(root),'administracion.html','404.html','robots.txt','sitemap.xml','_headers','_redirects','.nojekyll']) copyFile(rel);

const prodEnv={WINSTON_BUILD_ROOT:dist,WINSTON_PRODUCTION:'1'};
console.log('3/5 · Aplicando transformaciones de producción...');
for(const script of [
  'scripts/normalize-public-html.mjs','scripts/apply-seo.mjs','scripts/apply-structured-data.mjs','scripts/apply-performance.mjs',
  'scripts/apply-accessibility.mjs','scripts/build-404.mjs','scripts/build-sitemap.mjs','scripts/set-indexing.mjs',
  'scripts/build-cloudflare-config.mjs','scripts/apply-analytics.mjs'
]) runNode(script,prodEnv);

console.log('4/5 · Verificando artefacto de producción...');
const tests=spawnSync(process.execPath,['--test','tests/launch-readiness.test.mjs'],{
  cwd:root,stdio:'inherit',env:{...process.env,WINSTON_VERIFY_ROOT:'dist',WINSTON_PRODUCTION:'1'}
});
if(tests.status!==0) process.exit(tests.status??1);

console.log('5/5 · Release preparado en dist/.');
