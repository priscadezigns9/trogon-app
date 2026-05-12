// Trogon Auth + Stripe Patch v2
(function() {
  var STRIPE_LINKS = {
    pro: {
      monthly: 'https://buy.stripe.com/test_cNi3cu2IYdcY0Q7eme2sM05',
      annual:  'https://buy.stripe.com/test_eVq28qerG1ugdCT7XQ2sM06'
    },
    agency: {
      monthly: 'https://buy.stripe.com/test_7sYeVc3N2c8UfL11zs2sM07',
      annual:  'https://buy.stripe.com/test_9B68wOabq6OA42j1zs2sM08'
    }
  };

  window.handlePlanSelect = function(plan) {
    if (plan === 'free') {
      if (typeof toast === 'function') toast("You're on the Free plan - enjoy!");
      return;
    }
    var billing = window._annualBilling ? 'annual' : 'monthly';
    var links = STRIPE_LINKS[plan];
    if (links && links[billing]) { window.location.href = links[billing]; }
  };

  async function checkUrlSession() {
    var hash = window.location.hash;
    if (!hash || hash.indexOf('access_token') < 0) return;
    try {
      var result = await window.sb.auth.getSession();
      if (result && result.data && result.data.session && result.data.session.user) {
        if (typeof onLogin === 'function') await onLogin(result.data.session.user);
      }
    } catch(e) { console.log('auth-patch error:', e); }
  }

  window.sb.auth.onAuthStateChange(async function(event, session) {
    if (event === 'PASSWORD_RECOVERY') {
      if (typeof window.showResetPasswordForm === 'function') window.showResetPasswordForm();
    } else if (event === 'SIGNED_IN' && session) {
      if (typeof onLogin === 'function') await onLogin(session.user);
    }
  });

  window.showResetPasswordForm = function() {
    var s = document.getElementById('auth-screen');
    if (s) s.style.display = 'flex';
    var box = document.querySelector('.auth-box');
    if (!box) return;
    box.innerHTML = '<div style="color:#fff;font-size:1.3rem;font-weight:700;margin-bottom:16px">Set New Password</div>'
      + '<input type="password" id="new-pw" placeholder="New password" style="width:100%;padding:14px;border-radius:10px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.07);color:#fff;margin-bottom:12px;box-sizing:border-box">'
      + '<input type="password" id="confirm-pw" placeholder="Confirm password" style="width:100%;padding:14px;border-radius:10px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.07);color:#fff;margin-bottom:16px;box-sizing:border-box">'
      + '<button onclick="window.doPasswordUpdate()" style="width:100%;padding:14px;border-radius:10px;background:#7C3AED;color:#fff;font-weight:700;border:none;cursor:pointer">Update Password</button>'
      + '<div id="reset-msg" style="margin-top:12px;color:#aaa;font-size:0.85rem;text-align:center"></div>';
  };

  window.doPasswordUpdate = async function() {
    var pw = document.getElementById('new-pw').value;
    var pw2 = document.getElementById('confirm-pw').value;
    var msg = document.getElementById('reset-msg');
    if (!pw || pw.length < 6) { msg.textContent = 'Min 6 characters.'; return; }
    if (pw !== pw2) { msg.textContent = 'Passwords do not match.'; return; }
    msg.textContent = 'Updating...';
    var r = await window.sb.auth.updateUser({ password: pw });
    if (r.error) { msg.textContent = r.error.message; }
    else { msg.textContent = 'Done! Signing you in...'; setTimeout(function(){ window.location.reload(); }, 1500); }
  };

  if (window.location.search.indexOf('payment=success') >= 0) {
    setTimeout(function() {
      if (typeof toast === 'function') toast('Payment successful - welcome to Pro!');
      window.history.replaceState(null, '', window.location.pathname + window.location.hash);
    }, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkUrlSession);
  } else {
    setTimeout(checkUrlSession, 600);
  }
})();