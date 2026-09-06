(() => {
  const script = document.currentScript;
  const siteRoot = script?.src ? new URL('../../', script.src) : new URL('./', location.href);
  const CHAT_ENDPOINT = 'https://fooymzhvkmpejiafuyvq.supabase.co/functions/v1/winston-chat';
  const SESSION_KEY = 'winston_chat_session_v1';
  const MAX_HISTORY = 6;
  const MAX_MESSAGE = 500;

  const STATE_ASSET = {
    'idle': 'winston-chat-idle.webp',
    'hello': 'winston-chat-hello.webp',
    'thinking': 'winston-chat-thinking.webp',
    'answer': 'winston-chat-answer.webp',
    'error': 'winston-chat-idle.webp',
  };

  const QUICK_ACTIONS = [
    ['Conoce a mis amigos', 'habitantes.html'],
    ['Quiero apadrinar', 'apadrina.html'],
    ['Aprende conmigo', 'aprende/'],
    ['Cómo ayudar', 'como-ayudar.html'],
    ['Voluntariado', 'voluntariado.html'],
    ['Teaming', 'teaming.html'],
    ['Contacto', 'contacto.html'],
  ];

  function safeInternalUrl(value) {
    try {
      const raw = String(value || '').trim();
      if (!raw) return null;
      const normalized = raw.startsWith('/') ? raw.slice(1) : raw;
      const url = new URL(normalized, siteRoot);
      if (url.origin !== location.origin) return null;
      if (!url.pathname.startsWith(siteRoot.pathname)) return null;
      return url.href;
    } catch {
      return null;
    }
  }

  function loadHistory() {
    try {
      const parsed = JSON.parse(sessionStorage.getItem(SESSION_KEY) || '[]');
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((item) => item && (item.role === 'user' || item.role === 'assistant') && typeof item.text === 'string')
        .map((item) => ({ role: item.role, text: item.text.slice(0, MAX_MESSAGE) }))
        .slice(-MAX_HISTORY);
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      return [];
    }
  }

  function mount() {
    if (document.querySelector('[data-winston-chat-root]')) return;

    const state = { history: loadHistory(), pending: false };
    const root = document.createElement('aside');
    root.setAttribute('data-winston-chat-root', '1');
    root.className = 'winston-chat-root';

    const launcher = document.createElement('button');
    launcher.type = 'button';
    launcher.className = 'winston-chat-launcher';
    launcher.setAttribute('data-winston-chat-launcher', '1');
    launcher.setAttribute('aria-expanded', 'false');
    launcher.setAttribute('aria-controls', 'winston-chat-panel');
    const launcherImage = document.createElement('img');
    launcherImage.alt = '';
    launcherImage.width = 72;
    launcherImage.height = 72;
    const launcherLabel = document.createElement('span');
    launcherLabel.textContent = '¿Te ayudo?';
    launcher.append(launcherImage, launcherLabel);

    const panel = document.createElement('section');
    panel.id = 'winston-chat-panel';
    panel.className = 'winston-chat-panel';
    panel.setAttribute('data-winston-chat-panel', '1');
    panel.hidden = true;

    const mascot = document.createElement('img');
    mascot.className = 'winston-chat-mascot';
    mascot.alt = 'Winston, guía del Santuario';
    mascot.width = 96;
    mascot.height = 112;

    const header = document.createElement('div');
    header.className = 'winston-chat-head';
    const heading = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = 'Winston';
    const subtitle = document.createElement('span');
    subtitle.textContent = 'Tu guía del Santuario';
    heading.append(title, subtitle);
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'winston-chat-close';
    close.setAttribute('aria-label', 'Minimizar a Winston');
    close.textContent = '×';
    header.append(mascot, heading, close);

    const messages = document.createElement('div');
    messages.className = 'winston-chat-messages';
    messages.setAttribute('aria-live', 'polite'); // aria-live="polite"
    messages.setAttribute('aria-label', 'Conversación con Winston');

    const welcome = document.createElement('p');
    welcome.className = 'winston-chat-message winston-chat-message-assistant';
    welcome.textContent = '¡Hola! Soy Winston. ¿Qué quieres descubrir?';
    messages.append(welcome);

    const actions = document.createElement('div');
    actions.className = 'winston-chat-actions';
    QUICK_ACTIONS.forEach(([label, href]) => {
      const link = document.createElement('a');
      link.href = new URL(href, siteRoot).href;
      link.textContent = label;
      actions.append(link);
    });

    const prompt = document.createElement('p');
    prompt.className = 'winston-chat-prompt';
    prompt.textContent = 'O pregúntame algo…';

    const form = document.createElement('form');
    form.className = 'winston-chat-form';
    const inputLabel = document.createElement('label');
    inputLabel.className = 'sr-only';
    inputLabel.setAttribute('for', 'winston-chat-input');
    inputLabel.textContent = 'Pregunta para Winston';
    const input = document.createElement('textarea');
    input.id = 'winston-chat-input';
    input.className = 'winston-chat-input';
    input.rows = 2;
    input.maxLength = MAX_MESSAGE;
    input.placeholder = 'Escribe tu pregunta…';
    input.setAttribute('aria-describedby', 'winston-chat-hint');
    const send = document.createElement('button');
    send.type = 'submit';
    send.className = 'winston-chat-send winston-chat-control';
    send.textContent = 'Enviar';
    const hint = document.createElement('small');
    hint.id = 'winston-chat-hint';
    hint.className = 'winston-chat-hint';
    hint.textContent = 'Santuario Winston, animales y bienestar animal.';
    form.append(inputLabel, input, send, hint);

    const resultActions = document.createElement('div');
    resultActions.className = 'winston-chat-result-actions';
    resultActions.setAttribute('aria-label', 'Enlaces relacionados');

    panel.append(header, messages, actions, prompt, form, resultActions);
    root.append(launcher, panel);
    document.body.append(root);

    function persistHistory() {
      state.history = state.history.slice(-MAX_HISTORY);
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(state.history));
      } catch {
        // La conversación sigue funcionando aunque sessionStorage no esté disponible.
      }
    }

    function appendMessage(role, text, persist = true) {
      const clean = String(text || '').trim().slice(0, MAX_MESSAGE * 4);
      if (!clean) return;
      const item = document.createElement('p');
      item.className = `winston-chat-message winston-chat-message-${role}`;
      item.textContent = clean;
      messages.append(item);
      messages.scrollTop = messages.scrollHeight;
      if (persist && (role === 'user' || role === 'assistant')) {
        state.history.push({ role, text: clean.slice(0, MAX_MESSAGE) });
        persistHistory();
      }
    }

    function renderRestoredHistory() {
      for (const item of state.history) appendMessage(item.role, item.text, false);
    }

    function setWinstonState(nextState) {
      const safe = Object.hasOwn(STATE_ASSET, nextState) ? nextState : 'idle';
      root.dataset.state = safe;
      const src = new URL(`assets/media/mascota/${STATE_ASSET[safe]}`, siteRoot).href;
      mascot.src = src;
      launcherImage.src = src;
    }

    function clearResultActions() {
      resultActions.replaceChildren();
    }

    function renderSources(sources) {
      if (!Array.isArray(sources)) return;
      for (const source of sources.slice(0, 3)) {
        const href = safeInternalUrl(source?.url);
        if (!href) continue;
        const link = document.createElement('a');
        link.href = href;
        link.className = 'winston-chat-related-link';
        link.textContent = source?.title ? `Fuente: ${String(source.title).slice(0, 80)}` : 'Ver información relacionada';
        resultActions.append(link);
      }
    }

    function renderSuggestedActions(items) {
      if (!Array.isArray(items)) return;
      for (const item of items.slice(0, 3)) {
        const href = safeInternalUrl(item?.url);
        if (!href) continue;
        const link = document.createElement('a');
        link.href = href;
        link.className = 'winston-chat-related-link winston-chat-related-link-primary';
        link.textContent = String(item?.label || 'Ver más').slice(0, 80);
        resultActions.append(link);
      }
    }

    function historyBeforeCurrentUserMessage() {
      return state.history.slice(0, -1).slice(-MAX_HISTORY);
    }

    async function askWinston(message) {
      const clean = String(message || '').trim().slice(0, MAX_MESSAGE);
      if (!clean || state.pending) return;

      appendMessage('user', clean);
      input.value = '';
      clearResultActions();
      setWinstonState('thinking');
      state.pending = true;
      send.disabled = true;
      input.disabled = true;
      const thinking = document.createElement('p');
      thinking.className = 'winston-chat-thinking';
      thinking.textContent = 'Estoy pensando…';
      messages.append(thinking);
      messages.scrollTop = messages.scrollHeight;

      try {
        const signal = typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
          ? AbortSignal.timeout(13000)
          : (() => { const controller = new AbortController(); setTimeout(() => controller.abort(), 13000); return controller.signal; })();
        const response = await fetch(CHAT_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: clean,
            history: historyBeforeCurrentUserMessage(),
            page: { path: location.pathname, title: document.title.slice(0, 160) },
          }),
          signal,
        });
        const payload = await response.json().catch(() => ({}));
        thinking.remove();

        if (!response.ok) {
          let errorText = 'No he podido responder ahora mismo. Puedes reintentar o usar los accesos rápidos.';
          if (response.status === 429) errorText = 'He recibido muchas preguntas seguidas. Prueba de nuevo dentro de unos minutos.';
          else if (payload?.error === 'AI_NOT_CONFIGURED') errorText = payload?.message || 'Ahora mismo puedo guiarte por la web, pero las preguntas libres todavía no están activadas.';
          else if (typeof payload?.message === 'string' && payload.message.trim()) errorText = payload.message;
          appendMessage('assistant', errorText);
          setWinstonState('error');
          return;
        }

        appendMessage('assistant', payload?.answer || 'No he podido encontrar una respuesta clara.');
        renderSuggestedActions(payload?.suggestedActions || []);
        renderSources(payload?.sources || []);
        setWinstonState('answer');
      } catch {
        thinking.remove();
        appendMessage('assistant', 'No he podido responder ahora mismo. Puedes reintentar o usar los accesos rápidos.');
        setWinstonState('error');
      } finally {
        state.pending = false;
        send.disabled = false;
        input.disabled = false;
        if (!panel.hidden) input.focus();
      }
    }

    const setOpen = (open) => {
      panel.hidden = !open;
      launcher.setAttribute('aria-expanded', open ? 'true' : 'false');
      setWinstonState(open ? 'hello' : 'idle');
      if (open) requestAnimationFrame(() => input.focus());
      else launcher.focus();
    };

    renderRestoredHistory();
    setWinstonState('idle');

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      askWinston(input.value);
    });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        form.requestSubmit();
      }
    });
    launcher.addEventListener('click', () => setOpen(panel.hidden));
    close.addEventListener('click', () => setOpen(false));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !panel.hidden) setOpen(false);
    });
  }

  window.WinstonChat = { mount };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
