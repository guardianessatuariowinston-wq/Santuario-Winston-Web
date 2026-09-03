import fs from 'node:fs';
import path from 'node:path';
import { targetRoot } from './target-root.mjs';
const root=targetRoot();
const file=path.join(root,'index.html');
if(fs.existsSync(file)) {
  let html=fs.readFileSync(file,'utf8');
  const residents=['Ula','Bartola','Auka','Zeus','Diva','Argos','Bayron','Junco','Canelo','Wapi','Brandy','Yako'];
  let i=0;
  html=html.replace(/alt="Santuario Winston · imagen \d+"/g,()=>`alt="${residents[i++] || 'Habitante del Santuario Winston'}"`);
  fs.writeFileSync(file,html,'utf8');
}
const contact=path.join(root,'contacto.html');
if(fs.existsSync(contact)) {
  let html=fs.readFileSync(contact,'utf8');
  html=html.replace(/id="contact-form-status"(?![^>]*role=)/i,'id="contact-form-status" role="status" aria-live="polite"');
  fs.writeFileSync(contact,html,'utf8');
}
console.log('Mejoras de accesibilidad aplicadas.');
