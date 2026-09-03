# Preparación para Lanzamiento Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear un build reproducible de producción para `santuariowinston.org` con SEO técnico, rendimiento, accesibilidad, 404, configuración Cloudflare y separación segura entre staging y producción.

**Architecture:** La raíz del repositorio continúa siendo staging y mantiene `noindex,nofollow`. Un nuevo orquestador `scripts/build-release.mjs` crea `dist/`, copia solo recursos públicos, ejecuta transformaciones deterministas y valida la salida antes de considerarla publicable. Las 70 fichas siguen generándose desde `assets/data/habitantes.json`; Administración se copia sin cambiar su lógica y permanece noindex/no-cache.

**Tech Stack:** HTML estático, CSS, JavaScript ES modules para scripts de build, Node.js `node:test`, ffmpeg para la variante de vídeo hero, Cloudflare Pages `_headers`/`_redirects`.

**Spec:** `docs/superpowers/specs/2026-09-03-preparacion-lanzamiento-design.md`

## Global Constraints

- Preservar paleta, tipografía editorial, fotografía, navegación, textos y CTAs aprobados.
- No modificar datos históricos, cifras, historias, URLs de ayudas/Amazon, Supabase, app Android ni comportamiento del panel de Administración.
- Staging raíz: `noindex,nofollow` y `robots.txt` con `Disallow: /`.
- Producción `dist/`: 90 URLs públicas `index,follow`; Administración y 404 siempre `noindex,nofollow`.
- Canonical de producción: `https://santuariowinston.org/`.
- No inventar redirecciones históricas; solo normalizaciones seguras y un inventario JSON inicialmente vacío.
- No activar analítica en staging ni insertar Google Analytics.
- No imponer CSP estricta ni HSTS includeSubDomains en esta fase.
- No incluir `capacitor-mobile` ni secretos privados en el paquete.

---

### Task 1: Contrato de pruebas de lanzamiento y build `dist/`

**Files:**
- Create: `tests/launch-readiness.test.mjs`
- Create: `scripts/build-release.mjs`
- Modify: `scripts/build-public.mjs`

**Interfaces:**
- Consumes: estructura pública actual y scripts de build existentes.
- Produces: `node scripts/build-release.mjs` que crea `dist/` y termina con exit code 0 solo si la salida supera las validaciones.

- [ ] **Step 1: Escribir las pruebas de aceptación del release**

Crear `tests/launch-readiness.test.mjs` con helpers que inspeccionen la raíz y `dist/`. Debe comprobar como mínimo: staging noindex, producción indexable, 90 URLs en sitemap, 70 fichas, admin/404 fuera del sitemap, ausencia de `_vinext_fonts`, ausencia de CSS base inline duplicado, enlaces/recursos locales resolubles, ausencia de `winston-storage://` y service-role keys, JSON-LD, 404, `_headers`, `_redirects` y ausencia de `capacitor-mobile`.

- [ ] **Step 2: Ejecutar la prueba para confirmar fallo inicial**

Run:
```bash
node --test tests/launch-readiness.test.mjs
```
Expected: FAIL porque `dist/`, `404.html`, `_headers` y `_redirects` todavía no existen.

- [ ] **Step 3: Crear el orquestador mínimo de release**

`build-release.mjs` debe:
```js
const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
// copiar solo assets, animales, documentos públicos y HTML público necesario
// excluir docs, tests, scripts, ACTUALIZACION-*.txt, .git y capacitor-mobile
```
Después ejecutará scripts de transformación apuntando a `dist/` mediante `WINSTON_BUILD_ROOT=dist` y `WINSTON_PRODUCTION=1`.

- [ ] **Step 4: Ejecutar suite y conservar los fallos funcionales pendientes**

Run:
```bash
node --test tests/*.test.mjs
```
Expected: pruebas previas PASS; pruebas nuevas siguen fallando solo por tareas aún no implementadas.

- [ ] **Step 5: Commit**

```bash
git add tests/launch-readiness.test.mjs scripts/build-release.mjs scripts/build-public.mjs
git commit -m "test: define launch readiness contract"
```

---

### Task 2: Limpiar CSS heredado y fuentes rotas sin rediseñar

**Files:**
- Modify: `assets/css/winston-base.css`
- Create: `scripts/normalize-public-html.mjs`
- Modify: root public HTML files through the script

**Interfaces:**
- Consumes: las páginas raíz heredadas con `<style data-vinext-fonts>` y el bloque CSS base inline.
- Produces: páginas que cargan `assets/css/winston-base.css` + `assets/css/winston-enhancements.css` y no contienen `/_vinext_fonts/`.

- [ ] **Step 1: Añadir aserciones específicas de CSS/fuentes**

