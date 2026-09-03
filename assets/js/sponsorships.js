(() => {
  'use strict';

  const SUPABASE_URL = 'https://fooymzhvkmpejiafuyvq.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_MqWbSJNfvlsUF-QacUiVFw_-e1QmDh_';
  const ENDPOINT = `${SUPABASE_URL}/functions/v1/winston-sponsors-public`;
  const root = document.querySelector('[data-sponsorship-checkout]');
  if (!root) return;

  const form = root.querySelector('form');
  const residentSelect = root.querySelector('[name="residentSlug"]');
  const amountSelect = root.querySelector('[name="amountPreset"]');
  const customAmount = root.querySelector('[name="customAmountEuro"]');
  const customWrap = root.querySelector('[data-custom-amount-wrap]');
  const message = root.querySelector('[data-sponsorship-message]');
  const submit = form?.querySelector('button[type="submit"]');
  const systemNote = document.querySelector('[data-sponsorship-status="pre-stripe"] .sponsorship-system-note p');
  const state = { residents: [], billingReady: false };

  function setMessage(text, kind = '') {
    if (!message) return;
    message.textContent = text || '';
    message.dataset.kind = kind;
  }

  function euro(cent) {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Number(cent || 0) / 100);
  }

  async function request(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        apikey: SUPABASE_KEY,
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error || 'No se pudo completar la operación.');
    return payload;
  }

  function selectedResident() {
    return state.residents.find((row) => row.residentSlug === residentSelect?.value) || null;
  }

  function renderAmounts() {
    if (!amountSelect) return;
    const resident = selectedResident();
    amountSelect.innerHTML = '';
    if (!resident) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'Selecciona primero un habitante';
      amountSelect.append(option);
      amountSelect.disabled = true;
      if (customWrap) customWrap.hidden = true;
      return;
    }
    amountSelect.disabled = false;
    for (const cent of resident.suggestedAmountsCent || []) {
      const option = document.createElement('option');
      option.value = String(cent);
      option.textContent = `${euro(cent)} al mes`;
      amountSelect.append(option);
    }
    if (resident.allowCustomAmount) {
      const option = document.createElement('option');
      option.value = 'custom';
      option.textContent = 'Otra cantidad';
      amountSelect.append(option);
    }
    if (customWrap) customWrap.hidden = amountSelect.value !== 'custom';
    if (customAmount) customAmount.min = String(Number(resident.minimumAmountCent || 1000) / 100);
    const detail = [];
    if (resident.publicMessage) detail.push(resident.publicMessage);
    if (resident.sponsorCount !== null && resident.sponsorCount !== undefined) detail.push(`${resident.sponsorCount} padrino${resident.sponsorCount === 1 ? '' : 's'} actualmente.`);
    detail.push(`Aportación mínima: ${euro(resident.minimumAmountCent)} al mes.`);
    setMessage(detail.join(' '));
  }

  function renderResidents() {
    if (!residentSelect) return;
    residentSelect.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = state.residents.length ? 'Selecciona un habitante' : 'No hay habitantes activados para apadrinamiento online';
    residentSelect.append(placeholder);
    for (const resident of state.residents) {
      const option = document.createElement('option');
      option.value = resident.residentSlug;
      option.textContent = resident.displayName;
      residentSelect.append(option);
    }
    const requested = new URLSearchParams(window.location.search).get('habitante');
    if (requested && state.residents.some((row) => row.residentSlug === requested)) residentSelect.value = requested;
    residentSelect.disabled = !state.residents.length || !state.billingReady;
    if (submit) submit.disabled = !state.residents.length || !state.billingReady;
    renderAmounts();
  }

  async function bootstrap() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      setMessage('Hemos recibido el retorno del pago seguro. Estamos confirmando el apadrinamiento con Stripe; no cierres una segunda suscripción si tarda unos instantes.', 'success');
    } else if (params.get('checkout') === 'cancelled') {
      setMessage('El proceso de pago se canceló y no se ha confirmado un nuevo apadrinamiento.', 'info');
    } else {
      setMessage('Cargando habitantes disponibles…');
    }
    try {
      const payload = await request(ENDPOINT, { method: 'GET' });
      state.residents = Array.isArray(payload.residents) ? payload.residents : [];
      state.billingReady = Boolean(payload.billingReady);
      renderResidents();
      if (systemNote) {
        systemNote.innerHTML = state.billingReady
          ? '<strong>Apadrinamiento online activo:</strong> puedes elegir un habitante y completar el pago mensual mediante la página segura de Stripe. El formulario oficial continúa disponible como alternativa.'
          : '<strong>Nuevo sistema de padrinos:</strong> estamos preparando la gestión directa del apadrinamiento mensual desde esta web. Mientras finalizamos el cobro automático, el formulario oficial sigue siendo la vía disponible.';
      }
      if (!state.billingReady) setMessage('El cobro online todavía no está activado. Puedes utilizar mientras tanto el formulario oficial del Santuario.', 'info');
      else if (!state.residents.length) setMessage('Todavía no hay habitantes activados para apadrinamiento online. Puedes utilizar el formulario oficial.', 'info');
    } catch (error) {
      setMessage(error?.message || 'No se pudo cargar el sistema de apadrinamiento. Utiliza el formulario oficial.', 'error');
      if (submit) submit.disabled = true;
    }
  }

  residentSelect?.addEventListener('change', renderAmounts);
  amountSelect?.addEventListener('change', () => {
    if (customWrap) customWrap.hidden = amountSelect.value !== 'custom';
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const resident = selectedResident();
    if (!resident || !state.billingReady) return;
    const data = new FormData(form);
    const amountCent = amountSelect?.value === 'custom'
      ? Math.round(Number(String(data.get('customAmountEuro') || '').replace(',', '.')) * 100)
      : Number(amountSelect?.value || 0);
    if (!Number.isInteger(amountCent) || amountCent < Number(resident.minimumAmountCent || 1000)) {
      setMessage(`La aportación mínima para ${resident.displayName} es ${euro(resident.minimumAmountCent)} al mes.`, 'error');
      return;
    }
    if (data.get('privacyAccepted') !== 'on') {
      setMessage('Debes aceptar la información de privacidad para continuar.', 'error');
      return;
    }
    if (submit) submit.disabled = true;
    setMessage('Preparando el pago seguro con Stripe…');
    try {
      const payload = await request(ENDPOINT, {
        method: 'POST',
        body: JSON.stringify({
          action: 'checkout',
          residentSlug: resident.residentSlug,
          amountCent,
          name: data.get('name'),
          surnames: data.get('surnames'),
          email: data.get('email'),
          phone: data.get('phone'),
          country: data.get('country'),
          certificateName: data.get('certificateName'),
          marketingOptIn: data.get('marketingOptIn') === 'on',
          privacyAccepted: true,
        }),
      });
      if (!payload?.url || !String(payload.url).startsWith('https://checkout.stripe.com/')) throw new Error('Stripe no devolvió una página de pago válida.');
      window.location.assign(payload.url);
    } catch (error) {
      setMessage(error?.message || 'No se pudo iniciar el pago seguro. Puedes utilizar el formulario oficial.', 'error');
      if (submit) submit.disabled = false;
    }
  });

  bootstrap();
})();
