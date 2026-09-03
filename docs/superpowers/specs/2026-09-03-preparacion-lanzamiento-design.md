# Santuario Winston — Diseño de Preparación para Lanzamiento

**Fecha:** 3 de septiembre de 2026  
**Estado:** Diseño aprobado en conversación; pendiente de revisión del documento antes de implementación  
**Destino de producción:** `https://santuariowinston.org/`  
**Staging actual:** GitHub Pages, siempre `noindex`

## 1. Objetivo

Dejar la web pública del Santuario Winston técnicamente preparada para una migración segura desde el staging actual a `santuariowinston.org`, sin cambiar su identidad visual ni modificar datos de la app, Supabase, Administración o la tienda funcional.

Este bloque se centra en cuatro resultados:

1. **SEO técnico y datos estructurados correctos.**
2. **Velocidad y estabilidad visual mejores, especialmente en móvil.**
3. **Accesibilidad y seguridad pública reforzadas.**
4. **Un proceso de publicación reproducible que separe completamente staging y producción.**

## 2. Estado de partida verificado

La copia actual contiene:

- 20 páginas públicas raíz.
- 70 fichas individuales en `/animales/<slug>/`.
- `administracion.html` protegida por autenticación y fuera del sitemap.
- Tienda Solidaria de presentación, sin checkout ficticio.
- Centro de Transparencia.
- `robots.txt` de staging con `Disallow: /`.
- meta robots `noindex,nofollow` en las páginas públicas de staging.
- canonicales apuntando ya a `https://santuariowinston.org/`.
- sitemap con las 90 URLs públicas previstas para producción.
- 119 archivos multimedia preservados por las pruebas existentes.

Se han detectado además dos deudas técnicas relevantes para este bloque:

- 17 páginas heredadas todavía contienen unos 60 KB de CSS base repetido dentro de cada HTML.
- esas mismas páginas conservan declaraciones antiguas `data-vinext-fonts` que apuntan a cinco archivos `/assets/_vinext_fonts/...` que no existen en el paquete público.

La implementación eliminará esas referencias rotas sin incorporar ni redistribuir archivos de fuentes.

## 3. Principios de implementación

### 3.1. No rediseñar

Se conservarán:

- paleta natural verde/crema;
- tipografía editorial de titulares;
- fotografía grande;
- espacios amplios;
- tarjetas redondeadas;
- navegación actual;
- contenidos y llamadas a la acción ya aprobados.

No se hará una conversión a WordPress, React, Next.js ni otro framework.

### 3.2. No modificar datos reales

Este bloque no cambiará:

- cifras de campañas;
- datos históricos;
- nombres o historias de animales;
- datos legales;
- URLs de ayudas o Amazon;
- información de Supabase;
- datos veterinarios;
- app Android;
- panel de Administración.

Cualquier discrepancia factual seguirá tratándose como revisión de contenido separada.

### 3.3. Staging y producción deben ser artefactos distintos

El repositorio seguirá sirviendo GitHub Pages como entorno de pruebas con `noindex`.

La producción se generará en una carpeta `dist/` mediante un único comando de build. Esa carpeta será la salida que, más adelante, publicará Cloudflare.

Esto evita tener que quitar manualmente `noindex` en el repositorio y reduce el riesgo de indexar por accidente el staging.

## 4. Arquitectura de build y publicación

### 4.1. Nuevo orquestador

Se creará:

`scripts/build-release.mjs`

Responsabilidades:

1. limpiar `dist/`;
2. copiar únicamente archivos públicos necesarios;
3. excluir `docs/`, `tests/`, scripts internos, notas de actualización y otros archivos de desarrollo;
4. regenerar las 70 fichas de habitantes;
5. aplicar shell/navegación actualizada;
6. aplicar metadatos SEO;
7. aplicar datos estructurados;
8. generar `404.html`;
9. generar sitemap y robots de producción;
10. generar `_headers` y `_redirects` para Cloudflare;
11. verificar que `administracion.html` conserva `noindex` y reglas de no-cache;
12. ejecutar la validación de enlaces y seguridad antes de finalizar.

### 4.2. Modos de publicación

Se mantendrán dos estados explícitos:

**Staging (raíz del repositorio):**

- `noindex,nofollow`;
- `robots.txt` con `Disallow: /`;
- GitHub Pages;
- sirve para revisión.

**Producción (`dist/`):**

- `index,follow` en las 90 páginas públicas;
- `robots.txt` con `Allow: /` y referencia a sitemap;
- `administracion.html` siempre `noindex,nofollow`;
- `404.html` siempre `noindex,nofollow`;
- salida preparada para Cloudflare.

