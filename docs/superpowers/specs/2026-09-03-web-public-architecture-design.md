# Santuario Winston — Arquitectura pública escalable

**Fecha:** 3 septiembre 2026  
**Estado:** diseño propuesto para implementación tras aprobación  
**Ámbito:** web pública; no modifica la app Android ni el panel de administración validado.

## 1. Objetivo

Evolucionar la web pública actual sin rehacerla ni cambiar su identidad visual. El bloque debe mejorar navegación, estructura, SEO y escalabilidad del contenido; convertir Habitantes en un sistema con fichas individuales; reforzar campaña/colaboración; crear la base pública de Los Guardianes del Santuario Winston; y preparar técnicamente futuras secciones de tienda Print on Demand y promoción de la app sin implementarlas todavía.

## 2. Principios no negociables

- Mantener la estética actual: verde/crema/natural, fotografía protagonista, serif editorial, aire, tarjetas suaves y tono emocional.
- No convertir la web en un dashboard, SaaS, ecommerce genérico ni plantilla de ONG.
- No inventar animales, historias, fechas, rescates, cifras, necesidades, voluntarios, datos veterinarios o campañas.
- Conservar todo el contenido real existente.
- La app Android y `capacitor-mobile` quedan fuera de alcance.
- El panel `administracion.html` sigue separado de la experiencia pública.
- GitHub Pages sigue siendo staging/pruebas; no se trata como alojamiento definitivo.

## 3. Estado actual relevante

La web pública dispone de 18 páginas HTML principales y una identidad visual ya consolidada. `habitantes.html` contiene 70 historias reales con nombre, fecha/llegada, imagen, resumen e historia completa. Actualmente estas historias viven dentro de una única página, por lo que cada animal no tiene URL, metadatos ni página propia.

La navegación principal actual es: Inicio, Habitantes, Cómo ayudar, Voluntariado, Actividades, Nosotros, Contacto, más CTA Donar.

## 4. Enfoques valorados

### A. Crear 70 páginas manualmente
Ventaja: mínima infraestructura.  
Problema: enorme duplicación, difícil mantenimiento y alto riesgo de inconsistencias.  
**Descartado.**

### B. Cargar todas las fichas solo con JavaScript desde un JSON
Ventaja: una única fuente de datos.  
Problema: peor resiliencia, mayor dependencia de JS y páginas individuales menos sólidas para SEO/social.  
**Descartado como solución única.**

### C. Fuente de datos central + generación estática
Un archivo estructurado central contiene los 70 habitantes. Un generador produce las páginas individuales estáticas y los metadatos SEO. El directorio público puede usar la misma fuente para búsqueda/filtros.

**Enfoque recomendado y aprobado para el plan.** Mantiene GitHub Pages simple, no introduce un framework de producción y permite URLs individuales indexables.

## 5. Arquitectura de Habitantes

### 5.1 Fuente central

Crear `assets/data/habitantes.json` con datos extraídos exclusivamente de `habitantes.html` actual.

Campos base por habitante:
- `slug`
- `name`
- `dateLabel` (texto original: “Nacida…”, “Llegada…”, etc.)
- `image`
- `excerpt`
- `story` (párrafos originales)
- `species` solo cuando pueda confirmarse desde el contenido o marcado actual; si no, `null`
- `sponsorable` (por defecto se conserva el CTA existente sin inferir disponibilidad individual)
- `source` = `habitantes.html`

No se corregirán hechos históricos durante la migración. Ortografía editorial podrá revisarse en otra fase, pero nunca cambiando el significado factual.

### 5.2 Directorio

`habitantes.html` seguirá siendo la URL pública del directorio para no romper enlaces.

Se mantendrán:
- hero actual;
- búsqueda;
- filtros existentes si los hay;
- tarjetas con fotografía, nombre y resumen;
- CTA de apadrinamiento;
- identidad visual.

Cada tarjeta tendrá un CTA principal `Conoce su historia` que abre la página individual.

