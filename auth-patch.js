
// Trogon Auth Patch - handles magic links and password reset
(function() {
  // Re-check session from URL hash on page load
  async function checkUrlSession() {
    const hash = window.location.hash;
    if (!hash) return;
    
    // Let Supabase process the hash tokens
    const { data: { session }, error } = await sb.auth.getSession();
    if (session && session.user) {
      await onLogin(session.user);
    }
  }
  
  // Override onAuthStateChange to handle recovery
  const origOnAuth = sb.auth.onAuthStateChange.bind(sb.auth);
  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === "PASSWORD_RECOVERY") {
      showResetPasswordForm();
    } else if (event === "SIGNED_IN" && session) {
      await onLogin(session.user);
    }
  });
  
  // Run on load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", checkUrlSession);
  } else {
    setTimeout(checkUrlSession, 500);
  }
  
  window.showResetPasswordForm = function() {
    document.getElementById("auth-screen").style.display = "flex";
    var box = document.getElementById("auth-box-inner") || document.querySelector(".auth-box");
    if (box) box.innerHTML = "<div class='auth-title' style='color:#fff;font-size:1.3rem;font-weight:700;margin-bottom:16px'>Set New Password</div><input type='password' id='new-pw' placeholder='New password' style='width:100%;padding:14px;border-radius:10px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.07);color:#fff;font-size:0.95rem;margin-bottom:12px;box-sizing:border-box'><input type='password' id='confirm-pw' placeholder='Confirm password' style='width:100%;padding:14px;border-radius:10px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.07);color:#fff;font-size:0.95rem;margin-bottom:16px;box-sizing:border-box'><button onclick='window.doPasswordUpdate()' style='width:100%;padding:14px;border-radius:10px;background:#7C3AED;color:#fff;font-weight:700;border:none;cursor:pointer'>Update Password</button><div id='reset-msg' style='margin-top:12px;color:#aaa;font-size:0.85rem;text-align:center'></div>";
  };
  
  window.doPasswordUpdate = async function() {
    var pw = document.getElementById("new-pw").value;
    var pw2 = document.getElementById("confirm-pw").value;
    var msg = document.getElementById("reset-msg");
    if (!pw || pw.length < 6) { msg.textContent = "Min 6 characters."; return; }
    if (pw !== pw2) { msg.textContent = "Passwords do not match."; return; }
    msg.textContent = "Updating...";
    var r = await sb.auth.updateUser({ password: pw });
    if (r.error) { msg.textContent = r.error.message; }
    else { msg.textContent = "Done! Signing you in..."; setTimeout(function(){ window.location.reload(); }, 1500); }
  };
})();
