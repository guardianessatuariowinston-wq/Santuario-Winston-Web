# Tienda Solidaria Santuario Winston Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir una landing pública `tienda.html` integrada con Santuario Winston, con libros reales enlazados a Amazon, colecciones POD marcadas como “En preparación” y una arquitectura lista para enlazar más adelante con `https://tienda.santuariowinston.org/` sin activar carrito ni pagos.

**Architecture:** La web institucional seguirá siendo estática. `scripts/build-storefront.mjs` generará `tienda.html` desde contenido confirmado y `scripts/public-shell.mjs` expondrá Tienda en navegación y footer. `scripts/build-public.mjs` ejecutará el generador antes de actualizar el shell, habitantes, sitemap e indexación; el staging seguirá `noindex,nofollow`.

**Tech Stack:** HTML estático, CSS existente + `assets/css/winston-enhancements.css`, JavaScript/Node.js ESM, `node:test`, GitHub Pages staging.

**Spec:** `docs/superpowers/specs/2026-09-03-tienda-solidaria-design.md`

## Global Constraints

- Mantener la estética verde/crema/natural, fotografía grande, tipografía editorial, aire y tarjetas suaves.
- No inventar productos, precios, descuentos, porcentajes de ayuda, stock, tallas, plazos de entrega ni diseños.
- Kindle debe enlazar exactamente a `https://www.amazon.es/dp/B0GX2YP7SR`.
- Tapa blanda debe enlazar exactamente a `https://amzn.eu/d/05Ol7VgK`.
- Ropa, Guardianes y accesorios se muestran solo como familias de producto con estado `En preparación`.
- No crear carrito, checkout, formulario de tarjeta, Stripe/PayPal ni catálogo Printful.
- No tocar app Android, `capacitor-mobile`, Supabase ni `administracion.html`.
- GitHub Pages continúa en staging con `noindex,nofollow` y `robots.txt` bloqueando indexación.
- La futura tienda comercial se enlazará mediante `https://tienda.santuariowinston.org/` cuando exista.

---

### Task 1: Contrato automatizado de la Tienda Solidaria

**Files:**
- Create: `tests/storefront.test.mjs`
- Read: `tests/admin-baseline.json`

**Interfaces:**
- Consumes: archivos públicos generados en la raíz y `assets/data/habitantes.json`.
- Produces: contrato de pruebas que define presencia de `tienda.html`, enlaces Amazon, ausencia de ecommerce falso, navegación, sitemap, staging y preservación de Administración.

- [ ] **Step 1: Write the failing test**

Crear `tests/storefront.test.mjs` con pruebas que exijan:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(import.meta.dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const sha = rel => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, rel))).digest('hex');
const residents = JSON.parse(read('assets/data/habitantes.json'));
const adminBaseline = JSON.parse(read('tests/admin-baseline.json'));

const publicRoots = ['index.html','habitantes.html','guardianes.html','como-ayudar.html','voluntariado.html','actividades.html','sobre-nosotros.html','contacto.html','tienda.html'];

test('storefront exists with confirmed books and preparation-only POD collections', () => {
  const html = read('tienda.html');
  assert.ok(html.includes('Tienda solidaria'));
  assert.ok(html.includes('https://www.amazon.es/dp/B0GX2YP7SR'));
  assert.ok(html.includes('https://amzn.eu/d/05Ol7VgK'));
  for (const label of ['Ropa solidaria','Los Guardianes del Santuario Winston','Accesorios y objetos cotidianos']) assert.ok(html.includes(label));
  assert.ok((html.match(/En preparación/g) || []).length >= 3);
});

test('storefront contains no fake commerce or invented POD prices', () => {
  const html = read('tienda.html');
  assert.doesNotMatch(html, /<form[^>]*(?:checkout|card|tarjeta)|stripe|paypal|añadir al carrito|add to cart/i);
  assert.doesNotMatch(html, /(?:€|EUR)\s*\d|\d+[,.]\d{2}\s*€/i);
  assert.doesNotMatch(html, /Printful|Hostinger/i);
});

test('storefront is linked from desktop mobile footer and resident pages', () => {
  for (const page of publicRoots) assert.ok(read(page).includes('tienda.html'), page);
  for (const resident of residents) assert.ok(read(`animales/${resident.slug}/index.html`).includes('../../tienda.html'), resident.slug);
});

