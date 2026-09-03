# Santuario Winston Public Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the current public static site into a scalable, SEO-ready public architecture with 70 individual resident pages, a centralized resident data source, reorganized navigation, a Guardianes editorial landing page, improved collaboration pathways, and the pending mobile UX fixes without changing the established visual identity.

**Architecture:** Keep the existing static GitHub Pages site and its embedded visual system. Extract the existing 70 resident stories into a canonical JSON dataset, generate static `/animales/<slug>/index.html` pages with a Node.js build script, progressively enhance `habitantes.html` from that same dataset, and centralize global navigation/footer/UX patches through a small reusable script/CSS layer rather than rewriting every page by hand.

**Tech Stack:** Static HTML/CSS/vanilla JavaScript, Node.js built-ins only (`fs`, `path`, `assert`), GitHub Pages, existing site assets. No SPA/framework, no npm production dependency.

**Spec:** `docs/superpowers/specs/2026-09-03-web-public-architecture-design.md`

## Global Constraints

- Preserve the existing green/cream/natural visual identity, editorial serif typography, large photography, whitespace and soft-card composition.
- Preserve all real resident stories and images; do not invent or infer unsupported facts.
- Keep `administracion.html` separate, unindexed and functionally unchanged.
- Do not touch the Android app or `capacitor-mobile`.
- GitHub Pages is staging; staging must remain protected from search-engine indexing.
- No operational store, POD integration, payments or public app promotion in this block.
- No secrets, private storage URLs, clinical/admin records, microchips or app data in public resident pages.
- All new public resident pages must be static and work without JavaScript for their core content.
- Use canonical URLs under `https://santuariowinston.com/` while staging stays `noindex`.

---

### Task 1: Establish isolated baseline and regression tests

**Files:**
- Create: `tests/public-architecture.test.mjs`
- Read-only baseline: `habitantes.html`, `administracion.html`, `assets/js/admin.js`, `assets/js/admin-api.js`

**Interfaces:**
- Consumes: current consolidated public web package.
- Produces: reusable test helpers `read(rel)`, `exists(rel)`, `extractResidentCards(html)` and baseline assertions used by later tasks.

- [ ] **Step 1: Write failing baseline/feature tests**

Create tests that assert the future architecture before implementation:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(root, rel));

test('resident canonical data contains exactly 70 unique entries', () => {
  assert.ok(exists('assets/data/habitantes.json'));
  const rows = JSON.parse(read('assets/data/habitantes.json'));
  assert.equal(rows.length, 70);
  assert.equal(new Set(rows.map(x => x.slug)).size, 70);
});

test('all resident static pages exist', () => {
  const rows = JSON.parse(read('assets/data/habitantes.json'));
  for (const row of rows) assert.ok(exists(`animales/${row.slug}/index.html`));
});

