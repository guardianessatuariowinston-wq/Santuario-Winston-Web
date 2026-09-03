# Tienda Solidaria Santuario Winston — Diseño

**Fecha:** 2026-09-03  
**Estado:** Diseño aprobado en conversación; pendiente de revisión final del documento antes de implementación.

## 1. Objetivo

Añadir a la web pública una sección **Tienda Solidaria** integrada visualmente con Santuario Winston y preparada para conectarse más adelante al motor comercial definitivo en `tienda.santuariowinston.org`, usando Hostinger Ecommerce + Printful según la arquitectura acordada.

La fase actual construye la **fachada pública, navegación, narrativa y arquitectura de integración**. No activa pagos, carrito, checkout, catálogo Printful ni inventa productos o precios.

## 2. Principios obligatorios

- Mantener la estética actual: verde/crema/natural, fotografía grande, tipografía editorial, aire y tarjetas suaves.
- La tienda debe sentirse parte del Santuario, no una plantilla genérica de ecommerce.
- El Santuario, sus animales y su misión siguen siendo el centro.
- No inventar productos, precios, descuentos, porcentajes de ayuda, stock, tallas, plazos de entrega ni diseños.
- No copiar branding visual de Printful o Hostinger a la web pública.
- No tocar la app Android, `capacitor-mobile`, Supabase, ni el panel `administracion.html`.
- GitHub Pages continúa siendo staging y permanece `noindex`.
- La futura tienda comercial vivirá en `https://tienda.santuariowinston.org/` y podrá sustituirse por otro motor sin rehacer la web institucional.

## 3. Arquitectura

### 3.1 Web institucional

La web que estamos construyendo mantiene `tienda.html` como página editorial/comercial de entrada. Su función es explicar la Tienda Solidaria, mostrar contenidos confirmados y dirigir a la tienda real cuando esté activa.

### 3.2 Motor comercial futuro

Cuando Hostinger Ecommerce + Printful estén configurados:

- `tienda.html` seguirá existiendo como landing integrada con la web del Santuario.
- Los botones de compra de productos POD dirigirán a `https://tienda.santuariowinston.org/` o a URLs concretas del producto.
- El carrito, impuestos, métodos de pago, pedidos, estados y fulfillment se gestionarán fuera de la web estática.
- La fabricación y expedición POD se automatizarán mediante la integración elegida con Printful.

Esta separación evita acoplar toda la web institucional al proveedor ecommerce.

## 4. Navegación

Añadir **Tienda** como entrada de primer nivel en:

- navegación de escritorio;
- navegación móvil;
- pie de página;
- páginas de habitantes generadas, mediante `scripts/public-shell.mjs`;
- páginas públicas existentes actualizadas por el build.

Orden recomendado de escritorio:

`Inicio · Descubre · Cómo ayudar · Voluntariado · Actividades · Tienda · Contacto`

El botón **Donar** permanece separado y visible. Comprar y donar no deben presentarse como la misma acción.

## 5. Página `tienda.html`

### 5.1 Hero

Objetivo: presentar la tienda como otra forma de apoyar al Santuario.

Contenido:

- eyebrow: `Tienda solidaria`;
- H1 centrado en apoyar al Santuario mediante compras con propósito;
- texto breve explicando que se está preparando una colección propia;
- CTA principal hacia la sección de libros ya disponibles;
- CTA secundario hacia `como-ayudar.html`.

No habrá botón falso de “Comprar ahora” para productos aún inexistentes.

### 5.2 Cómo funcionará

Bloque explicativo sencillo de tres pasos:

1. eliges un producto cuando la colección esté disponible;
2. se prepara bajo demanda, evitando stock innecesario;
3. la compra contribuye al proyecto del Santuario.

No se indicará un porcentaje económico concreto de contribución hasta disponer de márgenes y costes reales.

### 5.3 Colecciones en preparación

Mostrar únicamente **familias de producto**, no productos ficticios:

- Ropa solidaria;
- Los Guardianes del Santuario Winston;
- Accesorios y objetos cotidianos.

Cada tarjeta debe mostrar estado `En preparación` y una explicación breve. No mostrar precios, variantes, fotos de mockups no aprobados ni botones de compra.

### 5.4 Libros publicados

Los libros son la única parte actualmente comprable que puede mostrarse con enlaces reales.

Ediciones confirmadas:

- Kindle: `https://www.amazon.es/dp/B0GX2YP7SR`
- Tapa blanda: `https://amzn.eu/d/05Ol7VgK`

Se presentarán como **Los Guardianes del Santuario Winston**, explicando que el proyecto editorial está vinculado al Santuario. Los enlaces abrirán Amazon en pestaña nueva.

No se inventarán precio, disponibilidad ni plazo de entrega: Amazon será la fuente de esas condiciones.

### 5.5 Transparencia POD

Incluir una nota editorial clara:

