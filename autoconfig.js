
// Trogon autoconfig — runtime patch v2
(function() {
  var SB_KEY = 'sb_publishable_UicuMabi1dRKAvQ4YGiakg_NCMnftfS';
  var APP_URL = 'https://trogon-app.vercel.app/app.html';

  // 1. Seed localStorage keys
  if (!localStorage.getItem('trogon_sb_key')) {
    localStorage.setItem('trogon_sb_key', SB_KEY);
  }
  if (!localStorage.getItem('trogon_groq_key')) {
    localStorage.setItem('trogon_groq_key', 'gsk_placeholder');
  }

  // 2. Hide setup screen on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', function() {
    var setup = document.getElementById('setup-screen');
    if (setup && (setup.style.display === 'flex' || setup.style.display === '')) {
      // Only hide if auth-screen exists (i.e. we are on the login page)
      var auth = document.getElementById('auth-screen');
      if (auth) {
        setup.style.display = 'none';
        auth.style.display = 'flex';
      }
    }

    // 3. Patch signInWithFacebook to use correct redirectTo
    window._origSignInWithFacebook = window.signInWithFacebook;
    window.signInWithFacebook = async function() {
      if (typeof sb !== 'undefined') {
        var result = await sb.auth.signInWithOAuth({
          provider: 'facebook',
          options: { redirectTo: APP_URL }
        });
        if (result.error) {
          var toastFn = window.toast || function(m) { alert(m); };
          toastFn(result.error.message, 'error');
        }
      } else {
        console.error('Supabase not initialized');
      }
    };

    // 4. Also patch the Supabase client if it was initialized with wrong key
    setTimeout(function() {
      if (typeof createClient !== 'undefined' && typeof sb !== 'undefined') {
        var storedKey = localStorage.getItem('trogon_sb_key');
        if (storedKey && storedKey.startsWith('sb_')) {
          try {
            var SUPABASE_URL = 'https://sazhdnqzaqpqcralmthh.supabase.co';
            window.sb = createClient(SUPABASE_URL, storedKey);
            console.log('Supabase re-initialized with publishable key');
          } catch(e) { console.error('sb reinit failed', e); }
        }
      }
    }, 500);
  });

  window._trogonKeysReady = true;
})();