### 5.3 Páginas individuales

Crear 70 rutas estáticas limpias:

`/animales/<slug>/index.html`

Ejemplos:
- `/animales/zeus/`
- `/animales/ula/`
- `/animales/declan/`

Cada página tendrá:
- cabecera y navegación global;
- fotografía principal;
- nombre;
- fecha/llegada original;
- historia completa real;
- enlace de vuelta a Habitantes;
- CTA a `apadrina.html` sin afirmar disponibilidad concreta;
- bloque “Conoce otros habitantes” con 3 enlaces deterministas a otras fichas;
- footer actual.

No se mostrarán en estas páginas datos clínicos, administrativos, microchips, documentos privados ni información procedente del panel/app.

## 6. SEO y compartición

Cada habitante tendrá:
- `<title>` único;
- meta description basada en el resumen real, truncada de forma segura;
- canonical al dominio final previsto `https://santuariowinston.com/animales/<slug>/`;
- Open Graph y Twitter Card;
- imagen social del propio animal;
- JSON-LD tipo `Article`/`WebPage` sin inventar atributos biográficos.

El `sitemap.xml` incluirá las páginas individuales.

### Staging

Mientras GitHub Pages siga siendo entorno de pruebas, la versión staging no debe competir en Google con el dominio definitivo. Se añadirá una protección de indexación específica del staging y se documentará su retirada obligatoria antes de migrar al dominio final.

## 7. Navegación pública

Para evitar saturar la cabecera al añadir Guardianes, se reorganiza sin aumentar la densidad visual.

### Escritorio
- Inicio
- Descubre ▾
  - Habitantes
  - Los Guardianes
  - Nosotros
- Cómo ayudar ▾
  - Hazte socio
  - Apadrina
  - Teaming
  - Donativos
  - Empresas solidarias
  - En busca del paraíso
- Voluntariado ▾
  - Testimonios
  - Voluntario habitual
  - Larga estancia
- Actividades
- Contacto
- CTA Donar

### Móvil
Misma jerarquía, manteniendo el drawer actual y sin añadir niveles de navegación innecesarios.

## 8. Los Guardianes del Santuario Winston

Crear `guardianes.html` como puerta de entrada al universo creativo, no como tienda.

Objetivos:
- explicar qué son Los Guardianes;
- conectar el proyecto editorial con la misión real del Santuario;
- presentar a los protagonistas oficiales sin alterar su canon;
- enlazar al libro publicado cuando el enlace confirmado ya disponible se utilice;
- dejar preparada la arquitectura futura para Libro 2, materiales, actividades y tienda.

### Contenido inicial
- Hero “Los Guardianes del Santuario Winston”.
- Introducción al universo.
- Protagonistas: Winston, Pegaso, Epona, Declan y Dolo usando únicamente datos canónicos confirmados.
- Bloque del libro publicado.
- CTA “Conoce a los habitantes reales” → `habitantes.html`.
- CTA editorial al libro.
- Área “El universo continúa” preparada para futuras ampliaciones, sin publicar productos inexistentes.

No se generarán imágenes nuevas en este bloque. Se usarán únicamente recursos existentes y aprobados si están disponibles; en caso contrario, diseño tipográfico/fotográfico sin inventar arte.

## 9. Campaña y colaboración

### Campaña “hogar definitivo”

No se cambiarán cifras como 46 caballos o 600.000 € sin verificación expresa. Se mejorará:
- enlace contextual desde Inicio, Cómo ayudar y Guardianes cuando corresponda;
- jerarquía de CTA;
- consistencia del mensaje;
- acceso fácil a la campaña real.

### Formas de colaborar

`como-ayudar.html` seguirá siendo el hub principal. Se reforzará la lectura por intención:
- ayuda recurrente;
- apadrinamiento;
- donación puntual;
- Teaming;
- empresas;
- voluntariado;
- campaña de la finca;
- otras formas de colaborar.

No se añadirá todavía ecommerce.

