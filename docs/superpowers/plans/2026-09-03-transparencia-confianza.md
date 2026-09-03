# Transparencia y Confianza Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir un Centro de Transparencia público y enlazado con las páginas institucionales y de colaboración, sin publicar datos o documentos no confirmados.

**Architecture:** Mantener la web estática existente y generar `transparencia.html` desde un script Node reutilizando el shell público. Añadir enlaces institucionales mediante el shell compartido y bloques editoriales idempotentes en las cuatro páginas relacionadas. Preparar `/documentos/transparencia/` sin documentos ficticios y ampliar sitemap/tests sin tocar Administración, Supabase, Tienda ni la app.

**Tech Stack:** HTML estático, CSS existente + `winston-enhancements.css`, JavaScript/Node ESM, `node:test`.

**Spec:** `docs/superpowers/specs/2026-09-03-transparencia-confianza-design.md`

## Global Constraints

- Mantener la estética verde/crema/natural y tipografía editorial existente.
- No inventar CIF/NIF, domicilio, registro, número de animales, cuentas, gastos, porcentajes, impacto, certificados ni reconocimientos.
- No publicar documentos de muestra ni reutilizar archivos privados.
- Mantener GitHub Pages con `noindex,nofollow` y `robots.txt` bloqueado.
- Canonical de Transparencia: `https://santuariowinston.org/transparencia.html`.
- No modificar `administracion.html`, `assets/js/winston-admin.js`, Supabase, Tienda ni app.
- Las modificaciones a páginas existentes deben ser idempotentes.

---

### Task 1: Contrato de pruebas de Transparencia

**Files:**
- Create: `tests/transparency.test.mjs`

**Interfaces:**
- Consumes: HTML público actual, `tests/admin-baseline.json`, datos de habitantes.
- Produces: contrato verificable para página, enlaces, privacidad, staging y preservación.

- [ ] **Step 1: Escribir tests que exijan** `transparencia.html`, canonical `.org`, noindex, bloques de contenido aprobados, FAQ accesible, directorio de documentos, enlaces desde páginas relacionadas y footer, ausencia de cifras legales no confirmadas introducidas por el nuevo bloque, y preservación byte-identical del admin.
- [ ] **Step 2: Ejecutar** `node --test tests/transparency.test.mjs` y verificar fallo por ausencia de `transparencia.html`.

### Task 2: Página principal de Transparencia

**Files:**
- Create: `scripts/build-transparency.mjs`
- Create: `transparencia.html`
- Modify: `assets/css/winston-enhancements.css`
- Create: `documentos/transparencia/.gitkeep`

**Interfaces:**
- Consumes: `header()` y `footer()` de `scripts/public-shell.mjs`.
- Produces: página estática accesible y responsive con IDs de sección estables.

- [ ] **Step 1: Generar** `transparencia.html` con hero, quiénes somos, qué hacemos, uso general de ayudas sin porcentajes, campañas, documentación pública vacía/honesta, colaboración, FAQ y contacto.
- [ ] **Step 2: Añadir CSS** con prefijo `.transparency-` y media queries <= 900/760/430 px.
- [ ] **Step 3: Crear** `documentos/transparencia/.gitkeep` para reservar la ruta sin publicar documentos ficticios.
- [ ] **Step 4: Ejecutar** `node scripts/build-transparency.mjs` y después tests; corregir hasta verde en las aserciones de página.

### Task 3: Navegación institucional y páginas relacionadas

**Files:**
- Modify: `scripts/public-shell.mjs`
- Modify: `scripts/update-public-shell.mjs`
- Create: `scripts/update-transparency-links.mjs`
- Modify generated: `sobre-nosotros.html`, `como-ayudar.html`, `donar.html`, `en-busca-del-paraiso.html`, root public pages and resident pages as needed.

**Interfaces:**
- Produces: `Transparencia` en dropdown/menú móvil institucional y footer; CTAs contextuales con clases `transparency-*`.

- [ ] **Step 1: Añadir** Transparencia bajo “Descubre” en desktop/móvil y en footer institucional, sin convertirlo en CTA principal.
- [ ] **Step 2: Crear script idempotente** que inserte bloques de confianza antes de `</main>` en las cuatro páginas relacionadas.
- [ ] **Step 3: Regenerar/actualizar shell** y páginas de habitantes para que sus footers/navegación compartida incluyan Transparencia.
- [ ] **Step 4: Ejecutar tests** y verificar que los enlaces locales resuelven.

### Task 4: SEO, sitemap y documentación de entrega

**Files:**
- Modify: `scripts/build-sitemap.mjs`
- Modify: `sitemap.xml`
- Create: `ACTUALIZACION-WEB-TRANSPARENCIA.txt`
- Modify: `README.md`

**Interfaces:**
- Produces: sitemap staging con Transparencia y canonical definitivo; notas de actualización.

- [ ] **Step 1: Incluir** `/transparencia.html` en generación de sitemap, manteniendo exclusión del admin.
- [ ] **Step 2: Mantener** `robots.txt` con `Disallow: /` y noindex en páginas públicas.
- [ ] **Step 3: Documentar** el bloque y la política de no publicar datos/documentos no confirmados.
- [ ] **Step 4: Ejecutar** la suite completa `node --test tests/*.test.mjs`.

### Task 5: Verificación y empaquetado

**Files:**
- Package: `/mnt/data/Santuario-Winston-Web-TRANSPARENCIA.zip`

**Interfaces:**
- Produces: ZIP consolidado listo para copiar sobre `Santuario-Winston-Web`.

- [ ] **Step 1: Ejecutar** scripts de build desde cero y suite completa.
- [ ] **Step 2: Verificar** 70 fichas, 119 media, cero enlaces locales rotos, noindex staging, admin byte-identical, ausencia de `capacitor-mobile`.
- [ ] **Step 3: Crear ZIP**, extraerlo a carpeta limpia y repetir suite completa sobre el contenido extraído.
- [ ] **Step 4: Entregar** un único ZIP con instrucciones de commit/push.
