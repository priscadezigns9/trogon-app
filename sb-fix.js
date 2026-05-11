// Supabase key fix — injected by Trogon bootstrap
(function() {
  var REAL_KEY = 'sb_publishable_UicuMabi1dRKAvQ4YGiakg_NCMnftfS';
  var SB_URL = 'https://sazhdnqzaqpqcralmthh.supabase.co';

  // Set in localStorage so app.html line 1598 picks it up
  localStorage.setItem('trogon_sb_key', REAL_KEY);

  // Also patch window so if createClient runs before this, we fix it after
  window.addEventListener('DOMContentLoaded', function() {
    // Wait for supabase SDK to load
    var attempts = 0;
    var interval = setInterval(function() {
      attempts++;
      if (typeof supabase !== 'undefined' && supabase.createClient) {
        // Re-create sb with real key
        window.sb = supabase.createClient(SB_URL, REAL_KEY);
        console.log('[Trogon] sb fixed with real key');
        
        // Also patch signInWithFacebook to use fixed sb
        var orig = window.signInWithFacebook;
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
        console.log('[Trogon] signInWithFacebook patched');
        clearInterval(interval);
      }
      if (attempts > 20) clearInterval(interval);
    }, 200);
  });
})();
