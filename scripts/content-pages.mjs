export const contentKinds = {
  blog: {
    base: 'blog',
    label: 'Blog',
    eyebrow: 'Actualidad del Santuario',
    title: 'Historias y actualidad de Santuario Winston',
    description: 'Novedades, proyectos, actividades e historias reales de Santuario Winston.'
  },
  aprende: {
    base: 'aprende',
    label: 'Aprende con Winston',
    eyebrow: 'Conocer para respetar',
    title: 'Aprende con Winston',
    description: 'Comportamiento, bienestar y convivencia respetuosa con los caballos desde la experiencia del Santuario.'
  },
  historias: {
    base: 'historias',
    label: 'Archivo del Santuario',
    eyebrow: 'Nuestra historia',
    title: 'Historias del Santuario',
    description: 'Archivo histórico de jornadas, rescates, campañas, talleres y momentos importantes de Santuario Winston.'
  }
};

export function contentKind(articleOrKind) {
  const key = typeof articleOrKind === 'string' ? articleOrKind : articleOrKind?.kind;
  return contentKinds[key] || contentKinds.blog;
}

export function contentPathForArticle(article) {
  const kind = contentKind(article);
  return `${kind.base}/${article.slug}/`;
}

export function contentFileForArticle(article) {
  return `${contentPathForArticle(article)}index.html`;
}

export function contentIndexFiles() {
  return Object.values(contentKinds).map((kind) => `${kind.base}/index.html`);
}
