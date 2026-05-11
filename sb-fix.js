// Supabase key fix + FB App ID fix
(function() {
  var REAL_KEY = 'sb_publishable_UicuMabi1dRKAvQ4YGiakg_NCMnftfS';
  var SB_URL = 'https://sazhdnqzaqpqcralmthh.supabase.co';
  var FB_APP_ID = '1631501404795356';

  localStorage.setItem('trogon_sb_key', REAL_KEY);

  window.addEventListener('DOMContentLoaded', function() {
    var attempts = 0;
    var interval = setInterval(function() {
      attempts++;
      var sbReady = typeof supabase !== 'undefined' && supabase.createClient;
      if (sbReady) {
        window.sb = supabase.createClient(SB_URL, REAL_KEY);
        console.log('[Trogon] sb initialized with real key');

        if (window.FB) {
          window.FB.init({appId: FB_APP_ID, cookie: true, xfbml: true, version: 'v19.0'});
          console.log('[Trogon] FB re-init with', FB_APP_ID);
        }

        window.signInWithFacebook = async function() {
          var client = window.sb || supabase.createClient(SB_URL, REAL_KEY);
          var result = await client.auth.signInWithOAuth({
            provider: 'facebook',
            options: { redirectTo: 'https://trogon-app.vercel.app/app.html' }
          });
          if (result.error) {
            console.error('[Trogon] FB login error:', result.error);
            if (window.toast) window.toast(result.error.message, 'error');
            else alert(result.error.message);
          }
        };
        console.log('[Trogon] All patches applied');
        clearInterval(interval);
      }
      if (attempts > 30) clearInterval(interval);
    }, 200);
  });
})();
