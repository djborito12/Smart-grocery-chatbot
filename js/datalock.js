/* RetailBot: password lock for Data Management.
   Loads AFTER extra.js. Wraps dataView() and logout() without editing them. */
const KEY_DPW = "rb_data_pw";
let dataUnlocked = false;

const _dataViewOriginal = dataView;
const _logoutOriginal = logout;

// Lock again when the user logs out
logout = function () { dataUnlocked = false; _logoutOriginal(); };

// Replace dataView: show lock screen first, real page only when unlocked
dataView = function () {
  if (dataUnlocked) {
    _dataViewOriginal();
    $("view").insertAdjacentHTML("beforeend", dataSecurityCard());
  } else {
    lockView();
  }
};

function lmsg(t, ok) {
  const el = $("dlmsg");
  if (el) el.innerHTML = '<div class="msg ' + (ok ? "ok" : "err") + '">' + esc(t) + "</div>";
}

function lockView() {
  const has = !!localStorage.getItem(KEY_DPW);
  const enter = ' onkeydown="if(event.key===\'Enter\')submitLock()"';
  $("view").innerHTML =
    head("Data Management", "Locked. Enter the Data Management password to continue.") +
    '<div id="dlmsg"></div>' +
    '<div class="card"><h3>' + (has ? "Unlock Data Management" : "Create a Data Management password") + "</h3>" +
    (has ? "" : '<p class="muted">First time here. Choose a password (at least 6 characters). You will be asked for it every time you open this page.</p>') +
    '<div class="form-row"><div><label>' + (has ? "Password" : "New password") + '</label><input id="dl-pw" type="password" autocomplete="off"' + enter + "></div>" +
    (has ? "" : '<div><label>Confirm password</label><input id="dl-pw2" type="password" autocomplete="off"' + enter + "></div>") +
    '<div><button class="btn" onclick="submitLock()">' + (has ? "Unlock" : "Save password") + "</button></div></div>" +
    (has ? '<div class="row" style="margin-top:12px"><button class="btn sm sec" onclick="forgotDataPw()">Forgot password?</button></div>' : "") +
    "</div>";
  const f = $("dl-pw"); if (f) f.focus();
}

function submitLock() {
  const saved = localStorage.getItem(KEY_DPW), pw = $("dl-pw").value;
  if (saved) {
    if (pw !== saved) { $("dl-pw").value = ""; return lmsg("Wrong password."); }
    dataUnlocked = true; dataView();
  } else {
    if (pw.length < 6) return lmsg("Password must be at least 6 characters.");
    if (pw !== $("dl-pw2").value) return lmsg("The two passwords do not match.");
    localStorage.setItem(KEY_DPW, pw);
    dataUnlocked = true; dataView();
  }
}

function forgotDataPw() {
  const p = prompt("Type your admin LOGIN password (" + user.name + ") to reset the Data Management password:");
  if (p === null) return;
  if (!USERS[user.name] || USERS[user.name].pw !== p) return lmsg("Wrong login password.");
  localStorage.removeItem(KEY_DPW);
  lockView();
  lmsg("Reset done. Create a new Data Management password.", true);
}

function dataSecurityCard() {
  return '<div class="card"><h3>Data Management security</h3><div id="dpmsg"></div><div class="form-row">' +
    '<div><label>Current password</label><input id="dp-o" type="password" autocomplete="off"></div>' +
    '<div><label>New password</label><input id="dp-n" type="password" autocomplete="off"></div>' +
    '<div><button class="btn" onclick="changeDataPw()">Change password</button></div></div>' +
    '<div class="row" style="margin-top:12px"><button class="btn sec" onclick="lockDataNow()">Lock now</button></div></div>';
}

function changeDataPw() {
  const el = $("dpmsg"), say = (t, ok) => { el.innerHTML = '<div class="msg ' + (ok ? "ok" : "err") + '">' + esc(t) + "</div>"; };
  const o = $("dp-o").value, n = $("dp-n").value;
  if (o !== localStorage.getItem(KEY_DPW)) return say("Current password is wrong.");
  if (n.length < 6) return say("New password must be at least 6 characters.");
  localStorage.setItem(KEY_DPW, n);
  $("dp-o").value = $("dp-n").value = "";
  say("Data Management password updated.", true);
}

function lockDataNow() { dataUnlocked = false; dataView(); }
