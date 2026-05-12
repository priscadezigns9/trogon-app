// sb-fix.js v7 — implicit flow, reliable magic link handling
(function() {
  var REAL_KEY = 'sb_publishable_UicuMabi1dRKAvQ4YGiakg_NCMnftfS';
  var SB_URL = 'https://sazhdnqzaqpqcralmthh.supabase.co';

  try { localStorage.setItem('trogon_sb_key', REAL_KEY); } catch(e){}

  // Parse hash fragment into key/value pairs
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

  var attempts = 0;
  var interval = setInterval(function() {
    attempts++;
    if (typeof supabase !== 'undefined' && supabase.createClient) {
      clearInterval(interval);

      var client = supabase.createClient(SB_URL, REAL_KEY, {
        auth: {
          detectSessionInUrl: true,
          persistSession: true,
          autoRefreshToken: true,
          flowType: 'implicit'
        }
      });
      window.sb = client;

      // ── Magic link / OTP: manually exchange hash tokens ──
      var hashParams = parseHash(window.location.hash);
      if (hashParams.access_token && hashParams.refresh_token) {
        // Implicit flow: set session directly from hash tokens
        client.auth.setSession({
          access_token: hashParams.access_token,
          refresh_token: hashParams.refresh_token
        }).then(function(r) {
          if (r.data && r.data.session) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
            waitAndLogin(r.data.session.user);
          } else {
            console.log('[sb-fix v7] setSession failed:', r.error);
          }
        });
      } else {
        // No hash tokens — check for existing session
        client.auth.getSession().then(function(r) {
          if (r.data && r.data.session) {
            waitAndLogin(r.data.session.user);
          }
        });
      }

      // Auth state listener as backup
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
    if (attempts > 100) clearInterval(interval);
  }, 50);
})();