test('guardianes landing exists', () => {
  assert.ok(exists('guardianes.html'));
});
```

Add snapshot hashes for admin files so public work cannot silently change them:

```js
import crypto from 'node:crypto';
const sha = rel => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, rel))).digest('hex');
const protectedAdmin = JSON.parse(read('tests/admin-baseline.json'));
for (const [rel, expected] of Object.entries(protectedAdmin)) assert.equal(sha(rel), expected, `${rel} changed`);
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
node --test tests/public-architecture.test.mjs
```

Expected: failures because `assets/data/habitantes.json`, generated pages and `guardianes.html` do not exist yet.

- [ ] **Step 3: Record current admin hashes**

Create `tests/admin-baseline.json` from the current `administracion.html`, `assets/js/admin.js`, `assets/js/admin-api.js`, and `assets/css/admin.css` using SHA-256.

- [ ] **Step 4: Re-run and keep only feature failures**

Run the same test command. Expected: admin baseline passes; new-public-architecture tests remain RED.

---

### Task 2: Extract the 70 real resident stories into canonical JSON

**Files:**
- Create: `scripts/extract-habitantes.mjs`
- Create: `assets/data/habitantes.json`
- Test: `tests/public-architecture.test.mjs`

**Interfaces:**
- Consumes: existing `habitantes.html` resident cards.
- Produces: `ResidentRecord[]` with `{slug,name,dateLabel,image,excerpt,story,species,sponsorable,source,order}`.

- [ ] **Step 1: Add failing extraction integrity tests**

```js
test('resident JSON preserves source names, images, excerpts and story text', () => {
  const source = read('habitantes.html');
  const rows = JSON.parse(read('assets/data/habitantes.json'));
  for (const row of rows) {
    assert.ok(row.name.trim());
    assert.match(row.image, /^assets\/media\/optimized\/animales\//);
    assert.ok(row.excerpt.trim().length > 10);
    assert.ok(Array.isArray(row.story) && row.story.length >= 1);
    assert.equal(row.source, 'habitantes.html');
    assert.ok(source.includes(row.name));
  }
});
```

- [ ] **Step 2: Run test and verify RED**

```bash
node --test tests/public-architecture.test.mjs
```

Expected: JSON missing.

- [ ] **Step 3: Implement extraction with DOM-free deterministic parsing**

Because the current HTML is server-exported but regular, parse each `<article class="resident-card">...</article>` block with controlled string/regex helpers; decode entities, remove `<!-- -->`, keep original story paragraph text, and slugify Unicode safely:

```js
function slugify(value) {
  return value.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}
```

If a slug collides, append a stable `-2`, `-3` suffix in source order rather than changing names.

Do not infer species unless explicitly supported by visible source text; otherwise write `null`.

- [ ] **Step 4: Generate the dataset and verify count**

```bash
node scripts/extract-habitantes.mjs
node -e "const x=require('./assets/data/habitantes.json'); console.log(x.length,new Set(x.map(v=>v.slug)).size)"
```

Expected: `70 70`.

- [ ] **Step 5: Run tests GREEN for extraction**

```bash
node --test tests/public-architecture.test.mjs
```

Expected: extraction tests pass; later page-generation/Guardianes tests may remain RED.

---

### Task 3: Build static individual resident pages

**Files:**
- Create: `scripts/build-habitantes.mjs`
- Create: `animales/<slug>/index.html` × 70
- Test: `tests/public-architecture.test.mjs`

**Interfaces:**
- Consumes: `assets/data/habitantes.json`.
- Produces: 70 self-contained static pages and helper functions `escapeHtml`, `metaDescription`, `residentPage(record,index,all)`.

- [ ] **Step 1: Add failing SEO/content tests**

```js
test('each resident page contains correct canonical, metadata and story', () => {
  const rows = JSON.parse(read('assets/data/habitantes.json'));
  for (const row of rows) {
    const html = read(`animales/${row.slug}/index.html`);
    assert.ok(html.includes(`<h1>${row.name}</h1>`));
    assert.ok(html.includes(`https://santuariowinston.com/animales/${row.slug}/`));
    assert.ok(html.includes('property="og:title"'));
    assert.ok(html.includes('application/ld+json'));
    for (const p of row.story) assert.ok(html.includes(p.slice(0, Math.min(40, p.length))));
    assert.ok(!/microchip|passportNumber|winston-storage:\/\//i.test(html));
  }
});
```

- [ ] **Step 2: Run and verify RED**

```bash
node --test tests/public-architecture.test.mjs
```

Expected: individual pages absent.

- [ ] **Step 3: Implement static generator**

Generate HTML with:
- relative assets `../../assets/...`;
- global public header/footer;
- breadcrumb `Habitantes → <name>`;
- hero image and real `dateLabel`;
- full `story` paragraphs;
- CTA to `../../apadrina.html` phrased generically (`Descubre cómo apadrinar`) rather than claiming current individual availability;
- deterministic recommendations `(index+1,index+7,index+17) % total`, skipping self;
- canonical/OG/Twitter/JSON-LD;
- `loading="lazy"` on non-hero recommendations;
- no private/admin fields.

- [ ] **Step 4: Generate all pages**

```bash
node scripts/build-habitantes.mjs
```

Expected summary: `Generadas 70 fichas de habitantes`.

- [ ] **Step 5: Run page tests GREEN**

```bash
node --test tests/public-architecture.test.mjs
```

---

### Task 4: Convert `habitantes.html` into a scalable directory backed by the same JSON

**Files:**
- Modify: `habitantes.html`
- Create: `assets/js/habitantes-directory.js`
- Modify: `assets/css/winston-enhancements.css`
- Test: `tests/public-architecture.test.mjs`

**Interfaces:**
- Consumes: `assets/data/habitantes.json` and existing resident visual classes.
- Produces: searchable/filterable directory cards linking to `animales/<slug>/` while keeping initial static cards available if JS fails.

- [ ] **Step 1: Add failing directory tests**

```js
test('directory links resident cards to individual pages and loads progressive enhancer', () => {
  const html = read('habitantes.html');
  assert.ok(html.includes('assets/js/habitantes-directory.js'));
  assert.ok(html.includes('data-residents-directory'));
  assert.ok(html.includes('Conoce su historia'));
});
```

- [ ] **Step 2: Run RED**

```bash
node --test tests/public-architecture.test.mjs
```

- [ ] **Step 3: Modify existing cards without discarding their content**

Add a static `Conoce su historia` link to each card using the canonical slug. Keep existing text in the HTML as fallback. Mark the directory root with `data-residents-directory`.

- [ ] **Step 4: Implement progressive search/filter enhancement**

`habitantes-directory.js` loads `assets/data/habitantes.json`, indexes normalized name/excerpt/date text, filters existing DOM cards instead of re-rendering them, updates a visible results count, and never removes the static content when `fetch()` fails.

- [ ] **Step 5: Run tests GREEN**

```bash
node --test tests/public-architecture.test.mjs
```

---

### Task 5: Reorganize public navigation without editing admin

**Files:**
- Create: `scripts/update-public-shell.mjs`
- Modify: all public root HTML pages except `administracion.html`
- Modify: generated resident pages via generator template
- Test: `tests/public-architecture.test.mjs`

**Interfaces:**
- Consumes: current header/mobile drawer/footer markup.
- Produces: consistent desktop/mobile hierarchy with `Descubre` group and Guardianes entry.

- [ ] **Step 1: Add failing navigation coverage tests**

```js
test('all public root pages expose Descubre hierarchy and Guardianes', () => {
  const publicPages = ['index.html','habitantes.html','como-ayudar.html','voluntariado.html','actividades.html','sobre-nosotros.html','contacto.html'];
  for (const page of publicPages) {
    const html = read(page);
    assert.ok(html.includes('Descubre'));
    assert.ok(html.includes('guardianes.html'));
  }
});
```

- [ ] **Step 2: Run RED**

- [ ] **Step 3: Implement deterministic shell updater**

Use exact start/end markers around `<nav class="desktop-nav"...></nav>` and mobile drawer nav; replace only public shell navigation. New structure:

```text
Inicio
Descubre ▾ → Habitantes / Los Guardianes / Nosotros
Cómo ayudar ▾ → Hazte socio / Apadrina / Teaming / Donativos / Empresas solidarias / En busca del paraíso
Voluntariado ▾ → Testimonios / Voluntario habitual / Larga estancia
Actividades
Contacto
Donar
```

Footer `Descubre` adds Guardianes but otherwise preserves current content/contact details.

- [ ] **Step 4: Run updater and rebuild resident pages**

```bash
node scripts/update-public-shell.mjs
node scripts/build-habitantes.mjs
```

- [ ] **Step 5: Verify admin hashes and navigation tests**

```bash
node --test tests/public-architecture.test.mjs
```

Expected: admin hash assertions still pass.

---

### Task 6: Create the Guardianes editorial landing page

**Files:**
- Create: `guardianes.html`
- Modify: `assets/css/winston-enhancements.css`
- Test: `tests/public-architecture.test.mjs`

**Interfaces:**
- Consumes: approved canonical Guardianes facts from project spec/current approved context; existing web visual components and existing approved media only.
- Produces: editorial landing page with Winston, Pegaso, Epona, Declan and Dolo; book CTA; link to real residents; future-universe placeholder without fictitious products.

- [ ] **Step 1: Add failing canon/safety tests**

```js
test('Guardianes page contains only the five approved protagonists and no shop claims', () => {
  const html = read('guardianes.html');
  for (const name of ['Winston','Pegaso','Epona','Declan','Dolo']) assert.ok(html.includes(name));
  assert.ok(html.includes('habitantes.html'));
  assert.ok(!/comprar camiseta|producto disponible|Printful|Shopify/i.test(html));
});
```

- [ ] **Step 2: Run RED**

- [ ] **Step 3: Build `guardianes.html` using existing web shell**

Content rules:
- explain that Guardianes is the narrative/editorial universe inspired by the Sanctuary mission;
- introduce only confirmed protagonists;
- mention the published book without inventing sales data;
- use the confirmed Amazon Kindle/book link only where already approved;
- use typography/cards/real-sanctuary imagery if no approved Guardianes art is available in the public asset set;
- include `Conoce a los habitantes reales` and `El universo continúa` sections.

- [ ] **Step 4: Run tests GREEN**

---

### Task 7: Reinforce campaign and collaboration pathways

**Files:**
- Modify: `index.html`
- Modify: `como-ayudar.html`
- Modify: `guardianes.html`
- Test: `tests/public-architecture.test.mjs`

**Interfaces:**
- Consumes: existing confirmed campaign URLs/text and current help pages.
- Produces: consistent contextual CTAs without changing unverified figures.

- [ ] **Step 1: Add failing CTA tests**

```js
test('help hub exposes all approved collaboration pathways', () => {
  const html = read('como-ayudar.html');
  for (const href of ['hazte-socio.html','apadrina.html','teaming.html','donar.html','adopciones-solidarias.html','voluntariado.html','en-busca-del-paraiso.html']) assert.ok(html.includes(href));
});
```

- [ ] **Step 2: Run RED if any pathway is missing or unclear**

- [ ] **Step 3: Refine hierarchy without changing factual campaign figures**

Use intention-led labels: recurrente, apadrinamiento, puntual, 1 €/mes, empresas, voluntariado, finca. Keep `46` and `600.000 €` unchanged because this block does not verify them.

- [ ] **Step 4: Verify tests GREEN**

---

### Task 8: Apply consolidated mobile UX fixes

**Files:**
- Modify: `assets/css/winston-enhancements.css`
- Modify: `assets/js/winston.js` only if required for safe-area behavior
- Test: `tests/public-architecture.test.mjs`

**Interfaces:**
- Consumes: existing `.floating-actions`, hero heading and `.site-header/.brand` markup.
- Produces: non-overlapping WhatsApp control, fluid heading typography and improved mobile brand legibility.

- [ ] **Step 1: Add failing CSS contract tests**

```js
test('mobile UX stylesheet contains safe-area and fluid typography protections', () => {
  const css = read('assets/css/winston-enhancements.css');
  assert.match(css, /env\(safe-area-inset-bottom/);
  assert.match(css, /clamp\(/);
  assert.match(css, /\.floating-actions/);
});
```

- [ ] **Step 2: Run RED**

- [ ] **Step 3: Implement mobile corrections**

Use `bottom: max(1rem, env(safe-area-inset-bottom))`, reserve bottom content space where needed, hide WhatsApp text below narrow breakpoint while keeping a >=56px target, constrain hero `h1` via `clamp()`, and scale brand logo/name without replacing the official logo.

- [ ] **Step 4: Run tests GREEN**

---

### Task 9: Staging SEO protection and sitemap generation

**Files:**
- Create: `scripts/build-sitemap.mjs`
- Modify: `sitemap.xml`
- Modify: `robots.txt`
- Modify: public root pages and resident template to add staging-safe robots meta
- Test: `tests/public-architecture.test.mjs`

**Interfaces:**
- Consumes: resident JSON and known public root pages.
- Produces: production-canonical sitemap plus staging noindex protection.

- [ ] **Step 1: Add failing SEO safety tests**

```js
test('staging is noindex while admin remains excluded from sitemap', () => {
  assert.match(read('robots.txt'), /Disallow:\s*\//);
  const sitemap = read('sitemap.xml');
  assert.ok(!sitemap.includes('administracion'));
  const rows = JSON.parse(read('assets/data/habitantes.json'));
  for (const row of rows) assert.ok(sitemap.includes(`/animales/${row.slug}/`));
});
```

- [ ] **Step 2: Run RED**

- [ ] **Step 3: Build staging protection**

`robots.txt` for GitHub Pages staging:

```text
User-agent: *
Disallow: /
```

Add `<meta name="robots" content="noindex,nofollow">` to staging-delivered public HTML, with a documented production-removal switch in build scripts (`WINSTON_PRODUCTION=1`) that outputs `index,follow`/normal robots for final-domain deployment.

- [ ] **Step 4: Generate sitemap**

Generate canonical URLs for all intended public root pages and 70 animal pages. Never include `administracion.html`.

- [ ] **Step 5: Run SEO tests GREEN**

---

### Task 10: Full integrity, privacy and packaging verification

**Files:**
- Modify: `README.md` with build/staging instructions
- Create: `ACTUALIZACION-WEB-PUBLICA-ARQUITECTURA.txt`
- Produce: consolidated ZIP

**Interfaces:**
- Consumes: complete implemented tree.
- Produces: verified deployable package.

- [ ] **Step 1: Add final integrity tests**

Tests must assert:
- exactly 70 resident JSON rows and 70 pages;
- every local `href/src` target resolves, allowing anchors/mailto/tel/http;
- every referenced local resident image exists;
- no `winston-storage://`, service-role key, private Supabase token, microchip/passport/private-document field in `animales/` or `guardianes.html`;
- `administracion.html` and admin JS/CSS hashes equal baseline;
- no `capacitor-mobile` directory exists in package;
- Guardianes and all root public pages have canonical/description/OG basics;
- `sitemap.xml` has no admin URL;
- staging `robots.txt` disallows indexing.

- [ ] **Step 2: Run complete suite**

```bash
node --test tests/*.test.mjs
```

Expected: all tests pass, 0 failures.

- [ ] **Step 3: Run JavaScript syntax checks**

```bash
node --check assets/js/winston.js
node --check assets/js/habitantes-directory.js
node --check scripts/extract-habitantes.mjs
node --check scripts/build-habitantes.mjs
node --check scripts/update-public-shell.mjs
node --check scripts/build-sitemap.mjs
```

Expected: exit 0 for all.

- [ ] **Step 4: Re-run generation from clean generated outputs**

Delete only generated `animales/` and `assets/data/habitantes.json`, then:

```bash
node scripts/extract-habitantes.mjs
node scripts/build-habitantes.mjs
node scripts/build-sitemap.mjs
node --test tests/*.test.mjs
```

Expected: reproducible 70/70 build and green suite.

- [ ] **Step 5: Package full public site**

Create `Santuario-Winston-Web-PUBLICA-escalable.zip` containing the complete current web, including unchanged admin files, so the user can replace the repository contents in one operation without losing A.1b/admin work.

- [ ] **Step 6: Record deployment instructions**

`ACTUALIZACION-WEB-PUBLICA-ARQUITECTURA.txt` must state:
- copy all files into `Santuario-Winston-Web`;
- commit/push;
- GitHub Pages staging remains intentionally noindex;
- before final-domain migration run production build/removal procedure for staging noindex;
- app Android is untouched.