En `launch-readiness.test.mjs`, para cada HTML raíz público heredado:
```js
assert.ok(!html.includes('data-vinext-fonts'));
assert.ok(!html.includes('/assets/_vinext_fonts/'));
assert.match(html, /assets\/css\/winston-base\.css/);
assert.match(html, /assets\/css\/winston-enhancements\.css/);
```

- [ ] **Step 2: Confirmar que fallan sobre staging actual**

Run:
```bash
node --test tests/launch-readiness.test.mjs --test-name-pattern="CSS|fuentes"
```
Expected: FAIL por referencias heredadas actuales.

- [ ] **Step 3: Implementar `normalize-public-html.mjs`**

El script eliminará exactamente el `<style data-vinext-fonts>...</style>` y el gran `<style>...</style>` base que precede a `winston-enhancements.css`, manteniendo estilos específicos posteriores si los hubiera. Insertará antes de enhancements:
```html
<link rel="stylesheet" href="assets/css/winston-base.css"/>
```
En páginas de `/animales/` no hará cambios porque ya usan ambos CSS externos.

- [ ] **Step 4: Ejecutar normalización en staging y verificar**

Run:
```bash
node scripts/normalize-public-html.mjs
node --test tests/launch-readiness.test.mjs --test-name-pattern="CSS|fuentes"
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add assets/css/winston-base.css scripts/normalize-public-html.mjs *.html
git commit -m "perf: externalize inherited base CSS"
```

---

### Task 3: SEO técnico, Open Graph y datos estructurados

**Files:**
- Create: `scripts/apply-seo.mjs`
- Create: `scripts/apply-structured-data.mjs`
- Modify: `scripts/build-habitantes.mjs`
- Modify: generated public HTML

**Interfaces:**
- Consumes: title, description, canonical e imágenes ya presentes; `assets/data/habitantes.json`.
- Produces: metadatos homogéneos y JSON-LD válido sin inventar contenido.

- [ ] **Step 1: Añadir pruebas SEO**

Por cada una de las 90 páginas públicas en producción comprobar:
```js
assert.equal((html.match(/<title>/g) || []).length, 1);
assert.match(html, /<meta name="description" content="[^"]+"/);
assert.match(html, /<link rel="canonical" href="https:\/\/santuariowinston\.org\//);
assert.match(html, /property="og:image:alt"/);
assert.match(html, /name="twitter:card" content="summary_large_image"/);
assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1);
```
Inicio deberá contener `Organization` y `WebSite`; fichas, `BreadcrumbList`.

- [ ] **Step 2: Verificar fallo por metadata incompleta**

Run:
```bash
node --test tests/launch-readiness.test.mjs --test-name-pattern="SEO|JSON-LD|structured"
```
Expected: FAIL por `og:image:alt` y marcado estructurado incompleto.

- [ ] **Step 3: Implementar `apply-seo.mjs`**

El script trabajará sobre `WINSTON_BUILD_ROOT` y:
- mantendrá title/description/canonical existentes;
- sincronizará `og:url` con canonical;
- añadirá `og:image:alt` usando el H1 o nombre de página;
- garantizará Twitter card/title/description/image;
- en producción sustituirá robots de páginas públicas por `index,follow`;
- nunca cambiará robots de `administracion.html` ni `404.html`.

- [ ] **Step 4: Implementar `apply-structured-data.mjs` y actualizar fichas**

Inicio: insertar un `<script type="application/ld+json" data-winston-structured>` con `@graph` para `Organization` y `WebSite`, usando solo nombre, URL, logo, teléfono, email e Instagram/Facebook ya públicos.

Interiores: `WebPage` + `BreadcrumbList` cuando la jerarquía sea conocida.

Fichas: reemplazar el `Article` actual por un `@graph` que conserve Article y añada BreadcrumbList `Inicio → Habitantes → {nombre}`.

- [ ] **Step 5: Ejecutar build staging y tests SEO**

Run:
```bash
node scripts/build-public.mjs
node --test tests/launch-readiness.test.mjs --test-name-pattern="SEO|JSON-LD|structured"
```
Expected: PASS para staging en metadata excepto indexabilidad, que se validará en `dist/`.

- [ ] **Step 6: Commit**

```bash
git add scripts/apply-seo.mjs scripts/apply-structured-data.mjs scripts/build-habitantes.mjs animales *.html
git commit -m "seo: add launch metadata and structured data"
```

---

### Task 4: Rendimiento y movimiento reducido

**Files:**
- Create: `scripts/apply-performance.mjs`
- Create: `assets/media/optimized/video-intro-hero.mp4`
- Modify: `assets/css/winston-enhancements.css`
- Modify: `assets/js/winston.js`
- Modify: `index.html`

