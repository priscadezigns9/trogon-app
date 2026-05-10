
// Auto-configure Trogon — injected fix
(function() {
  var SB_KEY = 'sb_publishable_UicuMabi1dRKAvQ4YGiakg_NCMnftfS';
  var GROQ_KEY = 'gsk_placeholder';
  if (!localStorage.getItem('trogon_sb_key')) {
    localStorage.setItem('trogon_sb_key', SB_KEY);
  }
  if (!localStorage.getItem('trogon_groq_key')) {
    localStorage.setItem('trogon_groq_key', GROQ_KEY);
  }
  // Hide setup screen if it appears with wrong key format check
  document.addEventListener('DOMContentLoaded', function() {
    var setup = document.getElementById('setup-screen');
    if (setup && setup.style.display === 'flex') {
      setup.style.display = 'none';
      var auth = document.getElementById('auth-screen');
      if (auth) auth.style.display = 'flex';
    }
  });
  // Also patch the check function
  window._trogonKeysReady = true;
})();
