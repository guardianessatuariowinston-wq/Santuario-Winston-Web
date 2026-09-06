# Santuario Winston — Web

Sitio web público del Santuario Winston. GitHub Pages se utiliza como entorno de **staging/pruebas**, no como alojamiento definitivo.

## Arquitectura pública

- HTML/CSS/JavaScript estático, sin framework SPA.
- `habitantes.html` conserva el directorio público.
- `assets/data/habitantes.json` es la fuente estructurada de las 70 historias públicas.
- `animales/<slug>/index.html` contiene las fichas individuales generadas.
- `guardianes.html` es la entrada editorial a Los Guardianes del Santuario Winston.
- `tienda.html` es la fachada pública de la Tienda Solidaria; no contiene checkout ni productos POD inventados.
- `transparencia.html` centraliza la información pública, campañas, documentación disponible y vías de colaboración.
- `documentos/transparencia/` queda reservado para documentos públicos reales cuando estén confirmados.
- `administracion.html` sigue siendo una zona privada independiente y no forma parte del sitemap.

## Build

Staging (por defecto):

```bash
node scripts/build-public.mjs
node --test tests/*.test.mjs
```

El staging deja `robots.txt` en `Disallow: /` y usa `noindex,nofollow` en las páginas.

Antes de publicar en el dominio definitivo:

```bash
WINSTON_PRODUCTION=1 node scripts/build-public.mjs
node --test tests/*.test.mjs
```

Ese modo habilita indexación. No debe utilizarse en GitHub Pages mientras siga siendo entorno de pruebas.

## Futuras ampliaciones

La navegación se centraliza en `scripts/public-shell.mjs`. La Tienda Solidaria ya tiene fachada pública, pero la tienda comercial y los pagos se conectarán más adelante. Transparencia queda preparada para incorporar únicamente documentos públicos reales y confirmados. La promoción pública de la app sigue fuera de esta fase.

La aplicación móvil y `capacitor-mobile` no forman parte de este repositorio público.

## Preparación para lanzamiento

La raíz del repositorio es el entorno de **staging** de GitHub Pages y debe permanecer `noindex,nofollow`.

Para generar la salida de producción destinada a Cloudflare Pages:

```bash
node scripts/build-release.mjs
```

El comando crea `dist/`, aplica SEO, datos estructurados, rendimiento, accesibilidad, 404 y configuración Cloudflare, y ejecuta la validación de lanzamiento. `dist/` es un artefacto generado: no sustituye al staging ni realiza cambios DNS.

Cloudflare Web Analytics está preparado pero desactivado por defecto. Solo se inyecta en un build de producción si se proporciona explícitamente `WINSTON_CF_WEB_ANALYTICS_TOKEN`.

La secuencia de migración está documentada en `docs/launch/launch-checklist.md`.

## Winston interactivo · variables de servidor

El chat libre de Winston se ejecuta en la Edge Function `winston-chat`. Estas variables se configuran como secretos/variables del entorno de Supabase; **nunca** se incluyen valores en HTML, JavaScript público ni en el repositorio.

```text
OPENAI_API_KEY                 # Supabase secret, nunca client-side
OPENAI_MODEL                   # opcional; por defecto gpt-5.6-luna
WINSTON_CHAT_KNOWLEDGE_URL     # JSON público generado por el build
WINSTON_CHAT_RATE_SALT         # secreto aleatorio para hash anónimo del rate limit
```

La llamada de generación usa OpenAI Responses con `store:false`. La moderación de entrada y salida se hace mediante la API de Moderations por separado. No existe una tabla de transcripciones del chat.
