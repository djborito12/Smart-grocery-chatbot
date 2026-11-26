/* Register: gumagawa ng EMPLOYEE account lang. Hindi naka-link sa login page.
   Naka-save sa parehong listahan ng accounts (rb_users) na ginagamit ng index.html. */
(function () {
  const KEY_USERS = "rb_users";
  // Kapag wala pang naka-save, simulan sa default accounts para hindi mawala ang admin
  const DEFAULT_USERS = {admin: {pw: "admin123", role: "admin"}, employee: {pw: "employee123", role: "employee"}};
  const $ = id => document.getElementById(id);
  const fx = window.LoginFX, wrap = document.querySelector(".fx-wrap"), card = $("reg-form");
  let busy = false;

  function loadUsers() {
    try { const u = JSON.parse(localStorage.getItem(KEY_USERS)); if (u && typeof u === "object") return u; } catch (e) {}
    return JSON.parse(JSON.stringify(DEFAULT_USERS));
  }
  function fail(text) {
    const el = $("rg-msg"); el.className = "fx-error"; el.textContent = text;
    fx.log("[ERROR] " + text);
    card.classList.remove("shake"); void card.offsetWidth; card.classList.add("shake");
  }

  setTimeout(() => fx.log("> Opening account service...", "const team = new StaffRegistry(\"RetailBot\");", "[SECURE] Ready for a new employee."), 350);
  $("rg-user").addEventListener("change", () => { if ($("rg-user").value.trim()) fx.log("[INFO] Checking username..."); });

  card.addEventListener("submit", function (e) {
    e.preventDefault();
    if (busy) return;
    const name = $("rg-user").value.trim().toLowerCase(), pw = $("rg-pass").value, pw2 = $("rg-pass2").value;
    if (!/^[a-z0-9_.]{3,20}$/.test(name)) return fail("Username must be 3-20 characters: letters, numbers, _ or .");
    const users = loadUsers();
    if (users[name]) return fail("That username is already taken.");
    if (pw.length < 6) return fail("Password must be at least 6 characters.");
    if (pw !== pw2) return fail("The passwords don't match.");
    busy = true;
    users[name] = {pw: pw, role: "employee"};
    localStorage.setItem(KEY_USERS, JSON.stringify(users));
    $("rg-msg").textContent = "";
    wrap.classList.add("loading");
    fx.log("[PENDING] Creating account \"" + name + "\"...");
    setTimeout(() => {
      wrap.classList.remove("loading"); wrap.classList.add("ok");
      fx.log("[SUCCESS] Employee account created.", "> You can now sign in as " + name + ".");
      setTimeout(() => {
        wrap.classList.remove("ok"); card.reset(); busy = false;
        const el = $("rg-msg"); el.className = "fx-ok";
        el.innerHTML = 'Account "' + name.replace(/[&<>"']/g, "") + '" created. <a href="index.html">Sign in now</a>';
      }, 1900);
    }, 1100);
  });
})();
