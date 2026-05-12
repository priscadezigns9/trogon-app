// sb-fix.js v8 — intercept createClient to force implicit flow everywhere
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

  // ── Intercept supabase.createClient to inject implicit flow ──
  // Runs once the supabase CDN library is loaded, before app.html's script runs
  var patchAttempts = 0;
  var patchInterval = setInterval(function() {
    patchAttempts++;
    if (typeof supabase !== 'undefined' && supabase.createClient) {
      clearInterval(patchInterval);

      var _original = supabase.createClient;
      supabase.createClient = function(url, key, options) {
        // Force implicit flow on every client creation
        var opts = options || {};
        opts.auth = opts.auth || {};
        opts.auth.flowType = 'implicit';
        opts.auth.detectSessionInUrl = true;
        opts.auth.persistSession = true;
        opts.auth.autoRefreshToken = true;
        var client = _original.call(this, url, key, opts);
        return client;
      };

      // Also create window.sb immediately so it's available
      var client = supabase.createClient(SB_URL, REAL_KEY);
      window.sb = client;

      // Handle magic link hash tokens
      var hashParams = parseHash(window.location.hash);
      if (hashParams.access_token && hashParams.refresh_token) {
        client.auth.setSession({
          access_token: hashParams.access_token,
          refresh_token: hashParams.refresh_token
        }).then(function(r) {
          if (r.data && r.data.session) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
            waitAndLogin(r.data.session.user);
          } else {
            console.log('[sb-fix v8] setSession failed:', r.error);
          }
        });
      } else {
        client.auth.getSession().then(function(r) {
          if (r.data && r.data.session) {
            waitAndLogin(r.data.session.user);
          }
        });
      }

      // Auth state listener
      client.auth.onAuthStateChange(function(event, session) {
        if (event === 'SIGNED_IN' && session) {
          waitAndLogin(session.user);
        } else if (event === 'PASSWORD_RECOVERY') {
          if (typeof window.showResetPasswordForm === 'function') {
            window.showResetPasswordForm();
          }
        }
      });

      window.signInWithFacebook = async function() {
        var result = await window.sb.auth.signInWithOAuth({
          provider: 'facebook',
          options: { redirectTo: 'https://trogon-app.vercel.app/app.html' }
        });
        if (result.error && window.toast) window.toast(result.error.message, 'error');
      };

    }
    if (patchAttempts > 100) clearInterval(patchInterval);
  }, 50);
})();