## 10. Preparación futura de tienda POD

No se conecta Printful, Gelato, Printify, Shopify ni pagos en este bloque.

Se reserva arquitectura:
- futura `/tienda/`;
- navegación capaz de añadir “Tienda” sin rediseñar toda la cabecera;
- estilos reutilizables de producto coherentes con la marca;
- separación clara entre contenido editorial Guardianes y comercio.

No se incluirán productos ficticios, precios ni mockups no aprobados.

## 11. Preparación futura de app

No se promociona públicamente la app hasta que Android termine pruebas y exista una versión apta para usuarios externos.

La arquitectura dejará un punto de inserción futuro para:
- “App Santuario Winston”;
- enlaces a tiendas;
- explicación de funciones públicas si procede.

Nada se publicará todavía.

## 12. Ajustes de UX incluidos

Este bloque también absorberá ajustes pendientes ya detectados en la web pública:
- botón flotante de WhatsApp con zona segura para no tapar CTAs/contenido;
- reducción fluida de titulares muy grandes en pantallas estrechas;
- mejor legibilidad del logo/cabecera móvil sin cambiar marca;
- mantener objetivos táctiles y accesibilidad;
- conservar el menú móvil validado.

## 13. Datos y contenido

### Confirmado
- 70 historias existentes en `habitantes.html`.
- contenido visual y textual actual de la web.
- páginas y enlaces ya validados.
- existencia del proyecto editorial Los Guardianes.

### No se inferirá
- especie/sexo/edad de un habitante si no está soportado por la fuente pública;
- estado actual de salud;
- disponibilidad para apadrinamiento individual;
- nuevas fechas de actividades;
- nuevas cifras de campaña;
- productos de tienda.

## 14. Accesibilidad y rendimiento

- HTML semántico.
- foco visible y navegación por teclado.
- `alt` basado en nombre/contexto, sin inventar escenas.
- lazy-loading para imágenes no críticas.
- páginas individuales sin dependencias pesadas.
- ningún framework SPA nuevo.
- mantener JS progresivo y degradación razonable.

## 15. Seguridad y privacidad

- ningún token secreto en el repositorio público;
- ninguna URL privada de Storage expuesta directamente;
- ninguna dependencia con `administracion.html` para contenido público;
- no reutilizar datos privados de `winston_sync_records` para páginas públicas;
- staging protegido contra indexación accidental.

## 16. Archivos previstos

### Crear
- `assets/data/habitantes.json`
- `assets/js/habitantes-directory.js`
- `scripts/build-habitantes.mjs`
- `guardianes.html`
- `animales/<slug>/index.html` × 70
- pruebas de generación/SEO/enlaces

### Modificar
- `habitantes.html`
- `index.html`
- páginas con navegación global
- `assets/css/winston-enhancements.css`
- `assets/js/winston.js` solo si la navegación/UX global lo requiere
- `sitemap.xml`
- `robots.txt` según staging

## 17. Pruebas de aceptación

1. Las 70 historias existentes aparecen en el JSON sin pérdidas.
2. Existen 70 rutas individuales únicas y navegables.
3. Cada ruta usa nombre, historia e imagen correctos del habitante.
4. Ninguna historia recibe datos inventados.
5. Todas las URLs internas y archivos multimedia resuelven.
6. Sitemap contiene las fichas individuales.
7. Guardianes no contiene personajes/datos fuera del canon aprobado.
8. Navegación funciona en escritorio y móvil.
9. WhatsApp no tapa CTAs principales en viewport móvil de referencia.
10. No aparecen secretos ni datos privados.
11. `administracion.html` sigue fuera de sitemap/indexación.
12. No se modifica la app Android.

## 18. Fuera de alcance de este bloque

- tienda operativa;
- integración Print on Demand;
- pagos;
- publicación de app;
- CMS completo desde administración;
- edición web de historias;
- corrección masiva factual/ortográfica de las 70 historias;
- migración al dominio final;
- cambios en la app Android.
