// sb-fix.js v5 -- magic link + password recovery
(function() {
  var REAL_KEY = 'sb_publishable_UicuMabi1dRKAvQ4YGiakg_NCMnftfS';
  var SB_URL = 'https://sazhdnqzaqpqcralmthh.supabase.co';

  try { localStorage.setItem('trogon_sb_key', REAL_KEY); } catch(e){}

  var attempts = 0;
  var interval = setInterval(function() {
    attempts++;
    if (typeof supabase !== 'undefined' && supabase.createClient) {
      clearInterval(interval);

      var client = supabase.createClient(SB_URL, REAL_KEY, {
        auth: { detectSessionInUrl: true, persistSession: true, autoRefreshToken: true }
      });
      window.sb = client;

      window.signInWithFacebook = async function() {
        var result = await window.sb.auth.signInWithOAuth({
          provider: 'facebook',
          options: { redirectTo: 'https://trogon-app.vercel.app/app.html' }
        });
        if (result.error && window.toast) window.toast(result.error.message, 'error');
      };

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

      // Check for existing session (handles magic link token in URL hash)
      window.sb.auth.getSession().then(function(r) {
        if (r.data && r.data.session) {
          waitAndLogin(r.data.session.user);
        }
      });

      // Listen for auth events
      window.sb.auth.onAuthStateChange(function(event, session) {
        if (event === 'SIGNED_IN' && session) {
          waitAndLogin(session.user);
        } else if (event === 'PASSWORD_RECOVERY') {
          if (typeof window.showResetPasswordForm === 'function') {
            window.showResetPasswordForm();
          }
        }
      });
    }
    if (attempts > 100) clearInterval(interval);
  }, 50);
})();
