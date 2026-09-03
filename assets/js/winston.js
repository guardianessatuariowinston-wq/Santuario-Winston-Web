(() => {
  const drawer = document.querySelector('.mobile-drawer');
  const menuToggle = document.querySelector('.menu-toggle');
  const drawerBackdrop = document.querySelector('.drawer-backdrop');
  const drawerClose = document.querySelector('.drawer-head button');

  const setMenuOpen = (open) => {
    if (!drawer) return;
    drawer.classList.toggle('is-open', open);
    drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    menuToggle?.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuToggle?.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    if (open) {
      drawerClose?.focus();
    } else if (document.activeElement === drawerClose || drawer.contains(document.activeElement)) {
      menuToggle?.focus();
    }
  };

  menuToggle?.addEventListener('click', () => setMenuOpen(true));
  drawerBackdrop?.addEventListener('click', () => setMenuOpen(false));
  drawerClose?.addEventListener('click', () => setMenuOpen(false));
  drawer?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenuOpen(false)));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && drawer?.classList.contains('is-open')) setMenuOpen(false);
  });

  document.querySelectorAll('.photo-carousel').forEach((carousel) => {
    const track = carousel.querySelector('.photo-track');
    const buttons = carousel.querySelectorAll('.carousel-controls button');
    buttons[0]?.addEventListener('click', () => track?.scrollBy({ left: -(track.clientWidth * 0.82), behavior: 'smooth' }));
    buttons[1]?.addEventListener('click', () => track?.scrollBy({ left: track.clientWidth * 0.82, behavior: 'smooth' }));
  });

  const input = document.querySelector('.search-field input');
  const cards = [...document.querySelectorAll('.resident-card')];
  const filterButtons = [...document.querySelectorAll('.filter-pills button')];
  let period = 'Todos';
  const applyFilters = () => {
    const query = (input?.value || '').toLocaleLowerCase('es');
    let visible = 0;
    cards.forEach((card) => {
      const text = card.textContent.toLocaleLowerCase('es');
      const date = card.querySelector('.resident-date')?.textContent || '';
      const year = Number((date.match(/20\d{2}/) || ['0'])[0]);
      const inPeriod = period === 'Todos' ||
        (period === '2011–2015' && year && year <= 2015) ||
        (period === '2016–2019' && year >= 2016 && year <= 2019) ||
        (period === '2020–hoy' && year >= 2020);
      const show = inPeriod && (!query || text.includes(query));
      card.hidden = !show;
      if (show) visible += 1;
    });
    const count = document.querySelector('.result-count');
    if (count) count.lastChild.textContent = ` ${visible} historias`;
  };
  input?.addEventListener('input', applyFilters);
  filterButtons.forEach((button) => button.addEventListener('click', () => {
    filterButtons.forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    period = button.textContent.trim();
    applyFilters();
  }));


  const CONTACT_ENDPOINT = 'https://fooymzhvkmpejiafuyvq.supabase.co/functions/v1/contact-winston';
  const CONTACT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvb3ltemh2a21wZWppYWZ1eXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNTY4NzMsImV4cCI6MjEwMzkzMjg3M30.F34uxsv9xIrZQlDdqJczh5uF3ja1OvpnAE-Qfx0fzgQ';

  async function submitContactForm(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement) || !form.reportValidity()) return;

    const status = document.getElementById('contact-form-status');
    const submitButton = form.querySelector('button[type="submit"]');
    const privacy = form.querySelector('input[name="privacyAccepted"]');
    const data = new FormData(form);
    const payload = {
      name: data.get('name'),
      email: data.get('email'),
      phone: data.get('phone'),
      topic: data.get('topic'),
      message: data.get('message'),
      website: data.get('website'),
      privacyAccepted: privacy instanceof HTMLInputElement && privacy.checked,
    };

    form.setAttribute('aria-busy', 'true');
    if (submitButton instanceof HTMLButtonElement) submitButton.disabled = true;
    if (status) status.innerHTML = '<strong>Enviando…</strong> Estamos registrando tu mensaje de forma segura.';

    try {
      const response = await fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': CONTACT_ANON_KEY,
          'Authorization': `Bearer ${CONTACT_ANON_KEY}`,
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok !== true) throw new Error(result.error || 'No se pudo enviar el mensaje.');

      form.reset();
      const reference = result.reference ? ` Referencia: ${result.reference}.` : '';
      if (status) status.innerHTML = `<strong>Mensaje enviado.</strong> Gracias por contactar con el Santuario.${reference}`;
    } catch (error) {
      const detail = error instanceof Error ? error.message : '';
      if (status) status.innerHTML = `<strong>No hemos podido enviar el mensaje.</strong> ${detail || 'Inténtalo de nuevo en unos minutos o utiliza WhatsApp/correo.'}`;
    } finally {
      form.removeAttribute('aria-busy');
      if (submitButton instanceof HTMLButtonElement) submitButton.disabled = false;
    }
  }

  document.querySelector('.contact-form[data-contact-status="ready"]')?.addEventListener('submit', submitContactForm);

  document.querySelectorAll('.video-feature button').forEach((button) => button.addEventListener('click', () => {
    const video = button.closest('.video-feature')?.querySelector('video');
    if (!video) return;
    if (video.paused) video.play(); else video.pause();
  }));
})();
