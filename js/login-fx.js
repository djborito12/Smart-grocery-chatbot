/* Login / Register animation (parang video):
   - Kalawakan na may kumikislap na bituin (canvas)
   - Terminal na nagta-type ng logs habang naglo-login
   - Pag-success: liwanag sa gilid ng card, particles, berdeng check, tapos papasok sa system
   - Pag-mali: uuga ang card, pulang error sa terminal */
(function () {
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = id => document.getElementById(id);

  // ---------- 1. Kalawakan (stars + particles) ----------
  const cv = $("space"), ctx = cv ? cv.getContext("2d") : null;
  let W = 0, H = 0, stars = [], parts = [], running = false;
  function size() {
    if (!cv) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(W * H / 6500);
    stars = Array.from({length: n}, () => ({x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.4 + .2,
      p: Math.random() * Math.PI * 2, s: .6 + Math.random() * 1.6, v: .02 + Math.random() * .08,
      c: Math.random() < .16 ? "245,165,36" : Math.random() < .3 ? "190,242,100" : "255,255,255"}));
  }
  function frame(t) {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    for (const s of stars) {
      s.y -= s.v; if (s.y < -2) { s.y = H + 2; s.x = Math.random() * W; }
      const a = reduce ? .7 : .35 + .65 * Math.abs(Math.sin(s.p + t / 1000 * s.s));
      ctx.fillStyle = "rgba(" + s.c + "," + a + ")";
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life -= 1; if (p.life <= 0) { parts.splice(i, 1); continue; }
      const ang = Math.atan2(p.y - p.cy, p.x - p.cx);       // umiikot palabas
      p.vx += Math.cos(ang + 1.57) * .06; p.vy += Math.sin(ang + 1.57) * .06;
      p.vx *= .985; p.vy *= .985; p.x += p.vx; p.y += p.vy;
      const a = Math.min(1, p.life / 40);
      ctx.fillStyle = "rgba(" + p.c + "," + a + ")";
      ctx.shadowColor = "rgba(" + p.c + ",1)"; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
      ctx.shadowBlur = 0;
    }
    requestAnimationFrame(frame);
  }
  function burst(el) {
    if (!cv || reduce) return;
    const r = el.getBoundingClientRect(), cr = cv.getBoundingClientRect(), cx = r.left + r.width / 2 - cr.left, cy = r.top + r.height / 2 - cr.top;
    const cols = ["245,165,36", "163,230,53", "123,228,149", "252,213,138"];
    for (let i = 0; i < 170; i++) {
      // nagsisimula sa gilid ng card
      const side = Math.random() * 4 | 0, u = Math.random();
      const x = side === 0 ? r.left + u * r.width : side === 1 ? r.right : side === 2 ? r.left + u * r.width : r.left;
      const y = side === 0 ? r.top : side === 1 ? r.top + u * r.height : side === 2 ? r.bottom : r.top + u * r.height;
      const ang = Math.atan2(y - r.top - r.height / 2, x - r.left - r.width / 2), sp = .6 + Math.random() * 2.4;
      parts.push({x: x - cr.left, y: y - cr.top, cx: cx, cy: cy, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
        r: .8 + Math.random() * 2, life: 60 + Math.random() * 70, c: cols[Math.random() * cols.length | 0]});
    }
  }
  if (cv) { size(); window.addEventListener("resize", size); running = true; requestAnimationFrame(frame); }

  // ---------- 2. Terminal na nagta-type ----------
  const logEl = $("fx-log");
  let queue = [], typing = false, onIdle = [];
  const tagClass = t => { const m = t.match(/^\[(SECURE|INFO|PENDING|SUCCESS|ERROR|TOKEN|SYSTEM|STATUS)\]/); return m ? "t-" + m[1].toLowerCase() : /^>/.test(t) ? "t-cmd" : "t-code"; };
  function log(...lines) { lines.forEach(l => queue.push(l)); if (!typing) next(); }
  function next() {
    if (!logEl) return;
    if (!queue.length) { typing = false; const cbs = onIdle; onIdle = []; cbs.forEach(f => f()); return; }
    typing = true;
    const text = queue.shift(), row = document.createElement("div");
    row.className = "ln " + tagClass(text.trim());
    logEl.appendChild(row);
    while (logEl.children.length > 8) logEl.removeChild(logEl.firstChild);
    if (reduce) { row.textContent = text; return setTimeout(next, 60); }
    let i = 0;
    const step = () => { i = Math.min(text.length, i + 2); row.textContent = text.slice(0, i); if (i < text.length) setTimeout(step, 14); else setTimeout(next, 120); };
    step();
  }
  const whenIdle = f => { if (!typing && !queue.length) f(); else onIdle.push(f); };
  function clearLog() { queue = []; onIdle = []; if (logEl) logEl.innerHTML = ""; typing = false; }

  // ---------- 3. Mga event ng login form ----------
  const wrap = document.querySelector(".fx-wrap"), card = document.querySelector(".fx-card");
  const flags = {};
  function boot(lines) { clearLog(); Object.keys(flags).forEach(k => delete flags[k]); setTimeout(() => log(...lines), 350); }
  function once(key, ...lines) { if (!flags[key]) { flags[key] = 1; log(...lines); } }
  function hex() { return "0x" + Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, "0"); }

  const BOOT_LOGIN = ["> Initializing system modules...", "const auth = new Authenticator(\"RetailBot\");", "[SECURE] Establishing handshakes..."];
  const u = $("lg-user"), p = $("lg-pass");
  if (u && p) {
    boot(BOOT_LOGIN);
    u.addEventListener("input", () => once("u", "await auth.connect();"));
    p.addEventListener("input", () => once("p", "[INFO] Parsing credentials..."));
  }

  // ---------- 4. Pagpasok sa system: lumalaki ang card at nagiging welcome screen ----------
  const escH = t => String(t).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
  function storeChips(role) {
    const out = [];
    try {
      const d = new Date(), k = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
      out.push(["Products", Object.keys(products).length]);
      const td = sales.filter(s => !s.void && s.t.slice(0, 10) === k);
      if (role === "admin") {
        out.push(["Sales today", "₱" + td.reduce((a, s) => a + s.total, 0).toLocaleString("en-PH")]);
        if (typeof storeAlerts === "function") out.push(["Alerts", storeAlerts().length]);
      } else out.push(["Shift started", d.toLocaleTimeString("en-US", {hour: "numeric", minute: "2-digit"})]);
    } catch (e) {}
    return out;
  }
  function bootIntoApp(name, role, proceed) {
    const r = card.getBoundingClientRect(), pretty = name.charAt(0).toUpperCase() + name.slice(1);
    const o = document.createElement("div");
    o.className = "boot-screen"; o.setAttribute("role", "status");
    Object.assign(o.style, {left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px"});
    // waveform na nakapalibot sa singsing (nakatayo, parang video)
    const N = 56, bars = [];
    for (let i = 0; i < N; i++) {
      const th = i / N * Math.PI * 2, x = 140 + 118 * Math.cos(th), y = 128 + 40 * Math.sin(th), back = Math.sin(th) < 0;
      bars.push('<i style="left:' + x.toFixed(1) + "px;top:" + y.toFixed(1) + "px;--d:" + (0.5 + Math.random() * .9).toFixed(2) + "s;--h:" + (10 + Math.random() * 46).toFixed(0) + "px;animation-delay:-" + (Math.random()).toFixed(2) + "s;" + (back ? "opacity:.45;z-index:0" : "z-index:2") + '"></i>');
    }
    const chips = storeChips(role).map((c, i) => '<div class="boot-chip" style="--i:' + i + '"><small>' + escH(c[0]) + "</small><b>" + escH(c[1]) + "</b></div>").join("");
    o.innerHTML = '<div class="boot-inner">' +
      '<div class="boot-head"><small>Welcome,</small><b>' + (role === "admin" ? "Administrator" : "Employee") + '</b><span><i class="boot-dot"></i>' + escH(pretty) + " · online</span></div>" +
      '<div class="holo"><svg viewBox="0 0 280 200" aria-hidden="true"><defs><linearGradient id="hg" x1="0" x2="1"><stop offset="0" stop-color="#A3E635"/><stop offset=".5" stop-color="#36A65E"/><stop offset="1" stop-color="#F5A524"/></linearGradient></defs>' +
      '<ellipse class="e3" cx="140" cy="128" rx="134" ry="48"/><ellipse class="e1" cx="140" cy="128" rx="118" ry="40"/><ellipse class="e2" cx="140" cy="128" rx="96" ry="31"/></svg>' +
      '<div class="holo-wave">' + bars.join("") + '</div><div class="holo-core"></div></div>' +
      '<div class="boot-chips">' + chips + '</div><div class="boot-bar"><span></span></div><div class="boot-log" id="boot-log"></div></div>';
    document.body.appendChild(o);
    wrap.classList.add("leave");
    requestAnimationFrame(() => requestAnimationFrame(() => o.classList.add("expand")));
    // terminal sa welcome screen
    const lines = ["> Rendering user interface...", "[SYSTEM] Dashboard loaded successfully.", "[STATUS] Continuous connection established.", "> System idle."];
    const box = o.querySelector("#boot-log");
    let li = 0;
    const typeLine = () => {
      if (li >= lines.length) return;
      const t = lines[li++], row = document.createElement("div");
      const m = t.match(/^\[(SYSTEM|STATUS)\]/); row.className = "ln " + (m ? "t-" + m[1].toLowerCase() : "t-cmd");
      box.appendChild(row);
      let c = 0; const st = () => { c = Math.min(t.length, c + 2); row.textContent = t.slice(0, c); if (c < t.length) setTimeout(st, 12); else setTimeout(typeLine, 160); };
      st();
    };
    setTimeout(typeLine, 700);
    // pagkatapos: ipakita ang system at buuin ang dashboard
    setTimeout(() => {
      proceed();
      const app = document.getElementById("app");
      if (app) { app.classList.add("boot"); setTimeout(() => app.classList.remove("boot"), 3200); }
      o.classList.add("reveal");
      setTimeout(() => o.remove(), 900);
    }, 3000);
  }

  // Tinatawag ng app.js
  window.LoginFX = {
    log: log,
    fail(msg) {
      if (!card) return;
      log("[PENDING] Verifying credentials...", "[ERROR] " + (msg || "Access denied."));
      card.classList.remove("shake"); void card.offsetWidth; card.classList.add("shake");
      delete flags.p;
    },
    success(name, role, proceed) {
      if (!wrap || reduce) { log("[SUCCESS] Authentication granted."); return setTimeout(proceed, reduce ? 300 : 0); }
      wrap.classList.add("loading");
      const pretty = name.charAt(0).toUpperCase() + name.slice(1);
      log("try {", "  auth.validateSession();", "  [PENDING] Verifying session token...", "}");
      whenIdle(() => {
        wrap.classList.remove("loading"); wrap.classList.add("ok"); burst(card);
        log("[SUCCESS] Authentication granted.", "[TOKEN] Session active: " + hex() + "...", "> Rendering " + (role === "admin" ? "dashboard" : "workspace") + "...", "[SYSTEM] Welcome, " + pretty + ".");
        whenIdle(() => bootIntoApp(name, role, proceed));
      });
    },
    reset() {
      if (!wrap) return;
      wrap.classList.remove("loading", "ok", "leave");
      if (card) card.classList.remove("shake");
      parts = [];
      boot(BOOT_LOGIN);
    }
  };
})();