## 5. Limpieza de HTML y CSS heredado

### 5.1. CSS base único

El CSS de aproximadamente 60 KB repetido en las páginas heredadas se extraerá definitivamente a:

`assets/css/winston-base.css`

Las páginas pasarán a cargar:

1. `winston-base.css`
2. `winston-enhancements.css`

Se comprobará que el resultado visual es equivalente antes de aceptar el cambio.

### 5.2. Fuentes rotas

Se eliminarán las declaraciones `data-vinext-fonts` y las referencias a:

`/assets/_vinext_fonts/...`

No se añadirán archivos de fuente al paquete. El cuerpo utilizará la pila de fuentes de sistema ya definida como fallback seguro y los titulares mantendrán la pila serif editorial existente.

### 5.3. HTML de producción

No se hará minificación agresiva que dificulte mantenimiento. Sí se eliminarán bloques duplicados y referencias técnicas obsoletas que no aportan funcionalidad.

## 6. SEO técnico

### 6.1. Metadatos obligatorios

Cada una de las 90 páginas públicas tendrá:

- un único `<title>`;
- meta description no vacía;
- canonical absoluto en `https://santuariowinston.org/...`;
- Open Graph title, description, URL e image;
- `og:image:alt`;
- Twitter card;
- un único `<h1>` visible;
- idioma `lang="es"`.

Las fichas de animales mantendrán títulos y descripciones derivados de sus datos centrales públicos, sin inventar contenido.

### 6.2. Sitemap

`sitemap.xml` incluirá exactamente:

- 20 páginas públicas raíz;
- 70 fichas de habitantes;
- total: **90 URLs**.

Quedarán excluidos:

- `administracion.html`;
- `404.html`;
- archivos técnicos;
- staging;
- documentos privados.

### 6.3. Robots

Producción:

```txt
User-agent: *
Allow: /

Sitemap: https://santuariowinston.org/sitemap.xml
```

Staging:

```txt
User-agent: *
Disallow: /
```

El `noindex` HTML seguirá siendo la protección principal del staging; robots es una segunda barrera.

## 7. Datos estructurados

Se usará JSON-LD porque es el formato más sencillo de mantener en la arquitectura estática.

### 7.1. Inicio

La portada incluirá dos nodos relacionados:

**Organization**

- nombre: Santuario Winston;
- URL oficial `.org`;
- logo público actual;
- teléfono público actual;
- email público actual;
- perfiles sociales públicos ya enlazados en la web.

No se añadirá dirección postal más precisa de la que esté públicamente confirmada.

**WebSite**

- nombre;
- URL;
- idioma `es`;
- publisher enlazado al nodo Organization.

### 7.2. Páginas interiores

Las páginas interiores públicas incorporarán `WebPage` y, cuando exista jerarquía navegable real, `BreadcrumbList`.

Ejemplos:

- Inicio → Habitantes → Zeus
- Inicio → Cómo ayudar → Donativos
- Inicio → Descubre → Transparencia

### 7.3. Qué no se marcará

No se añadirán datos estructurados de:

- productos mientras no exista catálogo real;
- reseñas;
- valoraciones;
- eventos sin fecha futura confirmada;
- FAQ con intención de forzar resultados enriquecidos;
- artículos con fechas/autores inventados.

La regla es que el marcado describa únicamente contenido visible y confirmado.

## 8. Página 404

Se creará `404.html` con la misma identidad visual.

Contenido mínimo:

- mensaje claro de página no encontrada;
- enlace a Inicio;
- enlace a Habitantes;
- enlace a Cómo ayudar;
- enlace a Contacto.

SEO:

- `noindex,nofollow`;
- sin inclusión en sitemap;
- sin canonical hacia una página válida que pueda confundir al buscador.

Funcionará tanto en GitHub Pages como en el futuro despliegue estático de Cloudflare.

## 9. Redirecciones

### 9.1. Redirecciones internas confirmadas

Se generará un `_redirects` compatible con Cloudflare para normalizar rutas seguras conocidas, por ejemplo:

```txt
/index.html / 301
/animales/:slug/index.html /animales/:slug/ 301
```

No se inventarán rutas históricas de Jimdo o WordPress.

### 9.2. Inventario histórico

Se creará un archivo versionado de redirecciones confirmadas para que, antes del cambio de dominio, podamos incorporar URLs antiguas verificadas sin tocar el código del sitio.

Las URLs históricas de Jimdo tendrán prioridad cuando exista discrepancia con migraciones posteriores, de acuerdo con la regla del proyecto.

### 9.3. Redirecciones de dominio en el lanzamiento

Durante la migración a Cloudflare se configurarán fuera del código:

