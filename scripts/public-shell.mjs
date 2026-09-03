const arrow = '<span aria-hidden="true">→</span>';
const chevron = '<span aria-hidden="true">⌄</span>';
const menuIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></svg>';
const closeIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';

const href = (prefix, file) => `${prefix}${file}`;
const activeClass = (active, key) => active === key ? 'active' : '';

export function desktopNav(prefix = '', active = '') {
  return `<nav class="desktop-nav" aria-label="Navegación principal">
    <div class="nav-item"><a class="${activeClass(active,'inicio')}" href="${href(prefix,'index.html')}">Inicio</a></div>
    <div class="nav-item"><a class="${activeClass(active,'descubre')}" href="${href(prefix,'habitantes.html')}">Descubre ${chevron}</a><div class="nav-dropdown">
      <a href="${href(prefix,'habitantes.html')}">Habitantes ${arrow}</a>
      <a href="${href(prefix,'guardianes.html')}">Los Guardianes ${arrow}</a>
      <a href="${href(prefix,'sobre-nosotros.html')}">Nosotros ${arrow}</a>
      <a href="${href(prefix,'transparencia.html')}">Transparencia ${arrow}</a>
      <a href="${href(prefix,'blog/')}">Blog ${arrow}</a>
      <a href="${href(prefix,'aprende/')}">Aprende con Winston ${arrow}</a>
      <a href="${href(prefix,'historias/')}">Archivo histórico ${arrow}</a>
    </div></div>
    <div class="nav-item"><a class="${activeClass(active,'ayudar')}" href="${href(prefix,'como-ayudar.html')}">Cómo ayudar ${chevron}</a><div class="nav-dropdown">
      <a href="${href(prefix,'hazte-socio.html')}">Hazte socio ${arrow}</a><a href="${href(prefix,'apadrina.html')}">Apadrina ${arrow}</a><a href="${href(prefix,'teaming.html')}">Teaming ${arrow}</a><a href="${href(prefix,'donar.html')}">Donativos ${arrow}</a><a href="${href(prefix,'adopciones-solidarias.html')}">Empresas solidarias ${arrow}</a><a href="${href(prefix,'en-busca-del-paraiso.html')}">En busca del paraíso ${arrow}</a>
    </div></div>
    <div class="nav-item"><a class="${activeClass(active,'voluntariado')}" href="${href(prefix,'voluntariado.html')}">Voluntariado ${chevron}</a><div class="nav-dropdown"><a href="${href(prefix,'testimonios.html')}">Testimonios ${arrow}</a><a href="${href(prefix,'voluntariado-habitual.html')}">Voluntario habitual ${arrow}</a><a href="${href(prefix,'larga-estancia.html')}">Larga estancia ${arrow}</a></div></div>
    <div class="nav-item"><a class="${activeClass(active,'actividades')}" href="${href(prefix,'actividades.html')}">Actividades</a></div>
    <div class="nav-item"><a class="${activeClass(active,'tienda')}" href="${href(prefix,'tienda.html')}">Tienda</a></div>
    <div class="nav-item"><a class="${activeClass(active,'contacto')}" href="${href(prefix,'contacto.html')}">Contacto</a></div>
  </nav>`;
}

export function mobileNav(prefix = '') {
  return `<nav aria-label="Navegación móvil">
    <div class="drawer-group"><a href="${href(prefix,'index.html')}">Inicio</a></div>
    <div class="drawer-group"><a href="${href(prefix,'habitantes.html')}">Descubre</a><a class="drawer-child" href="${href(prefix,'habitantes.html')}">Habitantes</a><a class="drawer-child" href="${href(prefix,'guardianes.html')}">Los Guardianes</a><a class="drawer-child" href="${href(prefix,'sobre-nosotros.html')}">Nosotros</a><a class="drawer-child" href="${href(prefix,'transparencia.html')}">Transparencia</a><a class="drawer-child" href="${href(prefix,'blog/')}">Blog</a><a class="drawer-child" href="${href(prefix,'aprende/')}">Aprende con Winston</a><a class="drawer-child" href="${href(prefix,'historias/')}">Archivo histórico</a></div>
    <div class="drawer-group"><a href="${href(prefix,'como-ayudar.html')}">Cómo ayudar</a><a class="drawer-child" href="${href(prefix,'hazte-socio.html')}">Hazte socio</a><a class="drawer-child" href="${href(prefix,'apadrina.html')}">Apadrina</a><a class="drawer-child" href="${href(prefix,'teaming.html')}">Teaming</a><a class="drawer-child" href="${href(prefix,'donar.html')}">Donativos</a><a class="drawer-child" href="${href(prefix,'adopciones-solidarias.html')}">Empresas solidarias</a><a class="drawer-child" href="${href(prefix,'en-busca-del-paraiso.html')}">En busca del paraíso</a></div>
    <div class="drawer-group"><a href="${href(prefix,'voluntariado.html')}">Voluntariado</a><a class="drawer-child" href="${href(prefix,'testimonios.html')}">Testimonios</a><a class="drawer-child" href="${href(prefix,'voluntariado-habitual.html')}">Voluntario habitual</a><a class="drawer-child" href="${href(prefix,'larga-estancia.html')}">Larga estancia</a></div>
    <div class="drawer-group"><a href="${href(prefix,'actividades.html')}">Actividades</a></div><div class="drawer-group"><a href="${href(prefix,'tienda.html')}">Tienda</a></div><div class="drawer-group"><a href="${href(prefix,'contacto.html')}">Contacto</a></div>
  </nav>`;
}

