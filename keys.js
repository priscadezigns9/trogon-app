// Trogon keys + runtime patch
(function(){
  var SB_URL = 'https://sazhdnqzaqpqcralmthh.supabase.co';
  var SB_KEY = 'sb_publishable_UicuMabi1dRKAvQ4YGiakg_NCMnftfS';
  var FB_APP_ID = '1631501404705';
  var APP_URL = 'https://trogon-app.vercel.app/app.html';

  // Expose globals for app
  window.TROGON_SB_KEY = SB_KEY;
  window.TROGON_FB_APP_ID = FB_APP_ID;

  // Set localStorage
  localStorage.setItem('trogon_sb_key', SB_KEY);

  // Override FB_APP_ID constant as soon as DOM is ready
  // and re-init after SDK loads
  function applyPatches() {
    // 1. Fix Supabase client - re-init with real key
    if (typeof window.createClient === 'function') {
      try {
        window.sb = window.createClient(SB_URL, SB_KEY);
        console.log('[Trogon] Supabase initialized with real key');
      } catch(e){ console.warn('[Trogon] sb init failed', e); }
    }

    // 2. Fix FB SDK - re-init with Trogon app ID
    if (window.FB && window.FB.init) {
      window.FB.init({appId: FB_APP_ID, cookie: true, xfbml: true, version: 'v19.0'});
      console.log('[Trogon] FB SDK re-initialized with app', FB_APP_ID);
    }

    // 3. Patch signInWithFacebook
    window.signInWithFacebook = async function() {
      var client = window.sb;
      if (!client && typeof window.createClient === 'function') {
        client = window.createClient(SB_URL, SB_KEY);
        window.sb = client;
      }
      if (client) {
        var res = await client.auth.signInWithOAuth({
          provider: 'facebook',
          options: { redirectTo: APP_URL }
        });
        if (res.error) {
          var t = window.toast || function(m){ alert(m); };
          t(res.error.message, 'error');
        }
      } else {
        console.error('[Trogon] Supabase not available for FB login');
      }
    };
    console.log('[Trogon] signInWithFacebook patched');
  }

  // Apply immediately if DOM ready, else wait
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(applyPatches, 600); });
  } else {
    setTimeout(applyPatches, 600);
  }
})();
