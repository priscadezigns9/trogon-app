// sb-fix.js v3 — real key + getSession fallback for OAuth redirect
(function() {
  var REAL_KEY = 'sb_publishable_UicuMabi1dRKAvQ4YGiakg_NCMnftfS';
  var SB_URL = 'https://sazhdnqzaqpqcralmthh.supabase.co';

  // Set localStorage immediately
  localStorage.setItem('trogon_sb_key', REAL_KEY);

  // After page loads, ensure sb is initialized and check for existing session
  window.addEventListener('DOMContentLoaded', function() {
    var attempts = 0;
    var interval = setInterval(function() {
      attempts++;

      if (typeof supabase !== 'undefined' && supabase.createClient) {
        // Re-create sb with real key to ensure it's correct
        var client = supabase.createClient(SB_URL, REAL_KEY, {
          auth: {
            detectSessionInUrl: true,
            persistSession: true,
            autoRefreshToken: true
          }
        });
        window.sb = client;
        console.log('[Trogon] sb initialized with real key');

        // Patch signInWithFacebook
        window.signInWithFacebook = async function() {
          var result = await window.sb.auth.signInWithOAuth({
            provider: 'facebook',
            options: { redirectTo: 'https://trogon-app.vercel.app/app.html' }
          });
          if (result.error) {
            console.error('[Trogon] FB login error:', result.error);
            if (window.toast) window.toast(result.error.message, 'error');
          }
        };

        // Check if there's already a session (e.g. after OAuth redirect)
        // This handles the case where onAuthStateChange fires before our patch
        window.sb.auth.getSession().then(function(result) {
          if (result.data && result.data.session && result.data.session.user) {
            console.log('[Trogon] Session found via getSession, logging in...');
            if (typeof window.onLogin === 'function') {
              window.onLogin(result.data.session.user);
            }
          } else {
            console.log('[Trogon] No active session');
          }
        });

        // Re-register onAuthStateChange with the fixed client
        window.sb.auth.onAuthStateChange(function(event, session) {
          console.log('[Trogon] Auth event:', event);
          if (event === 'SIGNED_IN' && session) {
            if (typeof window.onLogin === 'function') {
              window.onLogin(session.user);
            }
          }
        });

        clearInterval(interval);
      }

      if (attempts > 30) clearInterval(interval);
    }, 200);
  });
})();