test('Guardianes remains editorial while linking to storefront', () => {
  const html = read('guardianes.html');
  assert.ok(html.includes('tienda.html'));
  assert.doesNotMatch(html, /añadir al carrito|checkout|precio/i);
});

test('Cómo ayudar and Inicio expose a discreet storefront path', () => {
  assert.ok(read('como-ayudar.html').includes('tienda.html'));
  assert.ok(read('index.html').includes('tienda.html'));
});

test('sitemap contains storefront and staging remains blocked', () => {
  assert.ok(read('sitemap.xml').includes('/tienda.html'));
  assert.match(read('robots.txt'), /Disallow:\s*\//);
  assert.match(read('tienda.html'), /<meta name="robots" content="noindex,nofollow"\/>/i);
});

test('admin remains byte-identical to approved baseline', () => {
  for (const [rel, expected] of Object.entries(adminBaseline)) assert.equal(sha(rel), expected, rel);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node --test tests/storefront.test.mjs
```

Expected: FAIL because `tienda.html` does not exist and navigation does not yet contain Tienda.

- [ ] **Step 3: Keep the test as the acceptance contract**

No production changes in this task. The failure is the red state required for Tasks 2–6.

- [ ] **Step 4: Commit**

```bash
git add tests/storefront.test.mjs
git commit -m "test: define tienda solidaria contract"
```

---

### Task 2: Generador de la landing `tienda.html`

**Files:**
- Create: `scripts/build-storefront.mjs`
- Create/Generate: `tienda.html`
- Modify: `scripts/build-public.mjs`

**Interfaces:**
- Consumes: `header()` y `footer()` de `scripts/public-shell.mjs`, CSS/JS existentes y enlaces Amazon confirmados.
- Produces: `tienda.html` reproducible con hero, funcionamiento POD, colecciones en preparación, libros, transparencia y CTA final.

- [ ] **Step 1: Run the specific failing test**

```bash
node --test tests/storefront.test.mjs --test-name-pattern="storefront exists"
```

Expected: FAIL con `ENOENT` para `tienda.html`.

- [ ] **Step 2: Implement `scripts/build-storefront.mjs`**

Crear un generador ESM que importe `header` y `footer`, escriba `tienda.html` y use exactamente estas constantes:

```js
const KINDLE_URL = 'https://www.amazon.es/dp/B0GX2YP7SR';
const PAPERBACK_URL = 'https://amzn.eu/d/05Ol7VgK';
const FUTURE_STORE = 'https://tienda.santuariowinston.org/';
```

La página debe contener:

- `<title>Tienda solidaria · Santuario Winston</title>`;
- descripción propia;
- canonical `https://santuariowinston.org/tienda.html`;
- Open Graph/Twitter Card;
- `meta robots` de staging, que después podrá normalizar `set-indexing.mjs`;
- hero con eyebrow `Tienda solidaria`;
- CTA `Ver los libros` anclado a `#libros`;
- CTA secundario `Otras formas de ayudar` a `como-ayudar.html`;
- tres pasos de funcionamiento;
- tres tarjetas con `En preparación`: Ropa solidaria, Los Guardianes del Santuario Winston, Accesorios y objetos cotidianos;
- sección `#libros` con Kindle y Tapa blanda y sus enlaces exactos en nueva pestaña;
- nota de transparencia indicando que la colección se producirá principalmente bajo demanda y la tienda comercial está en preparación;
- cierre con `guardianes.html` y `como-ayudar.html`;
- `data-future-store="https://tienda.santuariowinston.org/"` como punto de integración futuro, sin convertirlo en botón de compra activo.

- [ ] **Step 3: Add generator to public build**

En `scripts/build-public.mjs`, insertar:

```js
run('scripts/build-storefront.mjs');
```

antes de `run('scripts/update-public-shell.mjs');`, para que la página recién generada reciba el shell público actualizado.

- [ ] **Step 4: Build and verify the storefront-content test passes**

```bash
node scripts/build-storefront.mjs
node --test tests/storefront.test.mjs --test-name-pattern="storefront exists"
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/build-storefront.mjs scripts/build-public.mjs tienda.html
git commit -m "feat: add tienda solidaria landing"
```

---

### Task 3: Navegación global y fichas de habitantes

**Files:**
- Modify: `scripts/public-shell.mjs`
- Modify: `scripts/update-public-shell.mjs`
- Generated: root public HTML pages
- Generated: `animales/*/index.html`

**Interfaces:**
- Consumes: `desktopNav(prefix, active)`, `mobileNav(prefix)`, `footer(prefix)`, `header(prefix, active)`.
- Produces: Tienda como primer nivel entre Actividades y Contacto en desktop/móvil y enlace en footer; `active='tienda'` en `tienda.html`.

- [ ] **Step 1: Run navigation test and verify red**

```bash
node --test tests/storefront.test.mjs --test-name-pattern="linked from desktop"
```

Expected: FAIL porque las páginas actuales y las fichas de habitantes no enlazan Tienda.

- [ ] **Step 2: Modify the shell**

En `desktopNav()` añadir:

```html
<div class="nav-item"><a class="${activeClass(active,'tienda')}" href="${href(prefix,'tienda.html')}">Tienda</a></div>
```

inmediatamente después de Actividades y antes de Contacto.

En `mobileNav()` añadir un grupo Tienda antes de Contacto:

```html
<div class="drawer-group"><a href="${href(prefix,'tienda.html')}">Tienda</a></div>
```

En `footer()` añadir `Tienda solidaria` dentro de Participa:

```html
<a href="${href(prefix,'tienda.html')}">Tienda solidaria</a>
```

- [ ] **Step 3: Teach root updater the active state**

En `scripts/update-public-shell.mjs` añadir:

```js
if (name === 'tienda.html') return 'tienda';
```

- [ ] **Step 4: Rebuild shell and residents**

```bash
node scripts/update-public-shell.mjs
node scripts/build-habitantes.mjs
```

- [ ] **Step 5: Verify navigation test passes**

```bash
node --test tests/storefront.test.mjs --test-name-pattern="linked from desktop"
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add scripts/public-shell.mjs scripts/update-public-shell.mjs *.html animales
git commit -m "feat: expose tienda in public navigation"
```

---

### Task 4: Integración editorial con Guardianes, Inicio y Cómo ayudar

**Files:**
- Create: `scripts/update-storefront-links.mjs`
- Modify: `scripts/build-public.mjs`
- Generated/Modify: `guardianes.html`
- Generated/Modify: `index.html`
- Generated/Modify: `como-ayudar.html`

**Interfaces:**
- Consumes: HTML existente de las tres páginas y `tienda.html`.
- Produces: enlaces discretos y reproducibles hacia la tienda sin convertir Guardianes o Inicio en ecommerce.

- [ ] **Step 1: Run editorial integration tests and verify red**

```bash
node --test tests/storefront.test.mjs --test-name-pattern="Guardianes remains|Cómo ayudar"
```

Expected: FAIL porque aún no existen referencias editoriales suficientes a `tienda.html`.

- [ ] **Step 2: Implement idempotent updater**

Crear `scripts/update-storefront-links.mjs` que:

1. En `guardianes.html`, junto a la zona editorial del libro, añada una sola vez:

```html
<a class="text-link storefront-editorial-link" href="tienda.html">Ver libros y futura colección solidaria →</a>
```

2. En `como-ayudar.html`, dentro de `.help-intent-grid`, añada una sola vez:

```html
<a href="tienda.html"><small>Compra con propósito</small><strong>Tienda solidaria</strong><span>Descubre los libros publicados y las colecciones que estamos preparando.</span></a>
```

3. En `index.html`, antes del cierre de `</main>`, añada una sección discreta con clase `home-storefront-teaser`:

```html
<section class="home-storefront-teaser section-space"><div class="shell"><div><p class="eyebrow">Otra forma de sumar</p><h2>Una tienda con propósito.</h2><p>Los libros ya publicados y una futura colección solidaria que estamos preparando sin grandes cantidades de stock.</p></div><a class="button button-outline" href="tienda.html">Conocer la tienda</a></div></section>
```

El script debe ser idempotente: una segunda ejecución no duplica bloques.

- [ ] **Step 3: Add updater to the build**

En `scripts/build-public.mjs`, ejecutar:

```js
run('scripts/update-storefront-links.mjs');
```

después de `build-storefront.mjs` y antes de `update-public-shell.mjs`.

- [ ] **Step 4: Run updater twice and verify no duplication**

```bash
node scripts/update-storefront-links.mjs
node scripts/update-storefront-links.mjs
node --test tests/storefront.test.mjs --test-name-pattern="Guardianes remains|Cómo ayudar"
```

Expected: PASS y un solo bloque/enlace por ubicación.

- [ ] **Step 5: Commit**

```bash
git add scripts/update-storefront-links.mjs scripts/build-public.mjs guardianes.html index.html como-ayudar.html
git commit -m "feat: connect tienda with editorial journeys"
```

---

### Task 5: Diseño responsive y accesible de Tienda

**Files:**
- Modify: `assets/css/winston-enhancements.css`
- Test: `tests/storefront.test.mjs`

**Interfaces:**
- Consumes: clases `storefront-*` de `tienda.html` y `home-storefront-teaser`.
- Produces: layout mobile-first, tarjetas responsive, CTAs táctiles y compatibilidad con acción flotante WhatsApp.

- [ ] **Step 1: Add a failing CSS contract**

Añadir a `tests/storefront.test.mjs`:

```js
test('storefront stylesheet provides responsive and focus protections', () => {
  const css = read('assets/css/winston-enhancements.css');
  for (const selector of ['.storefront-hero','.storefront-steps','.storefront-collection-grid','.storefront-books-grid','.home-storefront-teaser']) assert.ok(css.includes(selector));
  assert.ok(css.includes('@media (max-width: 760px)'));
  assert.ok(css.includes(':focus-visible'));
});
```

- [ ] **Step 2: Run CSS contract and verify red**

```bash
node --test tests/storefront.test.mjs --test-name-pattern="stylesheet provides"
```

Expected: FAIL porque las clases nuevas aún no tienen estilos.

- [ ] **Step 3: Add scoped storefront CSS**

Añadir estilos solo bajo clases `storefront-*`/`home-storefront-teaser`, con:

```css
.storefront-hero{background:#f4f0e5;padding:clamp(3rem,7vw,7rem) 0}
.storefront-hero-grid{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(320px,.95fr);gap:clamp(2rem,6vw,6rem);align-items:center}
.storefront-hero h1{font-family:Georgia,'Times New Roman',serif;font-size:clamp(3.6rem,8vw,7.4rem);line-height:.9;color:#0b3d32}
.storefront-steps,.storefront-collection-grid,.storefront-books-grid{display:grid;gap:1.25rem}
.storefront-steps{grid-template-columns:repeat(3,1fr)}
.storefront-collection-grid{grid-template-columns:repeat(3,1fr)}
.storefront-books-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
.storefront-card,.storefront-book{background:#fffdf7;border-radius:28px;padding:clamp(1.4rem,3vw,2.4rem)}
.storefront-status{display:inline-flex;border-radius:999px;padding:.45rem .75rem;background:#e9e1c9;color:#0b3d32;font-weight:700}
.storefront-card a:focus-visible,.storefront-book a:focus-visible,.home-storefront-teaser a:focus-visible{outline:3px solid currentColor;outline-offset:4px}
.home-storefront-teaser{background:#e8efe8}
.home-storefront-teaser>.shell{display:flex;gap:2rem;align-items:end;justify-content:space-between}
@media (max-width:760px){.storefront-hero-grid,.storefront-steps,.storefront-collection-grid,.storefront-books-grid{grid-template-columns:1fr}.storefront-hero h1{font-size:clamp(3rem,14vw,4.4rem)}.home-storefront-teaser>.shell{display:grid;align-items:start}.storefront-card,.storefront-book{border-radius:22px}}
```

Los estilos pueden ampliarse para armonizar con componentes existentes, sin cambiar colores globales ni layouts ajenos.

- [ ] **Step 4: Verify CSS contract and existing architecture tests**

```bash
node --test tests/storefront.test.mjs --test-name-pattern="stylesheet provides"
node --test tests/public-architecture.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add assets/css/winston-enhancements.css tests/storefront.test.mjs
git commit -m "style: integrate tienda with Winston responsive design"
```

---

### Task 6: Sitemap, staging y build reproducible

**Files:**
- Modify: `scripts/build-sitemap.mjs`
- Verify: `scripts/set-indexing.mjs`
- Generated: `sitemap.xml`
- Generated: `robots.txt`

**Interfaces:**
- Consumes: lista de páginas públicas y residentes.
- Produces: sitemap con `tienda.html`, sin Administración, y staging bloqueado.

- [ ] **Step 1: Run sitemap/staging test and verify red**

```bash
node --test tests/storefront.test.mjs --test-name-pattern="sitemap contains storefront"
```

Expected: FAIL porque `sitemap.xml` todavía no contiene `/tienda.html`.

- [ ] **Step 2: Add storefront to sitemap roots**

En `scripts/build-sitemap.mjs`, añadir `'tienda.html'` a `publicRoots` después de `guardianes.html`.

También actualizar la base canónica del sitemap/robots a `https://santuariowinston.org/`, coherente con la arquitectura de dominio aprobada:

```js
const site = 'https://santuariowinston.org';
```

Usar `site` para URLs del sitemap y para `Sitemap:` en modo producción.

- [ ] **Step 3: Run full public build in staging**

```bash
node scripts/build-public.mjs
```

Expected: genera Tienda, actualiza shell/editorial, 70 habitantes, sitemap y `noindex,nofollow`.

- [ ] **Step 4: Verify sitemap/staging test passes**

```bash
node --test tests/storefront.test.mjs --test-name-pattern="sitemap contains storefront"
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/build-sitemap.mjs sitemap.xml robots.txt tienda.html guardianes.html index.html como-ayudar.html animales
git commit -m "build: include tienda in public staging output"
```

---

### Task 7: Verificación integral y paquete consolidado

**Files:**
- Verify: all public files
- Create: `ACTUALIZACION-WEB-TIENDA.txt`
- Package: `Santuario-Winston-Web-TIENDA-solidaria.zip`

**Interfaces:**
- Consumes: árbol público ya construido.
- Produces: paquete listo para copiar sobre `Santuario-Winston-Web`.

- [ ] **Step 1: Run the full build from the repository root**

```bash
node scripts/build-public.mjs
```

Expected: exit 0.

- [ ] **Step 2: Run the full test suite**

```bash
node --test tests/public-architecture.test.mjs tests/storefront.test.mjs
```

Expected: 0 failures.

- [ ] **Step 3: Verify JavaScript syntax**

```bash
node --check scripts/build-storefront.mjs
node --check scripts/update-storefront-links.mjs
node --check scripts/public-shell.mjs
node --check scripts/build-public.mjs
node --check scripts/build-sitemap.mjs
```

Expected: all exit 0.

- [ ] **Step 4: Verify no forbidden commerce/private tokens in public output**

```bash
! grep -RniE 'SUPABASE_SERVICE_ROLE_KEY|winston-storage://|stripe_secret|paypal_secret' --include='*.html' --include='*.js' --exclude='administracion.html' .
! grep -niE 'añadir al carrito|add to cart|checkout|€[[:space:]]*[0-9]|[0-9]+,[0-9]{2}[[:space:]]*€' tienda.html
```

Expected: both commands exit 0.

- [ ] **Step 5: Verify administration and media preservation**

```bash
node --test tests/public-architecture.test.mjs --test-name-pattern="admin baseline unchanged|preserves all original media"
```

Expected: PASS.

- [ ] **Step 6: Perform visual smoke review**

Serve the site locally:

```bash
python3 -m http.server 8765
```

Review at minimum `index.html`, `tienda.html`, `guardianes.html`, `como-ayudar.html` at desktop width and 390 px mobile width. Confirm no overflow, readable H1, working menu, visible Amazon links and WhatsApp not covering primary CTA.

- [ ] **Step 7: Write update note**

Create `ACTUALIZACION-WEB-TIENDA.txt` summarizing: nueva Tienda, libros enlazados, colecciones en preparación, navegación, integración editorial, sitemap/noindex, no pagos activos, app/admin untouched.

- [ ] **Step 8: Build consolidated ZIP**

Create a ZIP from the repository contents excluding `.git` and local temporary files. Then extract it into a fresh temporary directory and re-run:

```bash
node --test tests/public-architecture.test.mjs tests/storefront.test.mjs
```

inside the extracted package.

- [ ] **Step 9: Final verification**

Confirm the extracted ZIP has:

- `tienda.html`;
- 70 `animales/*/index.html`;
- 119 media files;
- `administracion.html` baseline unchanged;
- no `capacitor-mobile`;
- staging `robots.txt` with `Disallow: /`;
- sitemap containing `tienda.html` and 70 resident URLs.

- [ ] **Step 10: Commit**

```bash
git add .
git commit -m "feat: deliver tienda solidaria public block"
```
