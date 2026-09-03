(() => {
  'use strict';

  const SUPABASE_URL = 'https://fooymzhvkmpejiafuyvq.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_MqWbSJNfvlsUF-QacUiVFw_-e1QmDh_';
  const ADMIN_ENDPOINT = `${SUPABASE_URL}/functions/v1/winston-web-admin`;
  const SPONSORS_ENDPOINT = `${SUPABASE_URL}/functions/v1/winston-sponsors-admin`;
  const CONTENT_ENDPOINT = `${SUPABASE_URL}/functions/v1/winston-content-admin`;
  const SESSION_KEY = 'winston-admin-session-v1';

  function makeError(message, code, status) {
    const error = new Error(message);
    error.code = code;
    error.status = status;
    return error;
  }

  function saveSession(session) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  function readStoredSession() {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed?.access_token || !parsed?.refresh_token || !parsed?.expires_at) {
        clearSession();
        return null;
      }
      return parsed;
    } catch {
      clearSession();
      return null;
    }
  }

  function normalizeSession(data) {
    const now = Math.floor(Date.now() / 1000);
    return {
      access_token: String(data.access_token || ''),
      refresh_token: String(data.refresh_token || ''),
      expires_at: Number(data.expires_at || (now + Number(data.expires_in || 3600))),
      user: data.user || null,
    };
  }

  async function requestJson(url, options = {}) {
    const response = await fetch(url, options);
    const payload = await response.json().catch(() => ({}));
    return { response, payload };
  }

  async function login(username, password) {
    const cleanUsername = String(username || '').trim().toLowerCase();
    const cleanPassword = String(password || '');
    if (!cleanUsername || !cleanPassword) throw makeError('Usuario o contraseña incorrectos.', 'LOGIN_FAILED', 400);

    const { response, payload } = await requestJson(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
      },
      body: JSON.stringify({
        email: `${cleanUsername}@users.santuariowinston.invalid`,
        password: cleanPassword,
      }),
    });

    if (!response.ok || !payload?.access_token) {
      clearSession();
      throw makeError('Usuario o contraseña incorrectos.', 'LOGIN_FAILED', response.status);
    }
    return saveSession(normalizeSession(payload));
  }

  async function refreshSession(currentSession) {
    const session = currentSession || readStoredSession();
    if (!session?.refresh_token) {
      clearSession();
      throw makeError('Tu sesión ha caducado. Vuelve a entrar.', 'SESSION_EXPIRED', 401);
    }

    const { response, payload } = await requestJson(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
      },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });

    if (!response.ok || !payload?.access_token) {
      clearSession();
      throw makeError('Tu sesión ha caducado. Vuelve a entrar.', 'SESSION_EXPIRED', response.status || 401);
    }
    return saveSession(normalizeSession(payload));
  }

  async function restoreSession() {
    const session = readStoredSession();
    if (!session) return null;
    const now = Math.floor(Date.now() / 1000);
    if (Number(session.expires_at) - now < 60) return refreshSession(session);
    return session;
  }

  async function call(action, payload = {}) {
    let session = await restoreSession();
    if (!session) throw makeError('Tu sesión ha caducado. Vuelve a entrar.', 'SESSION_EXPIRED', 401);

    const perform = async () => requestJson(ADMIN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action, ...payload }),
    });

    let { response, payload: result } = await perform();
    if (response.status === 401) {
      try {
        session = await refreshSession(session);
        ({ response, payload: result } = await perform());
      } catch {
        clearSession();
        throw makeError('Tu sesión ha caducado. Vuelve a entrar.', 'SESSION_EXPIRED', 401);
      }
    }

    if (!response.ok) {
      if (response.status === 401) {
        clearSession();
        throw makeError('Tu sesión ha caducado. Vuelve a entrar.', 'SESSION_EXPIRED', 401);
      }
      if (response.status === 403) {
        throw makeError('Esta cuenta no tiene acceso a Administración.', 'FORBIDDEN', 403);
      }
      throw makeError(result?.error || 'No se pudo completar la operación.', 'REQUEST_FAILED', response.status);
    }
    return result;
  }

  async function callSponsors(action, payload = {}) {
    let session = await restoreSession();
    if (!session) throw makeError('Tu sesión ha caducado. Vuelve a entrar.', 'SESSION_EXPIRED', 401);

    const perform = async () => requestJson(SPONSORS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action, ...payload }),
    });

    let { response, payload: result } = await perform();
    if (response.status === 401) {
      try {
        session = await refreshSession(session);
        ({ response, payload: result } = await perform());
      } catch {
        clearSession();
        throw makeError('Tu sesión ha caducado. Vuelve a entrar.', 'SESSION_EXPIRED', 401);
      }
    }

    if (!response.ok) {
      if (response.status === 401) {
        clearSession();
        throw makeError('Tu sesión ha caducado. Vuelve a entrar.', 'SESSION_EXPIRED', 401);
      }
      if (response.status === 403) throw makeError('Esta cuenta no tiene acceso a Padrinos.', 'FORBIDDEN', 403);
      throw makeError(result?.error || 'No se pudo completar la operación de padrinos.', 'REQUEST_FAILED', response.status);
    }
    return result;
  }

  async function callContent(action, payload = {}) {
    let session = await restoreSession();
    if (!session) throw makeError('Tu sesión ha caducado. Vuelve a entrar.', 'SESSION_EXPIRED', 401);

    const perform = async () => requestJson(CONTENT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action, ...payload }),
    });

    let { response, payload: result } = await perform();
    if (response.status === 401) {
      try {
        session = await refreshSession(session);
        ({ response, payload: result } = await perform());
      } catch {
        clearSession();
        throw makeError('Tu sesión ha caducado. Vuelve a entrar.', 'SESSION_EXPIRED', 401);
      }
    }
    if (!response.ok) {
      if (response.status === 401) { clearSession(); throw makeError('Tu sesión ha caducado. Vuelve a entrar.', 'SESSION_EXPIRED', 401); }
      if (response.status === 403) throw makeError('Esta cuenta no tiene acceso a Contenido.', 'FORBIDDEN', 403);
      throw makeError(result?.error || 'No se pudo completar la operación de contenido.', 'REQUEST_FAILED', response.status);
    }
    return result;
  }

  async function signedFile(uri) {
    return call('signed_file', { uri });
  }

  async function logout() {
    const session = readStoredSession();
    try {
      if (session?.access_token) {
        await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${session.access_token}`,
          },
        });
      }
    } catch {
      // Best effort. The browser session is cleared below even if the network is unavailable.
    } finally {
      clearSession();
    }
  }

  window.WinstonAdminApi = {
    login,
    logout,
    restoreSession,
    call,
    callSponsors,
    callContent,
    signedFile,
  };
})();
