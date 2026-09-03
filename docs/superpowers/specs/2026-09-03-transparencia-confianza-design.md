# Santuario Winston — Transparencia y Confianza — Especificación de Diseño

**Fecha:** 2026-09-03  
**Estado:** Diseño aprobado para documentación; pendiente de aprobación final del documento antes de implementación.

## 1. Objetivo

Crear un Centro de Transparencia público, claro y escalable que refuerce la confianza en el Santuario Winston sin inventar cifras, documentos ni datos legales. El bloque debe integrarse en la web pública actual, mantener su identidad visual y conectar de forma natural con las páginas institucionales, de colaboración y campañas.

## 2. Alcance

Este bloque incluye:

- nueva página `transparencia.html`;
- estructura preparada para documentos públicos en `/documentos/transparencia/`;
- mejoras relacionadas en `sobre-nosotros.html`, `como-ayudar.html`, `donar.html` y `en-busca-del-paraiso.html`;
- enlaces desde footer y navegación institucional;
- FAQ pública de transparencia y colaboración;
- preparación de metadatos SEO y accesibilidad;
- preservación de la estética actual del sitio.

Quedan fuera de este bloque:

- app Android/iOS;
- Supabase y panel de Administración;
- Tienda Solidaria;
- datos veterinarios o documentos internos;
- publicación de cifras no confirmadas;
- generación de memorias o cuentas inexistentes.

## 3. Principios de contenido

1. **No inventar datos.** Si no existe confirmación documental o del Santuario, no se publica como hecho.
2. **Diferenciar lo confirmado de lo pendiente.** Los huecos de información se omiten o se marcan claramente como pendientes de incorporación.
3. **Prioridad a documentos reales.** Las memorias, cuentas, certificados o informes solo se publicarán cuando el Santuario facilite los archivos válidos.
4. **Privacidad estricta.** No se reutilizarán documentos veterinarios, fichas internas, información de usuarios, credenciales ni archivos privados de Supabase.
5. **Lenguaje comprensible.** Evitar jerga jurídica o financiera innecesaria; explicar de forma sencilla qué hace el Santuario y cómo puede colaborar una persona.

## 4. Arquitectura de información

### 4.1 Página principal: `transparencia.html`

La página se organizará en bloques:

1. **Hero / Introducción**  
   Título: “Transparencia y confianza”.  
   Mensaje corto sobre el compromiso del Santuario con la claridad y la información pública.

2. **Quiénes somos**  
   Resumen institucional y enlace a `sobre-nosotros.html`.

3. **Qué hacemos**  
   Explicación del trabajo del Santuario usando solo contenido ya confirmado.

4. **Cómo se utilizan las ayudas**  
   Explicación general de destinos habituales de la ayuda —alimentación, cuidados, atención veterinaria, mantenimiento, instalaciones u otras necesidades reales— sin porcentajes ni cifras hasta tener documentación oficial.

5. **Campañas y necesidades**  
   Enlace a campañas reales, incluida `en-busca-del-paraiso.html`, y espacio preparado para futuras campañas verificadas.

6. **Documentación pública**  
   Índice de documentos disponibles por año y categoría. Si todavía no hay documentos, se mostrará un mensaje honesto indicando que se incorporarán cuando estén disponibles.

7. **Formas de colaborar**  
   Enlaces a donar, Teaming, hacerse socio, apadrinar, voluntariado y empresas solidarias.

8. **Preguntas frecuentes**  
   Respuestas breves sobre colaboración, donaciones, visitas, voluntariado, tienda, documentación y contacto.

9. **Contacto**  
   Enlace al formulario de contacto para consultas sobre transparencia.

### 4.2 Documentos públicos

Ruta preparada:

`/documentos/transparencia/`

Categorías previstas:

- memorias anuales;
- cuentas e información económica;
- certificados;
- proyectos;
- informes;
- documentación de campañas.

Cada documento publicado deberá mostrar:

- título;
- tipo;
- año;
- fecha de publicación;
- enlace de descarga/consulta;
- breve descripción cuando sea necesaria.

No se crearán documentos vacíos, plantillas fingidas ni archivos de muestra públicos.

## 5. Integración con páginas existentes

### `sobre-nosotros.html`

Añadir un bloque de confianza institucional y un CTA hacia Transparencia.

### `como-ayudar.html`

Separar claramente:

- ayuda económica;
- ayuda no económica;
- tiempo y voluntariado;
- colaboración empresarial;
- compras solidarias.

Añadir un enlace contextual a Transparencia.

### `donar.html`

Añadir contexto sobre confianza, trazabilidad y acceso a la documentación pública disponible, sin introducir porcentajes o cifras no verificadas.

### `en-busca-del-paraiso.html`

Conectar la campaña con Transparencia para que futuras actualizaciones, documentos o hitos verificables puedan enlazarse desde un único punto.

### Footer / navegación institucional

Añadir `Transparencia` como enlace institucional. No se convertirá en un CTA comercial prominente del menú principal.

## 6. Diseño visual

Se mantiene la identidad ya aprobada:

- tonos verdes, crema y naturales;
- fotografía grande;
- tipografía editorial serif en titulares;
- espacios amplios;
- tarjetas redondeadas suaves;
- lenguaje emocional y cercano;
- sin estética SaaS, dashboard o corporativa fría.

La página de Transparencia debe sentirse parte del Santuario, no una sección legal aislada.

## 7. SEO

Mientras GitHub Pages siga siendo staging:

- mantener `noindex` en el entorno de pruebas;
- usar canonical definitivo hacia `https://santuariowinston.org/transparencia.html`;
- preparar `title` y `meta description` específicos;
- añadir Transparencia al sitemap definitivo solo cuando corresponda en producción.

## 8. Accesibilidad

- jerarquía correcta de encabezados;
- contraste suficiente;
- enlaces descriptivos;
- documentos con tipo y año identificables;
- navegación por teclado;
- foco visible;
- etiquetas accesibles para acordeones o FAQ si se usan.

## 9. Datos pendientes y política de publicación

No se publicarán como hechos hasta confirmación:

- CIF/NIF definitivo;
- domicilio legal;
- inscripción registral;
- número actual de animales;
- cuentas anuales;
- gastos veterinarios;
- porcentajes de uso de donaciones;
- cifras de impacto;
- certificados o reconocimientos no documentados.

Si alguno de estos datos ya aparece en la web antigua, se conservará únicamente si está confirmado por la fuente prioritaria del proyecto o por el propio Santuario.

## 10. Criterios de aceptación

El bloque se considerará listo cuando:

1. `transparencia.html` existe y mantiene la estética actual.
2. No contiene cifras, porcentajes o datos legales inventados.
3. Las páginas relacionadas enlazan correctamente a Transparencia.
4. La estructura `/documentos/transparencia/` queda preparada sin publicar documentos ficticios.
5. Los enlaces de colaboración funcionan.
6. El staging continúa protegido de indexación.
7. No se modifica la app, Supabase, Administración ni la tienda.
8. Las pruebas de enlaces, accesibilidad básica y estructura pasan sin errores.

## 11. Estrategia de implementación

Se implementará como una actualización consolidada sobre una copia aislada de la web, con pruebas antes de empaquetar. El usuario recibirá un único ZIP para sustituir el contenido del repositorio público de la web.