- `santuariowinston.com/*` → `https://santuariowinston.org/<misma-ruta>` con 301;
- `www.santuariowinston.com/*` → `.org` con 301;
- `www.santuariowinston.org/*` → dominio principal `.org` con 301.

Se preservarán ruta y query string.

No se ejecutará ese cambio DNS dentro de este bloque.

## 10. Rendimiento

### 10.1. Vídeo principal

El archivo actual de introducción dura aproximadamente 90 segundos y pesa unos 20,3 MB.

Se mantendrá el original sin alterarlo como recurso del proyecto, pero la portada dejará de cargar los 90 segundos como fondo automático.

Se creará una variante decorativa específica para el hero:

`assets/media/optimized/video-intro-hero.mp4`

Parámetros:

- primeros 18 segundos del vídeo actual;
- H.264;
- 1280×720 máximo;
- 24 fps;
- sin pista de audio;
- `faststart`;
- CRF 28.

La sección de campaña seguirá pudiendo reproducir el vídeo completo, pero con `preload="none"` hasta interacción del usuario.

### 10.2. Movimiento reducido

Con `prefers-reduced-motion: reduce`:

- no habrá reproducción automática del hero;
- se mostrará el poster estático;
- se mantendrá disponible la reproducción manual del contenido relevante.

### 10.3. Imágenes

El bloque no sustituirá las 119 imágenes originales.

Sí añadirá de forma automática donde corresponda:

- `loading="lazy"` para imágenes bajo el primer viewport;
- `decoding="async"` en imágenes no críticas;
- `width` y `height` reales para reducir CLS;
- `fetchpriority="high"` únicamente a la imagen/medio crítico del primer viewport cuando tenga sentido.

No se aplicará lazy loading al elemento visual principal de cada página.

### 10.4. Presupuesto estático

La validación impedirá:

- volver a introducir CSS base inline duplicado;
- referencias a fuentes inexistentes;
- carga automática del vídeo completo de 90 s en el hero;
- nuevos recursos locales rotos.

## 11. Accesibilidad

El objetivo práctico será alinearse con WCAG 2.2 AA en los elementos que controlamos dentro de este bloque.

Se comprobarán como mínimo:

- enlace “Saltar al contenido” funcional;
- navegación completa con teclado;
- foco visible en enlaces, botones, inputs y controles de carrusel;
- `aria-expanded` y `aria-hidden` sincronizados en menú móvil;
- retorno de foco al cerrar el menú;
- etiquetas asociadas a todos los campos del formulario;
- mensajes de error y éxito anunciables;
- alt significativo en imágenes informativas;
- alt vacío en imágenes puramente decorativas;
- nombres reales en imágenes de habitantes en lugar de textos genéricos cuando el nombre ya esté disponible;
- no depender únicamente del color para indicar estado;
- respeto a `prefers-reduced-motion`;
- orden de encabezados razonable;
- un solo H1 por página.

No se reescribirá contenido para alcanzar estas reglas; se corregirá marcado y comportamiento.

## 12. Seguridad pública y cabeceras Cloudflare

Se preparará `_headers` para el despliegue de Cloudflare Pages.

Reglas globales iniciales:

```txt
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: SAMEORIGIN
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

Para Administración:

```txt
/administracion.html
  Cache-Control: no-store
  X-Robots-Tag: noindex, nofollow
