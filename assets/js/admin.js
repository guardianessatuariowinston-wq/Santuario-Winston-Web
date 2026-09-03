(() => {
  'use strict';

  const Api = window.WinstonAdminApi;
  const loginView = document.getElementById('admin-login-view');
  const app = document.getElementById('admin-app');
  const loginForm = document.getElementById('admin-login-form');
  const loginMessage = document.getElementById('admin-login-message');
  const adminView = document.getElementById('admin-view');
  const adminStatus = document.getElementById('admin-status');
  const adminProfile = document.getElementById('admin-profile');
  const dialog = document.getElementById('admin-dialog');
  const dialogTitle = document.getElementById('admin-dialog-title');
  const dialogBody = document.getElementById('admin-dialog-body');

  const state = {
    section: 'dashboard',
    dashboard: null,
    animals: [],
    tasks: [],
    activity: [],
    documents: [],
    recognitions: [],
    contacts: [],
    sponsorDashboard: null,
    sponsors: [],
    sponsorships: [],
    sponsorPayments: [],
    sponsorIncidents: [],
    sponsorResidentSettings: [],
    publicResidents: [],
    contentDashboard: null,
    articles: [],
    contentRedirects: [],
    users: [],
    sync: null,
  };

  const contactLabels = {
    new: 'Nuevo',
    read: 'Leído',
    replied: 'Respondido',
    closed: 'Cerrado',
    spam: 'Spam',
  };

  const fieldLabels = {
    name: 'Nombre', species: 'Especie', sex: 'Sexo', breed: 'Raza', color: 'Color', age: 'Edad',
    ageEstimatedYears: 'Edad estimada', birthDate: 'Fecha de nacimiento', arrivalDate: 'Fecha de llegada',
    origin: 'Origen', location: 'Ubicación', status: 'Estado', microchip: 'Microchip', passportNumber: 'Pasaporte',
    reproductiveStatus: 'Estado reproductivo', farmId: 'Finca / ubicación interna', character: 'Carácter', care: 'Cuidados',
    diet: 'Dieta', notes: 'Notas', allergies: 'Alergias', conditions: 'Condiciones', medication: 'Medicación',
    medications: 'Pautas de medicación', treatments: 'Tratamientos', vaccinations: 'Vacunas', deworming: 'Desparasitación',
    dewormingRecords: 'Registros de desparasitación', nextVaccine: 'Próxima vacuna', nextDeworming: 'Próxima desparasitación',
    vetNext: 'Próxima revisión veterinaria', dentalNext: 'Próxima revisión dental', hoofNext: 'Próxima revisión de cascos',
    labNext: 'Próximo laboratorio', careEntries: 'Registros de cuidados', healthEntries: 'Registros de salud',
    timeline: 'Historial', documents: 'Documentos', photoUrl: 'Foto principal', photoUrls: 'Fotografías', videoUrl: 'Vídeo',
    inboxDocumentId: 'Documento de entrada relacionado', archivedAt: 'Archivado', archivedBy: 'Archivado por',
    title: 'Título', detail: 'Detalle', category: 'Categoría', priority: 'Prioridad', dueAt: 'Vencimiento',
    assignedRole: 'Rol asignado', createdBy: 'Creado por', createdRole: 'Rol creador', createdAt: 'Creado', updatedAt: 'Actualizado',
    completedAt: 'Completado', completedBy: 'Completado por', completedRole: 'Rol que completó', result: 'Resultado', note: 'Nota',
    systemGenerated: 'Generado por el sistema', systemKey: 'Clave del sistema', sourceDate: 'Fecha de origen',
    action: 'Acción', actor: 'Persona', role: 'Rol', animalId: 'ID del animal', animalName: 'Animal',
    type: 'Tipo', clinic: 'Clínica', veterinarian: 'Veterinario', reportDate: 'Fecha del informe', anatomicalArea: 'Zona anatómica',
    summary: 'Resumen', analysisResults: 'Resultados analíticos', extractedText: 'Texto extraído', extractionMethod: 'Método de extracción',
    metadata: 'Metadatos', source: 'Origen del documento', url: 'Archivo original', id: 'ID', allowPossibleDuplicate: 'Duplicado permitido',
    primaryPhotoIndex: 'Foto principal (índice)', created_at: 'Creado', privacy_accepted_at: 'Privacidad aceptada', topic: 'Tema', message: 'Mensaje',
    display_name: 'Nombre', username: 'Usuario', active: 'Activo', schemaVersion: 'Versión de esquema', initialized: 'Inicializado',
    initializedAt: 'Inicializado el', records: 'Registros', updatedAtSync: 'Última actualización',
  };

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  function isEmpty(value) {
    return value === null || value === undefined || value === '' ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === 'object' && !Array.isArray(value) && value && Object.keys(value).length === 0);
  }

  function labelFor(key) {
    return fieldLabels[key] || String(key).replace(/([a-z0-9])([A-Z])/g, '$1 $2').replaceAll('_', ' ');
  }

  function formatDate(value) {
    if (value === null || value === undefined || value === '') return '';
    let date;
    if (typeof value === 'number' || /^\d{11,}$/.test(String(value))) date = new Date(Number(value));
    else date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return escapeHtml(value);
    return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  }

  function formatMoneyCent(value) {
    const cents = Number(value || 0);
    if (!Number.isFinite(cents)) return '0,00 €';
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(cents / 100);
  }

  function maybeDate(key, value) {
    return /(date|at$|created|updated|due|next|report)/i.test(key) ? formatDate(value) : null;
  }

  function renderPrimitive(key, value) {
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    const date = maybeDate(key, value);
    if (date) return date;
    const text = String(value ?? '');
    if (text.startsWith('winston-storage://')) {
      return `<button type="button" class="file-button" data-private-uri="${escapeAttr(text)}">Abrir archivo privado</button>`;
    }
    return escapeHtml(text);
  }

  function renderComplex(value, key = '') {
    if (isEmpty(value)) return '<span class="muted-value">Sin dato</span>';
    if (typeof value !== 'object') return renderPrimitive(key, value);
    if (Array.isArray(value)) {
      return `<div class="nested-list">${value.map((item, index) =>
        `<details${index === 0 && value.length === 1 ? ' open' : ''}><summary>Registro ${index + 1}</summary>${renderComplex(item, key)}</details>`
      ).join('')}</div>`;
    }
    const entries = Object.entries(value);
    return `<dl class="kv-grid">${entries.map(([childKey, childValue]) =>
      `<dt>${escapeHtml(labelFor(childKey))}</dt><dd>${renderComplex(childValue, childKey)}</dd>`
    ).join('')}</dl>`;
  }

  function renderKeyValues(object, keys) {
    const rows = keys.filter((key) => !isEmpty(object?.[key])).map((key) =>
      `<dt>${escapeHtml(labelFor(key))}</dt><dd>${renderComplex(object[key], key)}</dd>`
    );
    return rows.length ? `<dl class="kv-grid">${rows.join('')}</dl>` : '';
  }

  function pageHead(title, lead) {
    return `<div class="admin-page-head"><div><p class="eyebrow">Panel central</p><h1>${escapeHtml(title)}</h1><p>${escapeHtml(lead)}</p></div></div>`;
  }

  function setStatus(message = '') {
    adminStatus.textContent = message;
  }

  function setActiveNavigation(section) {
    document.querySelectorAll('[data-section]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.section === section);
    });
  }

  function showLogin(message = '') {
    adminView.innerHTML = '';
    state.dashboard = null;
    app.hidden = true;
    loginView.hidden = false;
    loginMessage.textContent = message;
    document.getElementById('admin-password').value = '';
    document.getElementById('admin-username').focus();
  }

  function showApp(profile) {
    loginView.hidden = true;
    app.hidden = false;
    adminProfile.textContent = `${profile?.displayName || 'Administración'} · ${profile?.role === 'technical' ? 'Técnico' : 'Administración'}`;
  }

  async function handleAuthError(error) {
    if (error?.code === 'FORBIDDEN') {
      await Api.logout();
      showLogin('Esta cuenta no tiene acceso a Administración.');
      return true;
    }
    if (error?.code === 'SESSION_EXPIRED') {
      await Api.logout();
      showLogin('Tu sesión ha caducado. Vuelve a entrar.');
      return true;
    }
    return false;
  }

  function renderDashboard(data) {
    const c = data.counts || {};
    const activity = data.recentActivity || [];
    const documents = data.recentDocuments || [];
    return `${pageHead('Resumen', 'Una vista rápida del estado central del Santuario.')}
      <section class="metric-grid" aria-label="Resumen de datos">
        ${metric('Animales', c.animals)}
        ${metric('Tareas pendientes', c.pendingTasks)}
        ${metric('Mensajes nuevos', c.newContacts)}
        ${metric('Documentos', c.documents)}
        ${metric('Usuarios activos', c.activeUsers)}
        ${metric('Registros centrales', c.centralRecords)}
      </section>
      <section class="panel-grid">
        <article class="panel-card"><h2>Actividad reciente</h2>${renderCompactRecords(activity, 'activity')}</article>
        <article class="panel-card"><h2>Documentos recientes</h2>${renderCompactRecords(documents, 'inbox_document')}</article>
      </section>`;
  }

  function metric(label, value) {
    return `<article class="metric-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value ?? 0)}</strong></article>`;
  }

  function renderCompactRecords(records, type) {
    if (!records.length) return '<p class="empty-state">Todavía no hay registros.</p>';
    return `<div class="compact-list">${records.map((record) => {
      const p = record.payload || {};
      const title = type === 'activity' ? (p.action || p.detail || 'Actividad') : (p.name || p.category || 'Documento');
      const sub = p.animalName || p.detail || p.summary || '';
      return `<button class="list-card compact-row" type="button" data-record-type="${escapeAttr(type)}" data-record-id="${escapeAttr(record.record_id)}"><span><strong>${escapeHtml(title)}</strong><br><small>${escapeHtml(sub)}</small></span><small>${formatDate(record.updated_at)}</small></button>`;
    }).join('')}</div>`;
  }

  function renderAnimalCards(records = state.animals, query = '') {
    const q = String(query || '').trim().toLocaleLowerCase('es');
    const filtered = q ? records.filter((record) => String(record.payload?.name || '').toLocaleLowerCase('es').includes(q)) : records;
    return filtered.length ? filtered.map((record) => {
      const p = record.payload || {};
      return `<button type="button" class="list-card" data-record-type="animal" data-record-id="${escapeAttr(record.record_id)}">
        <h3>${escapeHtml(p.name || 'Animal sin nombre')}</h3>
        <p>${escapeHtml([p.species, p.breed, p.location].filter(Boolean).join(' · ') || 'Ficha central')}</p>
        <div class="list-meta"><span>${escapeHtml(p.status || 'Sin estado')}</span><span>Actualizado: ${formatDate(record.updated_at)}</span></div>
      </button>`;
    }).join('') : '<p class="empty-state">No hay animales que coincidan con la búsqueda.</p>';
  }

  function renderAnimals(records = state.animals, query = '') {
    return `${pageHead('Animales', 'Consulta completa de las fichas centrales sincronizadas.')}
      <div class="toolbar"><input id="animal-search" type="search" placeholder="Buscar por nombre" value="${escapeAttr(query)}" aria-label="Buscar animal"></div>
      <div id="animal-search-results" class="card-list">${renderAnimalCards(records, query)}</div>`;
  }

  function renderTasks(records = state.tasks) {
    return renderGenericList('Tareas', 'Avisos y tareas centrales en modo consulta.', records, 'task', (p) => p.title || p.category || 'Tarea', (p) => [p.animalName, p.status, p.priority].filter(Boolean).join(' · '));
  }

  function renderActivity(records = state.activity) {
    return renderGenericList('Actividad', 'Historial de actuaciones sincronizadas.', records, 'activity', (p) => p.action || 'Actividad', (p) => [p.animalName, p.actor, p.detail].filter(Boolean).join(' · '));
  }

  function renderDocuments(records = state.documents) {
    return renderGenericList('Documentos', 'Documentación recibida y procesada por el sistema.', records, 'inbox_document', (p) => p.name || p.category || 'Documento', (p) => [p.category, p.clinic, p.veterinarian].filter(Boolean).join(' · '));
  }

  function renderRecognitions(records = state.recognitions) {
    return renderGenericList('Reconocimientos', 'Registros de reconocimiento disponibles en la base central.', records, 'recognition', (p) => p.name || p.title || p.label || 'Reconocimiento', (p) => p.detail || p.summary || 'Contenido central disponible');
  }

  function renderGenericList(title, lead, records, type, titleFn, detailFn) {
    return `${pageHead(title, lead)}<div class="card-list">${records.length ? records.map((record) => {
      const p = record.payload || {};
      return `<button type="button" class="list-card" data-record-type="${escapeAttr(type)}" data-record-id="${escapeAttr(record.record_id)}">
        <h3>${escapeHtml(titleFn(p))}</h3><p>${escapeHtml(detailFn(p) || 'Sin detalle adicional')}</p>
        <div class="list-meta"><span>Actualizado: ${formatDate(record.updated_at)}</span></div>
      </button>`;
    }).join('') : '<p class="empty-state">No hay registros disponibles.</p>'}</div>`;
  }

  function renderContacts(contacts = state.contacts) {
    const states = ['new', 'read', 'replied', 'closed', 'spam'];
    return `${pageHead('Contacto', 'Bandeja de mensajes recibidos desde la web pública.')}
      <div class="toolbar"><select id="contact-filter" aria-label="Filtrar por estado"><option value="">Todos los estados</option>${states.map((s) => `<option value="${s}">${contactLabels[s]}</option>`).join('')}</select></div>
      <div class="card-list">${contacts.length ? contacts.map((contact) => `<article class="list-card" data-contact-card="${escapeAttr(contact.id)}">
        <div class="list-meta"><span class="status-pill">${escapeHtml(contactLabels[contact.status] || contact.status)}</span><span>${formatDate(contact.created_at)}</span></div>
        <h3>${escapeHtml(contact.name)}</h3>
        <p><strong>${escapeHtml(contact.topic)}</strong><br>${escapeHtml(contact.message)}</p>
        <div class="list-meta"><span>${escapeHtml(contact.email)}</span>${contact.phone ? `<span>${escapeHtml(contact.phone)}</span>` : ''}</div>
        <div class="contact-actions">
          <select data-contact-status="${escapeAttr(contact.id)}" aria-label="Estado del mensaje de ${escapeAttr(contact.name)}">
            ${states.map((s) => `<option value="${s}"${contact.status === s ? ' selected' : ''}>${contactLabels[s]}</option>`).join('')}
          </select>
          <button type="button" data-save-contact="${escapeAttr(contact.id)}">Guardar estado</button>
        </div>
      </article>`).join('') : '<p class="empty-state">No hay mensajes con este filtro.</p>'}</div>`;
  }

  const sponsorStatusLabels = {
    pending: 'Pendiente',
    active: 'Activo',
    payment_issue: 'Incidencia de pago',
    cancel_scheduled: 'Baja programada',
    cancelled: 'Cancelado',
  };

  async function loadPublicResidents() {
    if (state.publicResidents.length) return state.publicResidents;
    const response = await fetch('assets/data/habitantes.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('No se pudo cargar el directorio público de habitantes.');
    const rows = await response.json();
    state.publicResidents = (Array.isArray(rows) ? rows : []).map((row) => ({
      slug: String(row.slug || ''),
      name: String(row.name || ''),
    })).filter((row) => row.slug && row.name).sort((a, b) => a.name.localeCompare(b.name, 'es'));
    return state.publicResidents;
  }

  function sponsorResidentSetting(slug) {
    return state.sponsorResidentSettings.find((row) => row.resident_slug === slug) || null;
  }

  function renderManualSponsorshipForm() {
    const options = state.publicResidents.map((resident) => `<option value="${escapeAttr(resident.slug)}">${escapeHtml(resident.name)}</option>`).join('');
    return `<article class="panel-card sponsor-admin-panel"><h2>Nuevo apadrinamiento manual</h2>
      <p class="admin-help">Para padrinos históricos o aportaciones gestionadas fuera del futuro cobro automático. No crea una suscripción Stripe.</p>
      <form class="admin-form-grid" data-manual-sponsorship-form>
        <label>Nombre<input name="name" required maxlength="120"></label>
        <label>Apellidos<input name="surnames" maxlength="160"></label>
        <label>Email<input name="email" type="email" required maxlength="254"></label>
        <label>Teléfono<input name="phone" maxlength="60"></label>
        <label>Habitante<select name="residentSlug" required><option value="">Selecciona un habitante</option>${options}</select></label>
        <label>Aportación mensual (€)<input name="amountEuro" type="number" min="10" step="0.01" value="10" required></label>
        <label>Fecha de inicio<input name="startedAt" type="date"></label>
        <label>Nombre para certificado<input name="certificateName" maxlength="180"></label>
        <label class="admin-check"><input name="isGift" type="checkbox"> Es un regalo</label>
        <label class="admin-form-wide">Notas internas<input name="personNotes" maxlength="1000"></label>
        <div class="admin-form-actions admin-form-wide"><button class="primary-button" type="submit">Crear apadrinamiento manual</button></div>
      </form></article>`;
  }

  function renderSponsorshipCards() {
    if (!state.sponsorships.length) return '<p class="empty-state">Todavía no hay apadrinamientos registrados.</p>';
    return `<div class="card-list">${state.sponsorships.map((item) => {
      const person = item.sponsor_people || {};
      const fullName = [person.name, person.surnames].filter(Boolean).join(' ') || 'Padrino sin nombre';
      const canCancelManual = item.origin === 'manual' && item.status !== 'cancelled';
      const canCancelStripe = item.origin === 'stripe' && !['cancelled','cancel_scheduled'].includes(item.status);
      return `<article class="list-card sponsor-card">
        <div class="list-meta"><span class="status-pill">${escapeHtml(sponsorStatusLabels[item.status] || item.status)}</span><span>${escapeHtml(item.origin === 'manual' ? 'Manual' : 'Stripe')}</span></div>
        <h3>${escapeHtml(fullName)} · ${escapeHtml(item.resident_name_snapshot)}</h3>
        <p>${escapeHtml(person.email || '')}</p>
        <div class="list-meta"><span>${formatMoneyCent(item.importe_cent)}/mes</span><span>Inicio: ${formatDate(item.started_at || item.created_at)}</span></div>
        ${canCancelManual ? `<div class="contact-actions"><button type="button" data-cancel-manual-sponsorship="${escapeAttr(item.id)}">Dar de baja</button></div>` : ''}
        ${canCancelStripe ? `<div class="contact-actions"><button type="button" data-cancel-stripe-sponsorship="${escapeAttr(item.id)}">Programar baja al final del periodo</button></div>` : ''}
      </article>`;
    }).join('')}</div>`;
  }

  function renderSponsorPayments() {
    if (!state.sponsorPayments.length) return '<p class="empty-state">Todavía no hay pagos Stripe registrados.</p>';
    return `<div class="card-list">${state.sponsorPayments.map((payment) => {
      const sponsorship = payment.sponsorships || {};
      const person = sponsorship.sponsor_people || {};
      const name = [person.name, person.surnames].filter(Boolean).join(' ') || person.email || 'Padrino';
      const remaining = Math.max(0, Number(payment.amount_cent || 0) - Number(payment.refunded_cent || 0));
      const refundable = payment.provider === 'stripe' && payment.status === 'paid' && remaining > 0 && payment.external_payment_id;
      return `<article class="list-card sponsor-card">
        <div class="list-meta"><span class="status-pill">${escapeHtml(payment.status || '')}</span><span>${escapeHtml(payment.provider || '')}</span></div>
        <h3>${escapeHtml(name)} · ${escapeHtml(sponsorship.resident_name_snapshot || '')}</h3>
        <div class="list-meta"><span>${formatMoneyCent(payment.amount_cent)}</span><span>${formatDate(payment.paid_at || payment.created_at)}</span></div>
        ${payment.refunded_cent ? `<p>Reembolsado: ${formatMoneyCent(payment.refunded_cent)}</p>` : ''}
        ${refundable ? `<div class="contact-actions"><button type="button" data-refund-stripe-payment="${escapeAttr(payment.id)}" data-refundable-cent="${escapeAttr(remaining)}">Reembolsar</button></div>` : ''}
      </article>`;
    }).join('')}</div>`;
  }

  function renderSponsorIncidents() {
    const open = state.sponsorIncidents.filter((item) => item.status === 'open');
    if (!open.length) return '<p class="empty-state">No hay incidencias de pago abiertas.</p>';
    return `<div class="card-list">${open.map((item) => {
      const sponsorship = item.sponsorships || {};
      const person = sponsorship.sponsor_people || {};
      const name = [person.name, person.surnames].filter(Boolean).join(' ') || person.email || 'Padrino';
      return `<article class="list-card sponsor-card"><div class="list-meta"><span class="status-pill">Incidencia</span><span>${formatDate(item.opened_at)}</span></div><h3>${escapeHtml(name)} · ${escapeHtml(sponsorship.resident_name_snapshot || '')}</h3><p>${escapeHtml(item.detail || item.incident_type || '')}</p></article>`;
    }).join('')}</div>`;
  }

  function renderResidentSettingCards() {
    if (!state.publicResidents.length) return '<p class="empty-state">No se pudo cargar el directorio público.</p>';
    return `<div class="sponsor-resident-list">${state.publicResidents.map((resident) => {
      const setting = sponsorResidentSetting(resident.slug);
      const enabled = Boolean(setting?.enabled);
      return `<article class="list-card sponsor-resident-row">
        <div><h3>${escapeHtml(resident.name)}</h3><div class="list-meta"><span class="status-pill">${enabled ? 'Apadrinable' : 'No publicado'}</span><span>Mínimo: ${formatMoneyCent(setting?.minimum_amount_cent || 1000)}</span></div></div>
        <button type="button" class="file-button" data-edit-sponsor-resident="${escapeAttr(resident.slug)}">Configurar</button>
      </article>`;
    }).join('')}</div>`;
  }

  function renderSponsors() {
    const c = state.sponsorDashboard?.counts || {};
    const billingReady = Boolean(state.sponsorDashboard?.billingReady);
    const billingMode = state.sponsorDashboard?.billingMode === 'live' ? 'Producción' : (state.sponsorDashboard?.billingMode === 'test' ? 'Pruebas' : 'Pendiente de claves');
    return `${pageHead('Padrinos', 'Gestión de padrinos y configuración de habitantes, separada de los datos clínicos y operativos.')}
      <section class="metric-grid" aria-label="Resumen de padrinos">
        ${metric('Padrinos activos', c.people)}
        ${metric('Apadrinamientos activos', c.activeSponsorships)}
        ${metric('Aportación mensual', formatMoneyCent(c.monthlyCent))}
        ${metric('Incidencias', c.openIncidents)}
        ${metric('Habitantes apadrinables', c.enabledResidents)}
        ${metric('Stripe', billingReady ? `Preparado · ${billingMode}` : billingMode)}
      </section>
      ${billingReady ? '' : '<div class="admin-notice"><strong>Stripe todavía no está activado.</strong> La gestión manual funciona; el checkout público permanecerá desactivado hasta configurar las claves seguras.</div>'}
      <section class="sponsor-admin-grid">
        ${renderManualSponsorshipForm()}
        <article class="panel-card sponsor-admin-panel"><h2>Habitantes apadrinables</h2><p class="admin-help">Nada se publica automáticamente: activa y configura cada habitante cuando corresponda.</p>${renderResidentSettingCards()}</article>
      </section>
      <section class="panel-card sponsor-admin-panel sponsor-list-panel"><h2>Apadrinamientos registrados</h2>${renderSponsorshipCards()}</section>
      <section class="sponsor-admin-grid sponsor-list-panel">
        <article class="panel-card sponsor-admin-panel"><h2>Pagos</h2>${renderSponsorPayments()}</article>
        <article class="panel-card sponsor-admin-panel"><h2>Incidencias de pago</h2>${renderSponsorIncidents()}</article>
      </section>`;
  }

  function openResidentSetting(slug) {
    const resident = state.publicResidents.find((row) => row.slug === slug);
    if (!resident) return;
    const setting = sponsorResidentSetting(slug) || {};
    const suggested = Array.isArray(setting.suggested_amounts_cent) && setting.suggested_amounts_cent.length
      ? setting.suggested_amounts_cent.map((value) => Number(value) / 100).join(', ')
      : '10, 15, 25';
    dialogTitle.textContent = `Apadrinamiento · ${resident.name}`;
    dialogBody.innerHTML = `<form class="admin-form-grid" data-sponsor-resident-form data-resident-slug="${escapeAttr(slug)}">
      <label class="admin-check admin-form-wide"><input name="enabled" type="checkbox"${setting.enabled ? ' checked' : ''}> Permitir apadrinamiento público</label>
      <label>Mínimo mensual (€)<input name="minimumEuro" type="number" min="10" step="0.01" value="${escapeAttr(Number(setting.minimum_amount_cent || 1000) / 100)}" required></label>
      <label>Importes sugeridos (€)<input name="suggestedEuro" value="${escapeAttr(suggested)}" aria-describedby="suggested-help" required><small id="suggested-help">Separados por comas. Ej.: 10, 15, 25</small></label>
      <label class="admin-check"><input name="allowCustomAmount" type="checkbox"${setting.allow_custom_amount !== false ? ' checked' : ''}> Permitir otra cantidad</label>
      <label class="admin-check"><input name="showSponsorCount" type="checkbox"${setting.show_sponsor_count ? ' checked' : ''}> Mostrar número de padrinos</label>
      <label class="admin-form-wide">Mensaje público<textarea name="publicMessage" rows="4" maxlength="1200">${escapeHtml(setting.public_message || '')}</textarea></label>
      <div class="admin-form-actions admin-form-wide"><button class="primary-button" type="submit">Guardar configuración</button></div>
    </form>`;
    dialog.showModal();
  }

  async function refreshSponsorsView(message = '') {
    const [dashboard, people, sponsorships, payments, incidents, settings] = await Promise.all([
      Api.callSponsors('dashboard'),
      Api.callSponsors('sponsors'),
      Api.callSponsors('sponsorships'),
      Api.callSponsors('payments'),
      Api.callSponsors('incidents'),
      Api.callSponsors('resident_settings'),
    ]);
    state.sponsorDashboard = dashboard;
    state.sponsors = people.sponsors || [];
    state.sponsorships = sponsorships.sponsorships || [];
    state.sponsorPayments = payments.payments || [];
    state.sponsorIncidents = incidents.incidents || [];
    state.sponsorResidentSettings = settings.residents || [];
    adminView.innerHTML = renderSponsors();
    setStatus(message);
  }

  const contentKindLabels = { blog: 'Blog / Actualidad', aprende: 'Aprende con Winston', historias: 'Archivo histórico' };
  const contentStatusLabels = { draft: 'Borrador', published: 'Publicado', scheduled: 'Programado', hidden: 'Oculto' };

  function slugifyContent(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 180);
  }

  function renderContent() {
    const c = state.contentDashboard?.counts || {};
    const deployReady = Boolean(state.contentDashboard?.autoPublishConfigured);
    return `${pageHead('Contenido', 'Publica y edita Blog, Aprende con Winston y el archivo histórico sin tocar código.')}
      <section class="metric-grid" aria-label="Resumen editorial">
        ${metric('Publicados', c.published)}${metric('Borradores', c.drafts)}${metric('Programados', c.scheduled)}${metric('Total', c.total)}
      </section>
      <article class="panel-card content-publish-state"><h2>Publicación web</h2><p>${deployReady ? 'La publicación automática está conectada: al publicar u ocultar un artículo se solicita una nueva versión de la web.' : 'El editor ya guarda en Supabase. Falta configurar el Deploy Hook de Cloudflare para que el botón Publicar actualice la web automáticamente.'}</p></article>
      <div class="toolbar"><button type="button" class="primary-button" data-new-article>Nuevo artículo</button></div>
      <div class="card-list">${state.articles.length ? state.articles.map((article) => `<article class="list-card content-article-card">
        <div class="list-meta"><span class="status-pill">${escapeHtml(contentStatusLabels[article.status] || article.status)}</span><span>${escapeHtml(contentKindLabels[article.kind] || article.kind)}</span><span>${formatDate(article.updated_at)}</span></div>
        <h3>${escapeHtml(article.title)}</h3><p>${escapeHtml(article.excerpt || 'Sin resumen')}</p>
        <div class="list-meta"><span>/${escapeHtml(article.kind)}/${escapeHtml(article.slug)}/</span>${article.category ? `<span>${escapeHtml(article.category)}</span>` : ''}</div>
        <div class="contact-actions"><button type="button" data-edit-article="${escapeAttr(article.id)}">Editar</button>${article.status !== 'hidden' ? `<button type="button" data-delete-article="${escapeAttr(article.id)}">Ocultar</button>` : ''}</div>
      </article>`).join('') : '<p class="empty-state">Todavía no hay artículos. Puedes empezar recuperando contenido educativo de la web histórica.</p>'}</div>`;
  }

  async function refreshContentView(message = '') {
    const [dashboard, articles, redirects] = await Promise.all([
      Api.callContent('dashboard'), Api.callContent('articles'), Api.callContent('redirects'),
    ]);
    state.contentDashboard = dashboard;
    state.articles = articles.articles || [];
    state.contentRedirects = redirects.redirects || [];
    adminView.innerHTML = renderContent();
    setStatus(message);
  }

  function articleResidentOptions(selected = []) {
    const set = new Set(Array.isArray(selected) ? selected : []);
    return state.publicResidents.map((resident) => `<option value="${escapeAttr(resident.slug)}"${set.has(resident.slug) ? ' selected' : ''}>${escapeHtml(resident.name)}</option>`).join('');
  }

  async function openArticleEditor(id = '') {
    await loadPublicResidents();
    let article = { id: '', title: '', slug: '', kind: 'blog', excerpt: '', body_markdown: '', category: '', author_name: 'Santuario Winston', status: 'draft', scheduled_at: '', featured_image_path: '', featured_image_alt: '', seo_title: '', seo_description: '', related_resident_slugs: [], is_featured: false, source_url: '', original_published_at: '', original_author_name: '', review_note: '' };
    if (id) {
      const result = await Api.callContent('article', { id });
      article = { ...article, ...(result.article || {}) };
    }
    dialogTitle.textContent = id ? 'Editar artículo' : 'Nuevo artículo';
    dialogBody.innerHTML = `<form class="admin-form-grid content-editor-form" data-content-article-form data-article-id="${escapeAttr(article.id || '')}">
      <label class="admin-form-wide">Título<input name="title" value="${escapeAttr(article.title || '')}" maxlength="180" required data-content-title></label>
      <label>URL / slug<input name="slug" value="${escapeAttr(article.slug || '')}" maxlength="180" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required data-content-slug></label>
      <label>Sección<select name="kind"><option value="blog"${article.kind === 'blog' ? ' selected' : ''}>Blog / Actualidad</option><option value="aprende"${article.kind === 'aprende' ? ' selected' : ''}>Aprende con Winston</option><option value="historias"${article.kind === 'historias' ? ' selected' : ''}>Archivo histórico</option></select></label>
      <label>Estado<select name="status"><option value="draft"${article.status === 'draft' ? ' selected' : ''}>Borrador</option><option value="published"${article.status === 'published' ? ' selected' : ''}>Publicado</option><option value="scheduled"${article.status === 'scheduled' ? ' selected' : ''}>Programado</option><option value="hidden"${article.status === 'hidden' ? ' selected' : ''}>Oculto</option></select></label>
      <label>Programar para<input name="scheduledAt" type="datetime-local" value="${article.scheduled_at ? escapeAttr(String(article.scheduled_at).slice(0,16)) : ''}"></label>
      <label class="admin-form-wide">Resumen<textarea name="excerpt" rows="3" maxlength="500">${escapeHtml(article.excerpt || '')}</textarea></label>
      <label>Categoría<input name="category" value="${escapeAttr(article.category || '')}" maxlength="120"></label>
      <label>Autor<input name="authorName" value="${escapeAttr(article.author_name || 'Santuario Winston')}" maxlength="160"></label>
      <fieldset class="admin-form-wide content-provenance"><legend>Procedencia histórica</legend><div class="admin-form-grid">
        <label class="admin-form-wide">URL original<input name="sourceUrl" type="url" value="${escapeAttr(article.source_url || '')}" placeholder="https://santuariowinston.wordpress.com/..."></label>
        <label>Fecha original<input name="originalPublishedAt" type="datetime-local" value="${article.original_published_at ? escapeAttr(String(article.original_published_at).slice(0,16)) : ''}"></label>
        <label>Autor original<input name="originalAuthorName" value="${escapeAttr(article.original_author_name || '')}" maxlength="160"></label>
        <label class="admin-form-wide">Nota de revisión<textarea name="reviewNote" rows="3" maxlength="2000" placeholder="Uso interno: qué falta revisar antes de publicar">${escapeHtml(article.review_note || '')}</textarea></label>
      </div></fieldset>
      <div class="admin-form-wide"><span class="admin-field-label">Contenido</span><div class="markdown-toolbar" aria-label="Formato del artículo"><button type="button" data-md="h2">H2</button><button type="button" data-md="bold">Negrita</button><button type="button" data-md="list">Lista</button><button type="button" data-md="quote">Cita</button><button type="button" data-md="link">Enlace</button></div><textarea name="bodyMarkdown" rows="18" data-content-body>${escapeHtml(article.body_markdown || '')}</textarea><small class="admin-help">El editor no acepta HTML. Los botones aplican un formato seguro que después se convierte automáticamente en la página pública.</small></div>
      <label class="admin-form-wide">Imagen destacada (ruta pública)<input name="featuredImagePath" value="${escapeAttr(article.featured_image_path || '')}" placeholder="assets/media/optimized/..."></label>
      <label class="admin-form-wide">Texto alternativo de la imagen<input name="featuredImageAlt" value="${escapeAttr(article.featured_image_alt || '')}" maxlength="250"></label>
      <label class="admin-form-wide">Habitantes relacionados<select name="relatedResidentSlugs" multiple size="6">${articleResidentOptions(article.related_resident_slugs)}</select></label>
      <label class="admin-check"><input name="isFeatured" type="checkbox"${article.is_featured ? ' checked' : ''}> Artículo destacado</label>
      <label class="admin-form-wide">Título SEO<input name="seoTitle" value="${escapeAttr(article.seo_title || '')}" maxlength="180" placeholder="Si lo dejas vacío se genera automáticamente"></label>
      <label class="admin-form-wide">Descripción SEO<textarea name="seoDescription" rows="3" maxlength="320" placeholder="Si la dejas vacía se usa el resumen">${escapeHtml(article.seo_description || '')}</textarea></label>
      <div class="admin-form-actions admin-form-wide"><button class="primary-button" type="submit">Guardar artículo</button></div>
    </form>`;
    dialog.showModal();
  }

  function applyMarkdownTool(textarea, type) {
    const start = textarea.selectionStart || 0, end = textarea.selectionEnd || 0;
    const selected = textarea.value.slice(start, end) || 'texto';
    const forms = {
      h2: `## ${selected}`,
      bold: `**${selected}**`,
      list: selected.split(/\n/).map((line) => `- ${line.replace(/^[-*]\s*/, '')}`).join('\n'),
      quote: selected.split(/\n/).map((line) => `> ${line.replace(/^>\s*/, '')}`).join('\n'),
      link: `[${selected}](https://)`,
    };
    const replacement = forms[type] || selected;
    textarea.setRangeText(replacement, start, end, 'end');
    textarea.focus();
  }

  function renderUsers(users = state.users) {
    return `${pageHead('Usuarios', 'Personas con cuenta en el ecosistema, sin mostrar credenciales ni secretos.')}
      <div class="card-list">${users.length ? users.map((user) => `<article class="list-card"><h3>${escapeHtml(user.display_name || user.username || 'Usuario')}</h3>
        <p>${escapeHtml(user.username || '')}</p><div class="list-meta"><span class="status-pill">${escapeHtml(user.role)}</span><span>${user.active ? 'Activo' : 'Inactivo'}</span><span>Creado: ${formatDate(user.created_at)}</span></div></article>`).join('') : '<p class="empty-state">No hay usuarios disponibles.</p>'}</div>`;
  }

  function renderSystem(sync = state.sync) {
    const s = sync || {};
    return `${pageHead('Sistema', 'Estado operativo no sensible de la sincronización central.')}
      <section class="detail-grid"><article class="detail-section"><h3>Sincronización</h3><dl class="kv-grid">
        <dt>Inicializado</dt><dd>${s.initialized ? 'Sí' : 'No'}</dd>
        <dt>Versión de esquema</dt><dd>${escapeHtml(s.schemaVersion ?? '')}</dd>
        <dt>Registros centrales</dt><dd>${escapeHtml(s.records ?? '')}</dd>
        <dt>Inicializado el</dt><dd>${formatDate(s.initializedAt)}</dd>
        <dt>Última actualización</dt><dd>${formatDate(s.updatedAt)}</dd>
      </dl></article></section>`;
  }

  function renderAnimalDetail(payload) {
    const groups = [
      ['Identificación', ['name','species','sex','breed','color','age','ageEstimatedYears','birthDate','arrivalDate','origin','location','status','microchip','passportNumber','reproductiveStatus','farmId','character','diet','notes','archivedAt','archivedBy']],
      ['Salud', ['allergies','conditions','healthEntries','vetNext','dentalNext','hoofNext','labNext']],
      ['Medicación y tratamientos', ['medication','medications','treatments']],
      ['Vacunas y desparasitación', ['vaccinations','deworming','dewormingRecords','nextVaccine','nextDeworming']],
      ['Cuidados', ['care','careEntries']],
      ['Historial', ['timeline']],
      ['Documentos', ['documents','inboxDocumentId']],
      ['Fotos y vídeo', ['photoUrl','photoUrls','primaryPhotoIndex','videoUrl']],
    ];
    const used = new Set();
    const sections = [];
    groups.forEach(([title, keys]) => {
      keys.forEach((key) => used.add(key));
      const body = renderKeyValues(payload, keys);
      if (body) sections.push(`<section class="detail-section is-wide"><h3>${escapeHtml(title)}</h3>${body}</section>`);
    });
    const extras = Object.keys(payload || {}).filter((key) => !used.has(key) && !isEmpty(payload[key]));
    if (extras.length) sections.push(`<section class="detail-section is-wide"><h3>Otros datos de la ficha</h3>${renderKeyValues(payload, extras)}</section>`);
    return `<div class="detail-grid">${sections.join('') || '<p class="empty-state">La ficha no contiene datos.</p>'}</div>`;
  }

  function renderRecordDetail(type, payload) {
    if (type === 'animal') return renderAnimalDetail(payload || {});
    return `<div class="detail-grid"><section class="detail-section is-wide"><h3>${type === 'task' ? 'Tarea' : type === 'activity' ? 'Actividad' : type === 'inbox_document' ? 'Documento' : 'Reconocimiento'}</h3>${renderComplex(payload || {})}</section></div>`;
  }

  async function openRecordDetail(type, id) {
    setStatus('Cargando detalle…');
    try {
      const result = await Api.call('record', { recordType: type, recordId: id });
      const payload = result.record?.payload || {};
      dialogTitle.textContent = payload.name || payload.title || payload.action || payload.category || 'Detalle';
      dialogBody.innerHTML = renderRecordDetail(type, payload);
      dialog.showModal();
      setStatus('');
    } catch (error) {
      if (await handleAuthError(error)) return;
      setStatus('No se pudo abrir el registro.');
    }
  }

  async function openPrivateFile(uri, button) {
    const original = button.textContent;
    button.disabled = true;
    button.textContent = 'Abriendo…';
    try {
      const result = await Api.signedFile(uri);
      if (!result?.url) throw new Error('missing url');
      window.open(result.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      if (await handleAuthError(error)) return;
      setStatus('Documento no disponible.');
    } finally {
      button.disabled = false;
      button.textContent = original;
    }
  }

  async function renderSection(section) {
    state.section = section;
    setActiveNavigation(section);
    setStatus('Cargando…');
    try {
      if (section === 'dashboard') {
        state.dashboard = await Api.call('dashboard');
        showApp(state.dashboard.profile);
        adminView.innerHTML = renderDashboard(state.dashboard);
      } else if (section === 'animals') {
        const result = await Api.call('records', { recordType: 'animal' }); state.animals = result.records || []; adminView.innerHTML = renderAnimals();
      } else if (section === 'tasks') {
        const result = await Api.call('records', { recordType: 'task' }); state.tasks = result.records || []; adminView.innerHTML = renderTasks();
      } else if (section === 'activity') {
        const result = await Api.call('records', { recordType: 'activity' }); state.activity = result.records || []; adminView.innerHTML = renderActivity();
      } else if (section === 'documents') {
        const result = await Api.call('records', { recordType: 'inbox_document' }); state.documents = result.records || []; adminView.innerHTML = renderDocuments();
      } else if (section === 'recognitions') {
        const result = await Api.call('records', { recordType: 'recognition' }); state.recognitions = result.records || []; adminView.innerHTML = renderRecognitions();
      } else if (section === 'contacts') {
        const result = await Api.call('contacts'); state.contacts = result.contacts || []; adminView.innerHTML = renderContacts();
      } else if (section === 'sponsors') {
        await loadPublicResidents();
        await refreshSponsorsView();
      } else if (section === 'content') {
        await refreshContentView();
      } else if (section === 'users') {
        const result = await Api.call('users'); state.users = result.users || []; adminView.innerHTML = renderUsers();
      } else if (section === 'system') {
        const result = await Api.call('sync_status'); state.sync = result.sync || {}; adminView.innerHTML = renderSystem();
      }
      setStatus('');
      document.getElementById('admin-main')?.focus({ preventScroll: true });
    } catch (error) {
      if (await handleAuthError(error)) return;
      setStatus('No se pudieron cargar los datos. Pulsa de nuevo la sección para reintentar.');
      if (!state.dashboard) showLogin('No se pudo acceder al panel. Inténtalo de nuevo.');
    }
  }

  async function saveContactStatus(id) {
    const select = document.querySelector(`[data-contact-status="${CSS.escape(id)}"]`);
    if (!select) return;
    const previous = state.contacts.find((contact) => contact.id === id)?.status;
    const status = select.value;
    setStatus('Guardando estado…');
    try {
      await Api.call('set_contact_status', { id, status });
      const result = await Api.call('contacts');
      state.contacts = result.contacts || [];
      adminView.innerHTML = renderContacts();
      setStatus('Estado actualizado.');
    } catch (error) {
      if (previous) select.value = previous;
      if (await handleAuthError(error)) return;
      setStatus('No se pudo cambiar el estado. Se mantiene el valor anterior.');
    }
  }

  loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('admin-username').value;
    const password = document.getElementById('admin-password').value;
    if (!username.trim() || !password) {
      loginMessage.textContent = 'Usuario o contraseña incorrectos.';
      return;
    }
    const button = loginForm.querySelector('button[type="submit"]');
    button.disabled = true;
    loginMessage.textContent = 'Comprobando acceso…';
    try {
      await Api.login(username, password);
      state.dashboard = await Api.call('dashboard');
      loginMessage.textContent = '';
      showApp(state.dashboard.profile);
      adminView.innerHTML = renderDashboard(state.dashboard);
      state.section = 'dashboard';
      setActiveNavigation('dashboard');
    } catch (error) {
      if (error?.code === 'FORBIDDEN') {
        await Api.logout();
        showLogin('Esta cuenta no tiene acceso a Administración.');
      } else {
        await Api.logout();
        showLogin('Usuario o contraseña incorrectos.');
      }
    } finally {
      button.disabled = false;
    }
  });

  document.querySelectorAll('[data-section]').forEach((button) => {
    button.addEventListener('click', () => renderSection(button.dataset.section));
  });

  async function logoutToLogin() {
    adminView.innerHTML = '';
    if (dialog?.open) dialog.close();
    await Api.logout();
    showLogin('Sesión cerrada.');
  }

  document.getElementById('admin-logout')?.addEventListener('click', logoutToLogin);
  document.getElementById('admin-mobile-logout')?.addEventListener('click', logoutToLogin);
  document.getElementById('admin-dialog-close')?.addEventListener('click', () => dialog.close());
  dialog?.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  adminView?.addEventListener('click', (event) => {
    const recordButton = event.target.closest('[data-record-type][data-record-id]');
    if (recordButton) {
      openRecordDetail(recordButton.dataset.recordType, recordButton.dataset.recordId);
      return;
    }
    const fileButton = event.target.closest('[data-private-uri]');
    if (fileButton) {
      openPrivateFile(fileButton.dataset.privateUri, fileButton);
      return;
    }
    const editSponsorResident = event.target.closest('[data-edit-sponsor-resident]');
    if (editSponsorResident) {
      openResidentSetting(editSponsorResident.dataset.editSponsorResident);
      return;
    }
    const cancelManual = event.target.closest('[data-cancel-manual-sponsorship]');
    if (cancelManual) {
      const id = cancelManual.dataset.cancelManualSponsorship;
      if (!window.confirm('¿Dar de baja este apadrinamiento manual? El historial se conservará.')) return;
      setStatus('Dando de baja…');
      Api.callSponsors('cancel_manual_sponsorship', { id })
        .then(() => refreshSponsorsView('Apadrinamiento dado de baja.'))
        .catch(async (error) => {
          if (await handleAuthError(error)) return;
          setStatus(error?.message || 'No se pudo dar de baja el apadrinamiento.');
        });
      return;
    }
    const cancelStripe = event.target.closest('[data-cancel-stripe-sponsorship]');
    if (cancelStripe) {
      const id = cancelStripe.dataset.cancelStripeSponsorship;
      if (!window.confirm('¿Programar la baja al final del periodo ya pagado? El historial se conservará.')) return;
      setStatus('Programando baja…');
      Api.callSponsors('schedule_stripe_cancellation', { id })
        .then(() => refreshSponsorsView('Baja Stripe programada al final del periodo.'))
        .catch(async (error) => {
          if (await handleAuthError(error)) return;
          setStatus(error?.message || 'No se pudo programar la baja.');
        });
      return;
    }
    const refundStripe = event.target.closest('[data-refund-stripe-payment]');
    if (refundStripe) {
      const id = refundStripe.dataset.refundStripePayment;
      const refundableCent = Number(refundStripe.dataset.refundableCent || 0);
      const suggested = (refundableCent / 100).toFixed(2).replace('.', ',');
      const raw = window.prompt(`Importe a reembolsar en euros (máximo ${suggested} €):`, suggested);
      if (raw === null) return;
      const amountCent = Math.round(Number(String(raw).replace(',', '.')) * 100);
      if (!Number.isInteger(amountCent) || amountCent <= 0 || amountCent > refundableCent) {
        setStatus('Importe de reembolso no válido.');
        return;
      }
      if (!window.confirm(`¿Solicitar a Stripe el reembolso de ${formatMoneyCent(amountCent)}?`)) return;
      setStatus('Solicitando reembolso…');
      Api.callSponsors('refund_stripe_payment', { id, amountCent })
        .then(() => refreshSponsorsView('Reembolso solicitado. Stripe confirmará el estado mediante webhook.'))
        .catch(async (error) => {
          if (await handleAuthError(error)) return;
          setStatus(error?.message || 'No se pudo solicitar el reembolso.');
        });
      return;
    }
    const newArticle = event.target.closest('[data-new-article]');
    if (newArticle) { openArticleEditor().catch((error) => setStatus(error?.message || 'No se pudo abrir el editor.')); return; }
    const editArticle = event.target.closest('[data-edit-article]');
    if (editArticle) { openArticleEditor(editArticle.dataset.editArticle).catch((error) => setStatus(error?.message || 'No se pudo abrir el artículo.')); return; }
    const deleteArticle = event.target.closest('[data-delete-article]');
    if (deleteArticle) {
      if (!window.confirm('¿Ocultar este artículo de la web? Se conservará en el historial editorial.')) return;
      setStatus('Ocultando artículo…');
      Api.callContent('delete_article', { id: deleteArticle.dataset.deleteArticle })
        .then(() => refreshContentView('Artículo ocultado.'))
        .catch(async (error) => { if (await handleAuthError(error)) return; setStatus(error?.message || 'No se pudo ocultar el artículo.'); });
      return;
    }
    const contactButton = event.target.closest('[data-save-contact]');
    if (contactButton) saveContactStatus(contactButton.dataset.saveContact);
  });

  dialogBody?.addEventListener('click', (event) => {
    const fileButton = event.target.closest('[data-private-uri]');
    if (fileButton) { openPrivateFile(fileButton.dataset.privateUri, fileButton); return; }
    const mdButton = event.target.closest('[data-md]');
    if (mdButton) {
      const textarea = dialogBody.querySelector('[data-content-body]');
      if (textarea) applyMarkdownTool(textarea, mdButton.dataset.md);
    }
  });

  adminView?.addEventListener('submit', async (event) => {
    const form = event.target.closest('[data-manual-sponsorship-form]');
    if (!form) return;
    event.preventDefault();
    const data = new FormData(form);
    const residentSlug = String(data.get('residentSlug') || '');
    const resident = state.publicResidents.find((row) => row.slug === residentSlug);
    const amount = Math.round(Number(data.get('amountEuro')) * 100);
    if (!resident || !Number.isInteger(amount) || amount < 1000) {
      setStatus('Revisa el habitante y la aportación mensual.');
      return;
    }
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    setStatus('Creando apadrinamiento…');
    try {
      await Api.callSponsors('create_manual_sponsorship', {
        name: data.get('name'),
        surnames: data.get('surnames'),
        email: data.get('email'),
        phone: data.get('phone'),
        residentSlug,
        residentName: resident.name,
        amountCent: amount,
        startedAt: data.get('startedAt') || undefined,
        certificateName: data.get('certificateName'),
        isGift: data.get('isGift') === 'on',
        personNotes: data.get('personNotes'),
      });
      await refreshSponsorsView('Apadrinamiento manual creado.');
    } catch (error) {
      if (await handleAuthError(error)) return;
      setStatus(error?.message || 'No se pudo crear el apadrinamiento.');
    } finally {
      button.disabled = false;
    }
  });

  dialogBody?.addEventListener('submit', async (event) => {
    const contentForm = event.target.closest('[data-content-article-form]');
    if (contentForm) {
      event.preventDefault();
      const data = new FormData(contentForm);
      const button = contentForm.querySelector('button[type="submit"]');
      button.disabled = true;
      setStatus('Guardando artículo…');
      try {
        const relatedResidentSlugs = Array.from(contentForm.querySelector('[name="relatedResidentSlugs"]')?.selectedOptions || []).map((option) => option.value);
        const result = await Api.callContent('save_article', {
          id: contentForm.dataset.articleId || undefined,
          title: data.get('title'), slug: data.get('slug'), kind: data.get('kind'), status: data.get('status'), scheduledAt: data.get('scheduledAt') || undefined,
          excerpt: data.get('excerpt'), category: data.get('category'), authorName: data.get('authorName'), bodyMarkdown: data.get('bodyMarkdown'),
          featuredImagePath: data.get('featuredImagePath'), featuredImageAlt: data.get('featuredImageAlt'), relatedResidentSlugs,
          isFeatured: data.get('isFeatured') === 'on', seoTitle: data.get('seoTitle'), seoDescription: data.get('seoDescription'),
          sourceUrl: data.get('sourceUrl'), originalPublishedAt: data.get('originalPublishedAt') || undefined, originalAuthorName: data.get('originalAuthorName'), reviewNote: data.get('reviewNote'),
        });
        dialog.close();
        await refreshContentView(result?.deploy?.triggered ? 'Artículo guardado y publicación solicitada.' : 'Artículo guardado.');
      } catch (error) {
        if (await handleAuthError(error)) return;
        setStatus(error?.message || 'No se pudo guardar el artículo.');
      } finally { button.disabled = false; }
      return;
    }
    const form = event.target.closest('[data-sponsor-resident-form]');
    if (!form) return;
    event.preventDefault();
    const slug = form.dataset.residentSlug;
    const resident = state.publicResidents.find((row) => row.slug === slug);
    if (!resident) return;
    const data = new FormData(form);
    const minimumAmountCent = Math.round(Number(data.get('minimumEuro')) * 100);
    const suggestedAmountsCent = String(data.get('suggestedEuro') || '')
      .split(',')
      .map((value) => Math.round(Number(value.trim().replace(',', '.')) * 100))
      .filter((value) => Number.isInteger(value) && value >= 1000);
    if (!Number.isInteger(minimumAmountCent) || minimumAmountCent < 1000 || !suggestedAmountsCent.length) {
      setStatus('Revisa el mínimo y los importes sugeridos.');
      return;
    }
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    setStatus('Guardando configuración…');
    try {
      await Api.callSponsors('save_resident_setting', {
        residentSlug: slug,
        displayName: resident.name,
        enabled: data.get('enabled') === 'on',
        minimumAmountCent,
        suggestedAmountsCent,
        allowCustomAmount: data.get('allowCustomAmount') === 'on',
        showSponsorCount: data.get('showSponsorCount') === 'on',
        publicMessage: data.get('publicMessage'),
      });
      dialog.close();
      await refreshSponsorsView('Configuración de apadrinamiento guardada.');
    } catch (error) {
      if (await handleAuthError(error)) return;
      setStatus(error?.message || 'No se pudo guardar la configuración.');
    } finally {
      button.disabled = false;
    }
  });

  dialogBody?.addEventListener('input', (event) => {
    if (event.target.matches('[data-content-title]')) {
      const slug = dialogBody.querySelector('[data-content-slug]');
      if (slug && !slug.dataset.touched) slug.value = slugifyContent(event.target.value);
    }
    if (event.target.matches('[data-content-slug]')) event.target.dataset.touched = '1';
  });

  adminView?.addEventListener('input', (event) => {
    if (event.target.id === 'animal-search') {
      const results = document.getElementById('animal-search-results');
      if (results) results.innerHTML = renderAnimalCards(state.animals, event.target.value);
    }
  });

  adminView?.addEventListener('change', async (event) => {
    if (event.target.id === 'contact-filter') {
      setStatus('Aplicando filtro…');
      try {
        const result = await Api.call('contacts', event.target.value ? { status: event.target.value } : {});
        state.contacts = result.contacts || [];
        adminView.innerHTML = renderContacts();
        const freshFilter = document.getElementById('contact-filter');
        if (freshFilter) freshFilter.value = event.target.value;
        setStatus('');
      } catch (error) {
        if (await handleAuthError(error)) return;
        setStatus('No se pudo aplicar el filtro.');
      }
    }
  });

  async function bootstrap() {
    if (!Api) {
      showLogin('No se pudo cargar el acceso seguro.');
      return;
    }
    try {
      const session = await Api.restoreSession();
      if (!session) {
        showLogin('');
        return;
      }
      state.dashboard = await Api.call('dashboard');
      showApp(state.dashboard.profile);
      adminView.innerHTML = renderDashboard(state.dashboard);
      setActiveNavigation('dashboard');
    } catch (error) {
      if (await handleAuthError(error)) return;
      await Api.logout();
      showLogin('No se pudo recuperar la sesión. Vuelve a entrar.');
    }
  }

  bootstrap();
})();
