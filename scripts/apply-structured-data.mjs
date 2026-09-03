import fs from 'node:fs';
import path from 'node:path';
import { targetRoot, publicRootPages } from './target-root.mjs';

const root = targetRoot();
const site = 'https://santuariowinston.org';
const names = {
  'index.html':'Inicio','habitantes.html':'Habitantes','guardianes.html':'Los Guardianes','tienda.html':'Tienda solidaria',
  'como-ayudar.html':'Cómo ayudar','hazte-socio.html':'Hazte socio','apadrina.html':'Apadrina','teaming.html':'Teaming','donar.html':'Donativos',
  'adopciones-solidarias.html':'Empresas solidarias','en-busca-del-paraiso.html':'En busca del paraíso','voluntariado.html':'Voluntariado',
  'testimonios.html':'Testimonios','voluntariado-habitual.html':'Voluntariado habitual','larga-estancia.html':'Larga estancia',
  'actividades.html':'Actividades','sobre-nosotros.html':'Sobre nosotros','transparencia.html':'Transparencia','contacto.html':'Contacto',
  'politica-de-privacidad.html':'Privacidad y cookies'
};
const parents = {
  'hazte-socio.html':['como-ayudar.html','Cómo ayudar'],'apadrina.html':['como-ayudar.html','Cómo ayudar'],'teaming.html':['como-ayudar.html','Cómo ayudar'],
  'donar.html':['como-ayudar.html','Cómo ayudar'],'adopciones-solidarias.html':['como-ayudar.html','Cómo ayudar'],'en-busca-del-paraiso.html':['como-ayudar.html','Cómo ayudar'],
  'testimonios.html':['voluntariado.html','Voluntariado'],'voluntariado-habitual.html':['voluntariado.html','Voluntariado'],'larga-estancia.html':['voluntariado.html','Voluntariado'],
  'guardianes.html':['habitantes.html','Descubre'],'sobre-nosotros.html':['habitantes.html','Descubre'],'transparencia.html':['habitantes.html','Descubre']
};
const text = html => (html.match(/<meta name="description" content="([^"]+)"\/>/i)?.[1] || 'Santuario Winston').trim();
const title = html => (html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || 'Santuario Winston').replace(/<[^>]+>/g,'').trim();
const canonical = html => html.match(/<link rel="canonical" href="([^"]+)"\/>/i)?.[1] || site + '/';
const inject = (html,data) => {
  const safe = JSON.stringify(data).replace(/</g,'\\u003c');
  html = html.replace(/<script type="application\/ld\+json" data-winston-launch>[\s\S]*?<\/script>/gi,'');
  return html.replace('</head>', `<script type="application/ld+json" data-winston-launch>${safe}</script></head>`);
};
let changed=0;
for (const rel of publicRootPages(root)) {
  const file=path.join(root,rel); if(!fs.existsSync(file)) continue;
  let html=fs.readFileSync(file,'utf8'); const before=html;
  let graph;
  if(rel==='index.html') {
    graph = [
      {'@type':'Organization','@id':`${site}/#organization`,name:'Santuario Winston',url:`${site}/`,logo:`${site}/assets/media/optimized/logos/logo-wisnton-sinfondo.webp`,telephone:'+34690143920',email:'santuariowinston@hotmail.com',sameAs:['https://www.instagram.com/santuario_winston/','https://www.facebook.com/santuariocaballoswinston/']},
      {'@type':'WebSite','@id':`${site}/#website`,name:'Santuario Winston',url:`${site}/`,inLanguage:'es',publisher:{'@id':`${site}/#organization`}},
      {'@type':'WebPage','@id':`${site}/#webpage`,url:`${site}/`,name:title(html),description:text(html),inLanguage:'es',isPartOf:{'@id':`${site}/#website`},about:{'@id':`${site}/#organization`}}
    ];
  } else {
    const crumbs=[{'@type':'ListItem',position:1,name:'Inicio',item:`${site}/`}];
    const parent=parents[rel];
    if(parent) crumbs.push({'@type':'ListItem',position:2,name:parent[1],item:`${site}/${parent[0]}`});
    crumbs.push({'@type':'ListItem',position:crumbs.length+1,name:names[rel] || title(html),item:canonical(html)});
    graph=[
      {'@type':'WebPage','@id':`${canonical(html)}#webpage`,url:canonical(html),name:title(html),description:text(html),inLanguage:'es',isPartOf:{'@id':`${site}/#website`}},
      {'@type':'BreadcrumbList','@id':`${canonical(html)}#breadcrumb`,itemListElement:crumbs}
    ];
  }
  html=inject(html,{'@context':'https://schema.org','@graph':graph});
  if(html!==before){fs.writeFileSync(file,html,'utf8');changed++;}
}
console.log(`Datos estructurados aplicados en ${changed} páginas raíz.`);