export function header(prefix = '', active = 'descubre') {
  return `<div class="campaign-ribbon"><span>Una finca propia para 46 caballos</span><a href="https://www.migranodearena.org/reto/el-hogar-definitivo-para-el-santuario-winston" target="_blank" rel="noreferrer">Súmate al hogar definitivo ${arrow}</a></div>
  <header class="site-header"><a class="brand" href="${href(prefix,'index.html')}" aria-label="Santuario Winston, inicio"><img src="${href(prefix,'assets/media/optimized/logos/logo-wisnton-sinfondo.webp')}" alt="Santuario Winston"/><span>Santuario Winston<small>Hogar de caballos libres</small></span></a>${desktopNav(prefix,active)}<a class="header-donate" href="${href(prefix,'donar.html')}">♥ Donar</a><button class="menu-toggle" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="mobile-navigation">${menuIcon}</button></header>
  <div class="mobile-drawer" id="mobile-navigation" aria-hidden="true"><button class="drawer-backdrop" aria-label="Cerrar menú"></button><div class="drawer-panel"><div class="drawer-head"><span>Explora Winston</span><button aria-label="Cerrar menú">${closeIcon}</button></div>${mobileNav(prefix)}<div class="drawer-actions"><a class="button button-primary" href="${href(prefix,'donar.html')}">Donar ahora</a><a class="button button-outline" href="https://wa.me/34690143920">WhatsApp</a></div></div></div>`;
}

export function footer(prefix = '') {
  return `<footer class="site-footer"><div class="footer-cta shell"><div><p class="eyebrow">Toda ayuda cuenta</p><h2>Haz posible otra vida en libertad.</h2></div><div class="button-row"><a class="button button-light" href="${href(prefix,'apadrina.html')}">Apadrina</a><a class="button button-accent" href="${href(prefix,'donar.html')}">Haz un donativo ♥</a></div></div><div class="footer-main shell"><div class="footer-brand"><img src="${href(prefix,'assets/media/optimized/logos/logo-wisnton-sinfondo.webp')}" alt=""/><h3>Santuario Winston</h3><p>Un hogar donde los animales rescatados pueden volver a ser quienes son: libres, respetados y acompañados.</p><div class="social-links"><a href="https://www.instagram.com/santuario_winston/" aria-label="Instagram" target="_blank" rel="noreferrer">Instagram</a><a href="https://www.facebook.com/santuariocaballoswinston/" aria-label="Facebook" target="_blank" rel="noreferrer">Facebook</a></div></div><div><p class="footer-title">Descubre</p><a href="${href(prefix,'habitantes.html')}">Los habitantes</a><a href="${href(prefix,'guardianes.html')}">Los Guardianes</a><a href="${href(prefix,'sobre-nosotros.html')}">Nuestra historia</a><a href="${href(prefix,'transparencia.html')}">Transparencia</a><a href="${href(prefix,'blog/')}">Blog</a><a href="${href(prefix,'aprende/')}">Aprende con Winston</a><a href="${href(prefix,'actividades.html')}">Puertas abiertas</a><a href="${href(prefix,'testimonios.html')}">Testimonios</a></div><div><p class="footer-title">Participa</p><a href="${href(prefix,'como-ayudar.html')}">Cómo ayudar</a><a href="${href(prefix,'voluntariado.html')}">Voluntariado</a><a href="${href(prefix,'hazte-socio.html')}">Hazte socio</a><a href="${href(prefix,'donar.html')}">Donativos</a><a href="${href(prefix,'tienda.html')}">Tienda solidaria</a></div><div class="footer-contact"><p class="footer-title">Hablemos</p><a href="tel:+34690143920">690 14 39 20</a><a href="mailto:santuariowinston@hotmail.com">santuariowinston@hotmail.com</a><a href="${href(prefix,'contacto.html')}">La Cañada, Ávila</a></div></div><div class="footer-bottom shell"><p>Asociación sin ánimo de lucro · Registro 617583 · CIF G05236989</p><div><a href="${href(prefix,'politica-de-privacidad.html')}">Privacidad y cookies</a><span>© 2026 Santuario Winston</span></div></div></footer><div class="floating-actions"><a href="https://wa.me/34690143920" target="_blank" rel="noreferrer" aria-label="Hablar por WhatsApp"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg><span>WhatsApp</span></a></div>`;
}
