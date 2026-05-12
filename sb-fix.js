// sb-fix.js v9 — deferred init so Supabase CDN is always loaded first
// Loaded in <head> but defers all work until DOMContentLoaded
(function() {
  var REAL_KEY = 'sb_publishable_UicuMabi1dRKAvQ4YGiakg_NCMnftfS';
  var SB_URL = 'https://sazhdnqzaqpqcralmthh.supabase.co';

  try { localStorage.setItem('trogon_sb_key', REAL_KEY); } catch(e){}

  function parseHash(hash) {
    var result = {};
    (hash || '').replace(/^#/, '').split('&').forEach(function(pair) {
      var kv = pair.split('=');
      if (kv[0]) result[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
    });
    return result;
  }

  function tryLogin(user) {
    if (typeof window.onLogin === 'function') {
      window.onLogin(user);
      return true;
    }
    return false;
  }

  function waitAndLogin(user) {
    if (!tryLogin(user)) {
      var w = setInterval(function() {
        if (tryLogin(user)) clearInterval(w);
      }, 100);
      setTimeout(function(){ clearInterval(w); }, 8000);
    }
  }

  function init() {
    // By the time DOMContentLoaded fires, all synchronous scripts have run
    // including the Supabase CDN and app.html's const sb = createClient(...)
    // We intercept FUTURE createClient calls AND patch the existing window.sb

    if (typeof supabase === 'undefined' || !supabase.createClient) {
      console.warn('[sb-fix v9] supabase not found at DOMContentLoaded');
      return;
    }

    // Patch future createClient calls to always use implicit flow
    var _original = supabase.createClient;
    supabase.createClient = function(url, key, options) {
      var opts = options || {};
      opts.auth = opts.auth || {};
      opts.auth.flowType = 'implicit';
      opts.auth.detectSessionInUrl = true;
      opts.auth.persistSession = true;
      opts.auth.autoRefreshToken = true;
      return _original.call(this, url, key, opts);
    };

    // Create a fresh sb client with implicit flow (overrides app.html's sb)
    var client = supabase.createClient(SB_URL, REAL_KEY);
    window.sb = client;

    // Handle magic link — tokens arrive in URL hash
    var hashParams = parseHash(window.location.hash);

    if (hashParams.access_token && hashParams.refresh_token) {
      // Magic link click: set session from hash tokens
      client.auth.setSession({
        access_token: hashParams.access_token,
        refresh_token: hashParams.refresh_token
      }).then(function(r) {
        if (r.data && r.data.session) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
          waitAndLogin(r.data.session.user);
        } else {
          console.warn('[sb-fix v9] setSession failed:', r.error);
        }
      });
    } else {
      // Normal load: check for existing session
      client.auth.getSession().then(function(r) {
        if (r.data && r.data.session) {
          waitAndLogin(r.data.session.user);
        }
      });
    }

    // Auth state listener — catches SIGNED_IN from any source
    client.auth.onAuthStateChange(function(event, session) {
      if (event === 'SIGNED_IN' && session) {
        waitAndLogin(session.user);
      } else if (event === 'PASSWORD_RECOVERY') {
        if (typeof window.showResetPasswordForm === 'function') {
          window.showResetPasswordForm();
        }
      }
    });

    console.log('[sb-fix v9] initialized, hash tokens present:', !!(hashParams.access_token));
  }

  // Defer until all scripts are loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // Already loaded (e.g. script injected dynamically)
    init();
  }
})();