- la colección de merchandising se producirá principalmente bajo demanda;
- esto permite empezar sin almacenar grandes cantidades de stock;
- la tienda comercial todavía está en preparación.

Evitar prometer que absolutamente todos los productos futuros serán POD.

### 5.6 Cierre / CTA

Cerrar con dos caminos claros:

- `Conoce Los Guardianes` → `guardianes.html`;
- `Otras formas de ayudar` → `como-ayudar.html`.

## 6. Integración con Guardianes

Actualizar `guardianes.html` sin convertirla en tienda:

- mantener el enfoque narrativo/editorial;
- en la zona del libro, añadir enlace secundario a `tienda.html` con copy tipo `Ver libros y futura colección solidaria`;
- en la sección de futuro, mencionar que habrá productos/actividades solo cuando estén confirmados;
- no mostrar catálogo POD dentro de Guardianes.

## 7. Integración con Inicio y Cómo ayudar

### Inicio

Añadir una referencia discreta a la Tienda Solidaria en una zona compatible con la composición existente, sin desplazar campaña, habitantes o misión.

### Cómo ayudar

Añadir la tienda como **otra forma de colaborar mediante una compra**, diferenciada de donación, socio, Teaming, padrinazgo o voluntariado.

No afirmar que “todo el importe” va al Santuario ni porcentajes no confirmados.

## 8. Diseño y responsive

Crear estilos específicos en `assets/css/winston-enhancements.css` reutilizando las variables y componentes existentes.

Requisitos:

- mobile-first;
- H1 sin cortes incómodos en 360–430 px;
- tarjetas de colecciones en 1 columna móvil, 2–3 columnas según ancho;
- botones cómodos para táctil;
- la acción flotante de WhatsApp no debe tapar CTAs;
- mantener contrastes y `focus-visible` accesibles;
- imágenes existentes siempre con `alt` útil cuando aporten contenido.

## 9. SEO y staging

- `tienda.html` tendrá title y description propios.
- Añadir Open Graph y Twitter Card coherentes.
- Canonical preparado para el dominio institucional final, pero GitHub Pages seguirá `noindex,nofollow` mediante el build de staging.
- Añadir `tienda.html` al sitemap generado.
- No incluir URLs de checkout o productos de Hostinger hasta que existan de verdad.

## 10. Código y build

Archivos principales:

- Crear `tienda.html` mediante una nueva función generadora o plantilla dedicada en `scripts/`.
- Modificar `scripts/public-shell.mjs` para incorporar Tienda en escritorio, móvil y footer.
- Modificar `scripts/build-public.mjs` para generar/actualizar la página y mantener el staging `noindex`.
- Modificar `scripts/build-sitemap.mjs` para incluir Tienda.
- Modificar `guardianes.html`, `index.html` y `como-ayudar.html` mediante el proceso de build, evitando ediciones manuales frágiles que el próximo build sobrescriba.
- Ampliar `tests/public-architecture.test.mjs` o crear `tests/storefront.test.mjs`.

## 11. Pruebas obligatorias

Antes de entregar:

1. `tienda.html` existe y carga CSS/JS/media sin rutas rotas.
2. Tienda aparece en nav escritorio, móvil y footer.
3. Las 70 fichas de habitantes conservan navegación funcional hacia Tienda.
4. Kindle enlaza exactamente a `https://www.amazon.es/dp/B0GX2YP7SR`.
5. Tapa blanda enlaza exactamente a `https://amzn.eu/d/05Ol7VgK`.
6. No existe carrito, formulario de tarjeta ni checkout falso.
7. No aparecen precios de productos POD ni productos ficticios.
8. No aparecen secretos, claves o configuraciones privadas.
9. `administracion.html` permanece intacto respecto al baseline del paquete actual.
10. Staging continúa `noindex,nofollow` y `robots.txt` continúa bloqueando indexación.
11. Sitemap contiene `tienda.html` y conserva las 70 fichas públicas.
12. Todas las referencias locales HTML/CSS/JS/media resuelven.
13. Revisión visual desktop y móvil de Inicio, Tienda, Guardianes y Cómo ayudar.

## 12. Fuera de alcance de esta fase

- contratar Hostinger;
- transferir dominios;
- configurar `tienda.santuariowinston.org`;
- crear cuenta/configuración Printful;
- diseñar merchandising;
- fijar precios o márgenes;
- configurar Stripe/PayPal;
- impuestos, envíos y devoluciones de la tienda real;
- sincronización de catálogo;
- app móvil o backend;
- migración final a Cloudflare.

## 13. Criterio de finalización

La fase termina cuando la web pública dispone de una Tienda Solidaria realista y navegable, con los libros confirmados enlazados, las futuras colecciones presentadas como `En preparación`, y la arquitectura lista para conectar después el ecommerce real sin rediseñar la web institucional.
