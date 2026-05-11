// sb-fix.js v4
(function() {
  var REAL_KEY = 'sb_publishable_UicuMabi1dRKAvQ4YGiakg_NCMnftfS';
  var SB_URL = 'https://sazhdnqzaqpqcralmthh.supabase.co';

  // Set localStorage immediately so app.html line 1598 reads the real key
  try { localStorage.setItem('trogon_sb_key', REAL_KEY); } catch(e){}

  // Poll for supabase SDK to be ready (runs immediately, no DOMContentLoaded)
  var attempts = 0;
  var interval = setInterval(function() {
    attempts++;
    if (typeof supabase !== 'undefined' && supabase.createClient) {
      clearInterval(interval);

      // Create fresh sb client with real key
      var client = supabase.createClient(SB_URL, REAL_KEY, {
        auth: { detectSessionInUrl: true, persistSession: true, autoRefreshToken: true }
      });
      window.sb = client;

      // Patch signInWithFacebook
      window.signInWithFacebook = async function() {
        var result = await window.sb.auth.signInWithOAuth({
          provider: 'facebook',
          options: { redirectTo: 'https://trogon-app.vercel.app/app.html' }
        });
        if (result.error && window.toast) window.toast(result.error.message, 'error');
      };

      // Handle OAuth callback: check for session
      window.sb.auth.getSession().then(function(r) {
        if (r.data && r.data.session) {
          if (typeof window.onLogin === 'function') {
            window.onLogin(r.data.session.user);
          } else {
            // onLogin not ready yet, wait for it
            var wait = setInterval(function() {
              if (typeof window.onLogin === 'function') {
                clearInterval(wait);
                window.onLogin(r.data.session.user);
              }
            }, 100);
            setTimeout(function(){ clearInterval(wait); }, 5000);
          }
        }
      });

      // Listen for future auth changes
      window.sb.auth.onAuthStateChange(function(event, session) {
        if (event === 'SIGNED_IN' && session && typeof window.onLogin === 'function') {
          window.onLogin(session.user);
        }
      });
    }
    if (attempts > 100) clearInterval(interval);
  }, 50);
})();
