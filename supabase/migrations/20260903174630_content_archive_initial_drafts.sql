-- Santuario Winston · primera recuperación del archivo educativo histórico
-- Los textos se cargan como BORRADOR. Conservan procedencia y requieren revisión editorial antes de publicar.

insert into public.content_articles (
  slug, kind, title, excerpt, body_markdown, category, author_name, status,
  source_url, original_published_at, original_author_name, review_note
) values
(
  'los-caballos-y-la-claustrofobia', 'aprende', 'Los caballos y la claustrofobia',
  'Archivo educativo sobre la relación del caballo con los espacios cerrados, refugios y transporte.',
  'Este contenido forma parte del archivo educativo histórico del Santuario Winston. El artículo original abordaba cómo los caballos perciben los espacios cerrados y cómo esa percepción influye en refugios, cuadras y transporte.\n\nAntes de republicarlo se revisará el texto original y se actualizarán las recomendaciones de bienestar con fuentes actuales.',
  'Comportamiento y bienestar', 'Santuario Winston', 'draft',
  'https://santuariowinston.wordpress.com/2022/03/26/los-caballos-y-la-claustrofobia/',
  '2022-03-26T00:00:00Z', 'David Muriel',
  'Recuperado como borrador desde la web histórica. Revisar terminología y recomendaciones actuales antes de publicar.'
),
(
  'el-lugar-donde-vive-tu-caballo-es-seguro', 'aprende', 'El lugar donde vive tu caballo ¿es seguro?',
  'Archivo educativo sobre instalaciones, vallados y prevención de riesgos en los espacios donde viven los caballos.',
  'Este contenido forma parte del archivo educativo histórico del Santuario Winston. El artículo original trataba la seguridad de instalaciones, edificios y vallados teniendo en cuenta la fuerza del caballo y sus respuestas de huida.\n\nAntes de republicarlo se revisarán las recomendaciones técnicas y de seguridad con criterios actuales.',
  'Bienestar y seguridad', 'Santuario Winston', 'draft',
  'https://santuariowinston.wordpress.com/2022/02/05/el-lugar-donde-vive-tu-caballo-es-seguro/',
  '2022-02-05T00:00:00Z', 'David Muriel',
  'Recuperado como borrador. Revisar cualquier cifra, recomendación técnica o afirmación sanitaria antes de publicar.'
),
(
  'ya-no-monto-a-caballo', 'aprende', 'Ya no monto a caballo',
  'Reflexión histórica sobre otra forma de relacionarse con los caballos, basada en observar, cuidar y convivir.',
  'Este artículo pertenece al archivo histórico del Santuario Winston y recoge una reflexión personal sobre el cambio desde una relación centrada en montar hacia una convivencia distinta con los caballos.\n\nPendiente de recuperar y revisar la versión original completa antes de decidir si se publica como archivo histórico o como una versión editorial actualizada.',
  'Filosofía del Santuario', 'Santuario Winston', 'draft',
  'https://santuariowinston.wordpress.com/2021/12/11/ya-no-monto-a-caballo/',
  '2021-12-11T00:00:00Z', 'David Muriel',
  'Conservar el carácter testimonial del original. No convertirlo en un artículo técnico.'
),
(
  'el-caballo-en-invierno', 'aprende', 'El caballo en invierno',
  'Archivo educativo sobre adaptación al frío, refugio, pelaje y cuidados durante el invierno.',
  'Este contenido forma parte del archivo educativo histórico del Santuario Winston. El artículo original explicaba la adaptación de los caballos al frío, el papel del pelaje, el acceso a refugios y algunas prácticas de manejo invernal.\n\nAntes de republicarlo se revisarán especialmente las recomendaciones sobre mantas, pelaje, higiene y termorregulación con fuentes veterinarias actuales.',
  'Bienestar estacional', 'Santuario Winston', 'draft',
  'https://santuariowinston.wordpress.com/2021/11/25/el-caballo-en-invierno/',
  '2021-11-25T00:00:00Z', 'David Muriel',
  'Revisión veterinaria/editorial necesaria antes de publicar. No reutilizar automáticamente antiguos datos bancarios o llamadas a donación del artículo.'
),
(
  'tocar-y-acariciar', 'aprende', 'Tocar y acariciar',
  'Archivo educativo sobre sensibilidad al tacto, aproximación respetuosa y respuesta del caballo al contacto.',
  'Este contenido forma parte del archivo educativo histórico del Santuario Winston. El artículo original trataba la sensibilidad táctil del caballo y la importancia de observar su respuesta cuando una persona se acerca, toca o acaricia.\n\nAntes de republicarlo se revisará la terminología y se reforzará el enfoque de consentimiento, observación y respeto de las señales del animal.',
  'Relación con los caballos', 'Santuario Winston', 'draft',
  'https://santuariowinston.wordpress.com/2021/11/04/tocar-y-acariciar/',
  '2021-11-04T00:00:00Z', 'David Muriel',
  'Recuperado como borrador. Revisar afirmaciones anatómicas o conductuales concretas antes de publicar.'
),
(
  'observa-y-acercate-a-los-caballos-para-conocerlos', 'aprende', 'Observa y acércate a los caballos para conocerlos',
  'Archivo educativo sobre la observación paciente como base para conocer a un caballo, especialmente tras experiencias traumáticas.',
  'Este contenido forma parte del archivo educativo histórico del Santuario Winston. El artículo original partía de una reflexión de Dolo Pérez Molina sobre la necesidad de observar durante muchas horas a los caballos, especialmente a los que llegan con experiencias traumáticas, antes de intentar interactuar con ellos.\n\nLa versión revisada deberá conservar esta experiencia práctica del Santuario y diferenciarla claramente de cualquier recomendación clínica.',
  'Observación y confianza', 'Santuario Winston', 'draft',
  'https://santuariowinston.wordpress.com/2021/10/17/observa-y-acercate-a-los-caballos-para-conocerlos/',
  '2021-10-17T00:00:00Z', 'David Muriel',
  'Conservar la referencia a Dolo Pérez Molina y el carácter de experiencia del Santuario. Revisar antes de publicar.'
)
on conflict (slug) do update set
  source_url = excluded.source_url,
  original_published_at = excluded.original_published_at,
  original_author_name = excluded.original_author_name,
  review_note = excluded.review_note,
  updated_at = now()
where public.content_articles.status <> 'published';