```

No se impondrá todavía una Content-Security-Policy estricta porque las páginas heredadas siguen usando HTML/CSS inline y una CSP aplicada sin una migración previa podría romper la web. La CSP quedará como endurecimiento posterior, no como falsa seguridad en este bloque.

Tampoco se activará `includeSubDomains` en HSTS mientras `tienda.santuariowinston.org` no esté configurada y validada por HTTPS.

## 13. Analítica

La opción prevista para producción será **Cloudflare Web Analytics**.

Criterios:

- no se activará en GitHub Pages;
- no se añadirá Google Analytics en este bloque;
- no se introducirán cookies de marketing;
- la activación se hará únicamente cuando exista el dominio `.org` en Cloudflare;
- la política de privacidad se actualizará solo con la configuración real que finalmente se active.

La web quedará preparada para inyectar el beacon de producción sin modificar todas las páginas manualmente.

## 14. Preparación específica para Cloudflare

El objetivo de este proyecto seguirá siendo **Cloudflare Pages** para esta migración por simplicidad y porque la web es estática.

Aunque Cloudflare recomienda actualmente Workers para nuevos desarrollos con más lógica de aplicación, no se migrará esta web a Workers en este bloque. Pages continúa soportando Git, `_headers`, `_redirects`, dominios personalizados y despliegues estáticos, que cubren nuestras necesidades actuales.

La futura tienda seguirá fuera de Pages, en `tienda.santuariowinston.org`, tal como ya se decidió.

## 15. Checklist de lanzamiento que quedará documentada

Se creará `docs/launch/launch-checklist.md` con el orden exacto:

1. congelar cambios de contenido durante la migración;
2. generar `dist/` de producción;
3. ejecutar suite completa;
4. publicar primero en URL temporal de Cloudflare;
5. comprobar Inicio, Habitantes, ficha individual, Contacto, Tienda, Transparencia y Administración;
6. comprobar formulario real contra Supabase;
7. comprobar 404;
8. comprobar redirecciones internas;
9. conectar `santuariowinston.org`;
10. activar HTTPS;
11. verificar canonicales y robots de producción;
12. comprobar sitemap;
13. configurar redirección `.com` → `.org` preservando rutas;
14. configurar `www` → apex;
15. activar Cloudflare Web Analytics si el cliente lo aprueba;
16. registrar el dominio en Google Search Console;
17. enviar sitemap;
18. mantener CloudAccess activo durante el periodo de verificación;
19. comprobar formularios, enlaces de donación y Amazon desde producción;
20. solo después cancelar el alojamiento antiguo.

No se cancelará CloudAccess automáticamente ni se cambiarán DNS en esta fase.

## 16. Archivos previstos

### Nuevos

- `scripts/build-release.mjs`
- `scripts/apply-seo.mjs`
- `scripts/apply-structured-data.mjs`
- `scripts/apply-performance.mjs`
- `scripts/apply-accessibility.mjs`
- `scripts/build-cloudflare-config.mjs`
- `scripts/build-404.mjs`
- `assets/data/legacy-redirects.json`
- `404.html`
- `_headers`
- `_redirects`
- `tests/launch-readiness.test.mjs`
- `docs/launch/launch-checklist.md`
- `assets/media/optimized/video-intro-hero.mp4`

### Modificados

- `assets/css/winston-base.css`
- `assets/css/winston-enhancements.css`
- `assets/js/winston.js`
- los generadores actuales de páginas/sitemap donde sea necesario;
- HTML público generado por los scripts.

### Protegidos

No deben cambiar de comportamiento ni exponer más información:

- `administracion.html`
- `assets/js/admin-api.js`
- `assets/js/admin.js`
- `assets/css/admin.css`
- integración Supabase existente.

## 17. Pruebas de aceptación

El bloque no se considerará terminado hasta que una ejecución limpia confirme:

1. las pruebas actuales siguen pasando;
2. las nuevas pruebas de lanzamiento pasan;
3. existen exactamente 70 fichas de habitantes;
4. sitemap de producción contiene exactamente 90 URLs públicas;
5. `administracion.html` y `404.html` no están en sitemap;
6. staging conserva `noindex,nofollow`;
7. producción elimina `noindex` de las 90 páginas públicas;
8. Administración conserva `noindex,nofollow` en ambos entornos;
9. no queda ninguna referencia a `/_vinext_fonts/`;
10. no queda CSS base duplicado inline en las páginas heredadas;
11. no existen `href`/`src` locales rotos;
12. no existen `url(...)` CSS locales rotos;
13. no se expone `winston-storage://`;
14. no se expone ninguna service-role key ni secreto;
15. el vídeo de 90 s no se precarga automáticamente en el hero;
16. el hero respeta `prefers-reduced-motion`;
17. todas las páginas públicas tienen title, description, canonical y H1 únicos por página;
18. portada contiene `Organization` y `WebSite` JSON-LD válidos sintácticamente;
19. fichas de habitantes contienen `BreadcrumbList` coherente con su URL;
20. `404.html` es accesible y tiene noindex;
21. `_headers` y `_redirects` se generan en `dist/`;
22. el paquete sigue sin contener `capacitor-mobile`.

## 18. Resultado esperado

Al terminar este bloque tendremos dos cosas claramente separadas:

**GitHub Pages:** una copia de pruebas, pública pero no indexable.  
**`dist/`:** una versión de producción reproducible, optimizada y preparada para Cloudflare y `santuariowinston.org`.

El cambio de DNS, la transferencia de dominios y la cancelación de CloudAccess se harán después, en una fase de migración controlada y únicamente cuando la web haya pasado la revisión final del usuario y del cliente.

## 19. Referencias técnicas utilizadas para el diseño

- Cloudflare Pages: `_headers`, `_redirects`, custom domains y despliegues estáticos.
- Cloudflare Web Analytics: analítica orientada a privacidad.
- Google Search Central: `Organization`, `BreadcrumbList`, JSON-LD y sitemap.
- W3C: WCAG 2.2.