**Interfaces:**
- Consumes: `video-intro-crowdfunding.mp4` original de 90 s.
- Produces: hero decorativo de 18 s sin audio; vídeo completo disponible con `preload="none"` en la sección de campaña.

- [ ] **Step 1: Añadir pruebas de vídeo y carga**

Comprobar:
```js
assert.ok(fs.existsSync(heroVideo));
assert.ok(fs.statSync(heroVideo).size < fs.statSync(fullVideo).size);
assert.match(index, /video-intro-hero\.mp4/);
assert.match(index, /video-intro-crowdfunding\.mp4[^>]*preload="none"/);
assert.match(css, /prefers-reduced-motion:\s*reduce/);
```

- [ ] **Step 2: Confirmar fallo**

Run:
```bash
node --test tests/launch-readiness.test.mjs --test-name-pattern="vídeo|video|motion|rendimiento"
```
Expected: FAIL porque la variante hero no existe.

- [ ] **Step 3: Generar el vídeo hero**

Run:
```bash
ffmpeg -y -i assets/media/optimized/video-intro-crowdfunding.mp4 -t 18 -vf "scale='min(1280,iw)':-2,fps=24" -an -c:v libx264 -crf 28 -movflags +faststart assets/media/optimized/video-intro-hero.mp4
```

- [ ] **Step 4: Implementar transformación de rendimiento**

`apply-performance.mjs` cambiará solo en `index.html`:
- hero source → `video-intro-hero.mp4` y `preload="metadata"`;
- vídeo completo de campaña → `preload="none"`;
- añadirá `decoding="async"` a imágenes no críticas;
- conservará sin lazy el primer elemento visual crítico y lazy en contenido posterior.

CSS añadirá:
```css
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .home-hero video { display: none; }
}
```
JS no forzará reproducción si `matchMedia('(prefers-reduced-motion: reduce)').matches`.

- [ ] **Step 5: Verificar**

Run:
```bash
node scripts/apply-performance.mjs
node --test tests/launch-readiness.test.mjs --test-name-pattern="vídeo|video|motion|rendimiento"
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add scripts/apply-performance.mjs assets/media/optimized/video-intro-hero.mp4 assets/css/winston-enhancements.css assets/js/winston.js index.html
git commit -m "perf: optimize hero media and reduced motion"
```

---

### Task 5: Accesibilidad controlada por marcado y JS

**Files:**
- Create: `scripts/apply-accessibility.mjs`
- Modify: `assets/css/winston-enhancements.css`
- Modify: `assets/js/winston.js`
- Modify: public HTML through script

**Interfaces:**
- Consumes: skip links, menú móvil, formulario y controles existentes.
- Produces: foco visible, alt coherente, controles anunciables y menú con retorno de foco.

- [ ] **Step 1: Añadir pruebas de accesibilidad**

Comprobar en páginas públicas: `Saltar al contenido`, `<main id="contenido">`, un H1, foco CSS visible, menú móvil con `aria-expanded`, `aria-hidden`, `aria-controls`; formulario con labels y `#contact-form-status` live region; imágenes decorativas con alt vacío y habitantes con nombre cuando esté disponible.

- [ ] **Step 2: Confirmar fallos concretos**

Run:
```bash
node --test tests/launch-readiness.test.mjs --test-name-pattern="accesibilidad|focus|aria"
```
Expected: FAIL solo en requisitos aún no presentes.

- [ ] **Step 3: Implementar marcado y estilos**

`apply-accessibility.mjs` añadirá `role="status" aria-live="polite"` al estado del formulario si falta y normalizará `alt` genéricos del carrusel de inicio a los nombres visibles conocidos (Ula, Bartola, Auka, Zeus, Diva, Argos, Bayron, Junco, Canelo, Wapi, Brandy, Yako).

CSS añadirá un foco visible con `:focus-visible` y preservará la skip-link.

- [ ] **Step 4: Endurecer comportamiento del menú**

En `winston.js`, al abrir guardar el elemento activador; al cerrar devolver foco; Escape cierra; el estado `aria-expanded`/`aria-hidden` se mantiene sincronizado. No se añade un sistema nuevo de navegación.

- [ ] **Step 5: Verificar**

Run:
```bash
node scripts/apply-accessibility.mjs
node --test tests/launch-readiness.test.mjs --test-name-pattern="accesibilidad|focus|aria"
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add scripts/apply-accessibility.mjs assets/css/winston-enhancements.css assets/js/winston.js *.html
git commit -m "a11y: harden public navigation and form semantics"
```

---

### Task 6: 404, sitemap/robots de producción y configuración Cloudflare

**Files:**
- Create: `scripts/build-404.mjs`
- Create: `scripts/build-cloudflare-config.mjs`
- Create: `assets/data/legacy-redirects.json`
- Create: `404.html`
- Create: `_headers`
- Create: `_redirects`
- Modify: `scripts/build-sitemap.mjs`
- Modify: `scripts/set-indexing.mjs`

