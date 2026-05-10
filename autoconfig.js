
// Trogon autoconfig v3 — new Trogon FB app 1631501404705
(function() {
  var SB_KEY = 'sb_publishable_UicuMabi1dRKAvQ4YGiakg_NCMnftfS';
  var APP_URL = 'https://trogon-app.vercel.app/app.html';
  var FB_APP_ID = '1631501404705';

  localStorage.setItem('trogon_sb_key', SB_KEY);
  if(!localStorage.getItem('trogon_groq_key')){
    localStorage.setItem('trogon_groq_key','gsk_placeholder');
  }

  document.addEventListener('DOMContentLoaded', function() {
    // Hide setup screen
    var setup = document.getElementById('setup-screen');
    if (setup) setup.style.display = 'none';
    var auth = document.getElementById('auth-screen');
    if (auth && (auth.style.display === 'none' || !auth.style.display)) auth.style.display = 'flex';

    // Override FB App ID once SDK loads
    setTimeout(function() {
      if (window.FB) {
        FB.init({appId: FB_APP_ID, cookie: true, xfbml: true, version: 'v19.0'});
        console.log('FB re-initialized with Trogon app:', FB_APP_ID);
      }
      // Re-init Supabase
      if (typeof createClient !== 'undefined') {
        try {
          window.sb = createClient('https://sazhdnqzaqpqcralmthh.supabase.co', SB_KEY);
          console.log('Supabase re-initialized');
        } catch(e) {}
      }
    }, 800);

    // Patch signInWithFacebook
    window.signInWithFacebook = async function() {
      if (typeof sb !== 'undefined') {
        var result = await sb.auth.signInWithOAuth({
          provider: 'facebook',
          options: { redirectTo: APP_URL }
        });
        if (result.error) {
          var t = window.toast || function(m){alert(m);};
          t(result.error.message, 'error');
        }
      }
    };
  });
  window._trogonReady = true;
})();
