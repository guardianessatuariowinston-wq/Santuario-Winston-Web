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
    const contactButton = event.target.closest('[data-save-contact]');
    if (contactButton) saveContactStatus(contactButton.dataset.saveContact);
  });

  dialogBody?.addEventListener('click', (event) => {
    const fileButton = event.target.closest('[data-private-uri]');
    if (fileButton) openPrivateFile(fileButton.dataset.privateUri, fileButton);
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