**Interfaces:**
- Consumes: shell público y lista de páginas públicas.
- Produces: 404 coherente y artefactos Cloudflare deterministas en staging/dist según modo.

- [ ] **Step 1: Añadir pruebas de 404/Cloudflare**

Comprobar que 404 tiene noindex y enlaces a Inicio/Habitantes/Cómo ayudar/Contacto; que `_headers` contiene reglas globales y no-cache admin; que `_redirects` contiene normalización `/index.html` y fichas; que legacy redirects JSON es un array vacío válido inicialmente.

- [ ] **Step 2: Confirmar fallo**

Run:
```bash
node --test tests/launch-readiness.test.mjs --test-name-pattern="404|headers|redirect"
```
Expected: FAIL.

- [ ] **Step 3: Crear 404**

`build-404.mjs` usará `header()` y `footer()` actuales y generará una página con `noindex,nofollow`, H1 “Página no encontrada” y los cuatro enlaces aprobados.

- [ ] **Step 4: Crear configuración Cloudflare**

`build-cloudflare-config.mjs` escribirá:
```txt
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: SAMEORIGIN
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/administracion.html
  Cache-Control: no-store
  X-Robots-Tag: noindex, nofollow
```
Y `_redirects`:
```txt
/index.html / 301
/animales/:slug/index.html /animales/:slug/ 301
```
seguido únicamente por entradas verificadas de `legacy-redirects.json`.

- [ ] **Step 5: Generar sitemap/robots por entorno**

`build-sitemap.mjs` mantendrá exactamente 90 URLs. `set-indexing.mjs` escribirá staging `Disallow: /` y producción `Allow: /` + Sitemap, sin indexar admin/404.

- [ ] **Step 6: Verificar**

Run:
```bash
node scripts/build-404.mjs
node scripts/build-cloudflare-config.mjs
node --test tests/launch-readiness.test.mjs --test-name-pattern="404|headers|redirect|sitemap|robots"
```
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add scripts/build-404.mjs scripts/build-cloudflare-config.mjs assets/data/legacy-redirects.json 404.html _headers _redirects scripts/build-sitemap.mjs scripts/set-indexing.mjs
git commit -m "ops: prepare Cloudflare release artifacts"
```

---

### Task 7: Checklist de migración, build completo y verificación final

**Files:**
- Create: `docs/launch/launch-checklist.md`
- Modify: `README.md`
- Modify: `scripts/build-release.mjs`

**Interfaces:**
- Consumes: todos los scripts anteriores.
- Produces: un artefacto `dist/` reproducible y documentación de lanzamiento segura.

- [ ] **Step 1: Escribir checklist exacta de migración**

Crear `docs/launch/launch-checklist.md` con los 20 pasos de la especificación, incluyendo explícitamente: no cancelar CloudAccess hasta validar producción, comprobar formulario Supabase real, redirecciones `.com → .org`, Search Console y sitemap.

- [ ] **Step 2: Integrar todos los pasos en `build-release.mjs`**

Orden:
```txt
copiar público → regenerar habitantes → normalizar HTML → SEO → structured data → performance → accessibility → 404 → sitemap/indexing producción → Cloudflare config → tests de release contra dist
```
El script terminará con mensaje de éxito solo si el proceso y pruebas devuelven exit code 0.

- [ ] **Step 3: Ejecutar suite completa de staging**

Run:
```bash
node scripts/build-public.mjs
node --test tests/*.test.mjs
```
Expected: 0 failures y staging sigue noindex.

- [ ] **Step 4: Ejecutar build de producción limpio**

Run:
```bash
node scripts/build-release.mjs
```
Expected: exit 0 y `dist/` creado.

- [ ] **Step 5: Ejecutar verificación completa sobre producción**

Run:
```bash
WINSTON_VERIFY_ROOT=dist node --test tests/launch-readiness.test.mjs
```
Expected: todas las pruebas PASS.

- [ ] **Step 6: Verificar inventarios y seguridad**

Run:
```bash
find dist/animales -mindepth 1 -maxdepth 1 -type d | wc -l
find dist/assets/media -type f | wc -l
grep -RIlE 'winston-storage://|SUPABASE_SERVICE_ROLE_KEY|service_role[[:space:]]*[:=]|/_vinext_fonts/' dist/ || true
```
Expected: 70 fichas; 120 archivos multimedia (119 originales + hero optimizado); grep sin resultados.

- [ ] **Step 7: Commit final**

```bash
git add docs/launch/launch-checklist.md README.md scripts/build-release.mjs tests/launch-readiness.test.mjs
git commit -m "release: prepare Winston web for production launch"
```
