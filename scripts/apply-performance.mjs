import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { targetRoot, repoRoot } from './target-root.mjs';

const root=targetRoot();
const source=path.join(root,'assets/media/optimized/video-intro-crowdfunding.mp4');
const hero=path.join(root,'assets/media/optimized/video-intro-hero.mp4');
if(fs.existsSync(source) && !fs.existsSync(hero)) {
  const result=spawnSync('ffmpeg',['-y','-loglevel','error','-i',source,'-t','18','-vf',"scale='min(1280,iw)':-2,fps=24",'-an','-c:v','libx264','-crf','28','-pix_fmt','yuv420p','-movflags','+faststart',hero],{stdio:'inherit'});
  if(result.status!==0) {
    const fallback=path.join(repoRoot,'assets/media/optimized/video-intro-hero.mp4');
    if(root!==repoRoot && fs.existsSync(fallback)) fs.copyFileSync(fallback,hero);
    else throw new Error('No se pudo generar video-intro-hero.mp4');
  }
}
const file=path.join(root,'index.html');
if(fs.existsSync(file)) {
  let html=fs.readFileSync(file,'utf8');
  html=html.replace(/(<section class="home-hero">[\s\S]*?<video)\s+autoPlay=""/i,'$1 data-autoplay-hero=""');
  html=html.replace(/<source src="assets\/media\/optimized\/video-intro-crowdfunding\.mp4" type="video\/mp4"\/>/i,'<source src="assets/media/optimized/video-intro-hero.mp4" type="video/mp4"/>');
  html=html.replace(/(<video[^>]*src="assets\/media\/optimized\/video-intro-crowdfunding\.mp4"[^>]*?)preload="(?:metadata|auto)"/i,'$1preload="none"');
  html=html.replace(/<img\b([^>]*\bloading="lazy"[^>]*)>/gi,(tag,attrs)=>/\bdecoding=/.test(attrs)?tag:`<img${attrs} decoding="async">`);
  fs.writeFileSync(file,html,'utf8');
}
console.log('Rendimiento de portada aplicado.');
