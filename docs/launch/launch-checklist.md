# Santuario Winston — Checklist de lanzamiento a santuariowinston.org

Esta lista se ejecutará únicamente cuando la web haya pasado la revisión final del usuario y del cliente. CloudAccess se mantiene activo hasta completar todas las comprobaciones de producción.

1. Congelar cambios de contenido durante la ventana de migración.
2. Generar una versión limpia de producción con `node scripts/build-release.mjs`.
3. Confirmar que la suite completa termina con cero fallos.
4. Publicar primero `dist/` en una URL temporal de Cloudflare Pages.
5. Comprobar manualmente Inicio, Habitantes, una ficha individual, Contacto, Tienda, Transparencia y Administración.
6. Enviar un mensaje real desde Contacto y confirmar su llegada a Supabase.
7. Abrir una URL inexistente y confirmar la página 404 personalizada.
8. Comprobar `/index.html → /` y `/animales/<slug>/index.html → /animales/<slug>/`.
9. Conectar `santuariowinston.org` a Cloudflare cuando la URL temporal esté validada.
10. Confirmar HTTPS válido antes de anunciar el nuevo dominio.
11. Verificar en producción canonicales `.org`, `index,follow` público y `noindex,nofollow` en Administración/404.
12. Abrir `https://santuariowinston.org/sitemap.xml` y comprobar sus 90 URLs públicas.
13. Configurar `santuariowinston.com/* → https://santuariowinston.org/<misma-ruta>` con 301 preservando ruta y query string.
14. Configurar `www.santuariowinston.com` y `www.santuariowinston.org` hacia el dominio principal, preservando ruta y query string.
15. Activar Cloudflare Web Analytics solo si el cliente lo aprueba; no añadir Google Analytics por defecto.
16. Dar de alta `santuariowinston.org` en Google Search Console.
17. Enviar `https://santuariowinston.org/sitemap.xml` desde Search Console.
18. Mantener CloudAccess activo durante el periodo de verificación posterior al cambio DNS.
19. Probar desde producción formulario, enlaces de donación, Teaming, campaña y enlaces Amazon de los libros.
20. Cancelar el alojamiento antiguo únicamente después de comprobar DNS, HTTPS, formularios, redirecciones y servicios durante el periodo acordado.

## Antes de transferir dominios

- Confirmar con el Santuario que `.org` será definitivamente el dominio principal.
- Inventariar cualquier cuenta de correo asociada a `.com` o `.org` antes de cambiar DNS/MX.
- Recuperar URLs históricas verificadas de Jimdo y WordPress. En discrepancias históricas, Jimdo tiene prioridad según la regla del proyecto.
- Incorporar únicamente redirecciones confirmadas a `assets/data/legacy-redirects.json`.

## Qué no hace el build

El build no cambia DNS, no transfiere dominios, no cancela CloudAccess, no activa analítica por sí solo y no modifica Supabase ni la app Android.
