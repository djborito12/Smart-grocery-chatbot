/* RetailBot extras: dashboard, chatbot, reports, data, accounts */
const KEY_USERS = "rb_users";
try { const u = JSON.parse(localStorage.getItem(KEY_USERS)); if (u) USERS = u; } catch (e) {}
const saveUsers = () => localStorage.setItem(KEY_USERS, JSON.stringify(USERS));
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const liveSales = () => sales.filter(s => !s.void);
const dkey = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const daysAgo = n => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
const sumSince = n => liveSales().filter(s => s.t.slice(0, 10) >= dkey(daysAgo(n - 1))).reduce((a, s) => a + s.total, 0);
const daysLeft = e => Math.round((new Date(e) - new Date(today())) / 86400000);
function head(t, s) { return '<div class="page-head"><span class="page-icon">' + ico(PAGES[page].icon, 24) + '</span><div><h2 class="title">' + t + '</h2><p class="sub">' + s + "</p></div></div>"; }
function topSellers(days) {
  const from = days ? dkey(daysAgo(days - 1)) : "";
  const m = {}; liveSales().filter(s => s.t.slice(0, 10) >= from).forEach(s => s.items.forEach(i => m[i.name] = (m[i.name] || 0) + i.qty));
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
}
const lowList = () => Object.keys(products).filter(n => { const a = available(products[n]); return a > 0 && a <= products[n].min_stock; });
const outList = () => Object.keys(products).filter(n => available(products[n]) === 0);
const expList = () => { const r = []; Object.keys(products).forEach(n => products[n].batches.forEach(b => { if (b.quantity > 0 && daysLeft(b.expiry) <= 7) r.push({n: n, e: b.expiry, d: daysLeft(b.expiry)}); })); return r.sort((a, b) => a.e.localeCompare(b.e)); };
function statCard(ic, cls, l, v, note) { return '<div class="stat ' + cls + '"><div class="ic">' + ico(ic, 22) + '</div><div><div class="lbl">' + l + '</div><div class="val">' + v + '</div><div class="note">' + note + "</div></div></div>"; }

// ---------- dashboard ----------
// Lahat ng alert: ubos, paubos, at bawat batch na expired / mag-e-expire
function storeAlerts() {
  const names = Object.keys(products), out = [];
  names.filter(n => available(products[n]) === 0).forEach(n => out.push({c: "red", t: cap(n) + " is out of stock."}));
  names.forEach(n => { const a = available(products[n]); if (a > 0 && a <= products[n].min_stock) out.push({c: "amb", t: cap(n) + ": only " + a + " left (limit " + products[n].min_stock + ")."}); });
  names.forEach(n => products[n].batches.forEach((b, i) => {
    const d = daysLeft(b.expiry);
    if (d < 0) out.push({c: "red", t: cap(n) + " (batch " + (i + 1) + ") has expired: " + b.expiry + "."});
    else if (d === 0) out.push({c: "amb", t: cap(n) + " (batch " + (i + 1) + ") expires today: " + b.expiry + "."});
    else if (d <= 7) out.push({c: "amb", t: cap(n) + " (batch " + (i + 1) + ") is expiring soon: " + b.expiry + "."});
  }));
  return out;
}
function notifHtml(alerts) {
  return '<div class="notif"><button class="notif-btn" id="notif-btn" onclick="toggleNotif(event)" aria-label="Alerts (' + alerts.length + ')" aria-expanded="false" title="Alerts">' + ico("mail", 22) +
    (alerts.length ? '<span class="notif-count">' + alerts.length + "</span>" : "") + "</button>" +
    '<div class="notif-panel hidden" id="notif-panel" role="dialog" aria-label="Alerts" onclick="event.stopPropagation()"><div class="notif-head">Alerts (' + alerts.length + ")</div>" +
    '<div class="notif-list">' + (alerts.length ? alerts.map(a => '<div class="notif-item"><i class="dot ' + a.c + '"></i><span>' + esc(a.t) + "</span></div>").join("") : '<p class="muted">No alerts. Everything looks good.</p>') + "</div></div></div>";
}
function toggleNotif(e) {
  e.stopPropagation();
  const p = $("notif-panel"), open = p.classList.toggle("hidden") === false;
  $("notif-btn").setAttribute("aria-expanded", String(open));
}
function closeNotif() { const p = $("notif-panel"); if (p && !p.classList.contains("hidden")) { p.classList.add("hidden"); $("notif-btn").setAttribute("aria-expanded", "false"); } }
document.addEventListener("click", closeNotif);
document.addEventListener("keydown", e => { if (e.key === "Escape") closeNotif(); });

function dashboardView() {
  const names = Object.keys(products), low = lowList(), out = outList(), ex = expList(), alerts = storeAlerts();
  const value = names.reduce((a, n) => a + products[n].price * available(products[n]), 0);
  const td = liveSales().filter(s => s.t.slice(0, 10) === today());
  const hr = new Date().getHours(), greet = hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";
  const rows = [];
  names.forEach(n => products[n].batches.forEach(b => rows.push({n: n, e: b.expiry, q: b.quantity})));
  rows.sort((a, b) => a.e.localeCompare(b.e));
  const days = [6, 5, 4, 3, 2, 1, 0].map(i => { const d = daysAgo(i), k = dkey(d); return {l: d.toLocaleDateString("en-US", {weekday: "short"}), v: liveSales().filter(s => s.t.slice(0, 10) === k).reduce((a, s) => a + s.total, 0)}; });
  const mx = Math.max(...days.map(d => d.v), 1);
  const weekTotal = days.reduce((a, d) => a + d.v, 0);
  $("view").innerHTML = '<div class="dash-top">' + head("Dashboard", "Store overview") + notifHtml(alerts) + "</div>" +
    '<div class="hero"><span class="hb hb1"></span><span class="hb hb2"></span><span class="hb hb3"></span>' +
    ["box", "receipt", "wallet", "scan", "box"].map((n, i) => '<span class="hf hf' + (i + 1) + '">' + ico(n, 30) + "</span>").join("") +
    '<div><h2>' + greet + ", " + esc(cap(user.name)) + '.</h2><p>' + (alerts.length ? alerts.length + " items need your attention. Open the envelope to see them." : "Everything looks good in your store.") + '</p></div>' +
    '<div class="tag"><small>Sales today</small><b>' + peso(td.reduce((a, s) => a + s.total, 0)) + "</b><small>" + new Date().toLocaleDateString("en-US", {weekday: "long", month: "long", day: "numeric"}) + "</small></div></div>" +
    '<div class="stats">' + statCard("box", "", "Products", names.length, "registered items") + statCard("wallet", "blu", "Stock value", peso(value), "at selling price") +
    statCard("receipt", "", "Transactions today", td.length, "paid sales") + statCard("down", "amb", "Needs restocking", low.length + out.length, "low or out of stock") +
    statCard("hourglass", "red", "Expiry watch", ex.length, "expired or expiring in 7 days") + "</div>" +
    '<div class="card"><h3>Sales, last 7 days <span class="muted small">' + peso(weekTotal) + " total</span></h3><div class=\"bars\">" + days.map((d, i) => '<div class="bar' + (i === 6 ? " now" : "") + '" style="--i:' + i + '"><b data-count="' + Math.round(d.v) + '" data-peso="1">' + (d.v ? "₱" + Math.round(d.v).toLocaleString("en-PH") : "") + '</b><span style="--h:' + Math.max(d.v / mx * 100, 2) + '%"></span>' + d.l + "</div>").join("") + "</div></div>" +
    '<div class="card"><h3>Expiry and stock levels</h3><div class="tbl-wrap"><table><thead><tr><th>Product</th><th>Expiry date</th><th>Qty</th><th>Status</th></tr></thead><tbody>' +
    rows.map(r => { const d = daysLeft(r.e); return '<tr style="--i:' + rows.indexOf(r) + '"><td><b>' + cap(esc(r.n)) + "</b></td><td>" + r.e + "</td><td>" + r.q + "</td><td>" + (r.q === 0 ? '<span class="badge b-low">Empty batch</span>' : d < 0 ? '<span class="badge b-bad">Expired</span>' : d <= 7 ? '<span class="badge b-low">' + (d === 0 ? "Expires today" : "Expires in " + d + "d") + "</span>" : '<span class="badge b-ok">Good</span>') + "</td></tr>"; }).join("") + "</tbody></table></div></div>";
  countUp($("view"));
}

// Bumibilang paakyat ang mga numero (stat cards, price tag, chart labels)
function countUp(root) {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  root.querySelectorAll(".stat .val, .tag b, .bar b").forEach((el, k) => {
    const txt = el.textContent.trim(); if (!txt) return;
    const isPeso = txt.startsWith("₱"), target = parseFloat(txt.replace(/[^0-9.]/g, "")) || 0;
    const dec = isPeso && !el.closest(".bar") ? 2 : 0, dur = 1300, delay = el.closest(".bar") ? 500 : k * 80;
    const fmt = v => (isPeso ? "₱" : "") + v.toLocaleString("en-PH", {minimumFractionDigits: dec, maximumFractionDigits: dec});
    el.textContent = fmt(0);
    const t0 = performance.now() + delay;
    const step = now => {
      if (!el.isConnected) return;
      const p = Math.min(1, Math.max(0, (now - t0) / dur)), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * e);
      if (p < 1) requestAnimationFrame(step); else el.textContent = txt;
    };
    requestAnimationFrame(step);
  });
}

// ---------- sales & reports ----------
let salesRange = 30;                     // Today (1) / 10 days / 30 days / All (0)
const RANGES = [[1, "Today"], [10, "10 days"], [30, "30 days"], [0, "All"]];
function setRange(n) { salesRange = n; salesView(); }
function salesView() {
  const top = topSellers(salesRange).slice(0, 5), low = lowList(), ex = expList(), maxTop = top.length ? top[0][1] : 1;
  const inRange = liveSales().filter(s => !salesRange || s.t.slice(0, 10) >= dkey(daysAgo(salesRange - 1)));
  const rangeName = (RANGES.find(r => r[0] === salesRange) || [0, "All"])[1];
  $("view").innerHTML = head("Sales & Reports", "Review transactions, see what sells best and export reports") +
    '<div class="range" role="group" aria-label="Period">' + RANGES.map(r => '<button class="' + (r[0] === salesRange ? "on" : "") + '" onclick="setRange(' + r[0] + ')">' + r[1] + "</button>").join("") + "</div>" +
    '<div class="stats">' + statCard("calendar", "", "Today", peso(sumSince(1)), liveSales().filter(s => s.t.slice(0, 10) === today()).length + " transactions") +
    statCard("trend", "blu", "Last 10 days", peso(sumSince(10)), "10-day sales") +
    statCard("calendar", "amb", "Last 30 days", peso(sumSince(30)), "monthly sales") +
    statCard("receipt", "", "Transactions", inRange.length, rangeName === "All" ? "all time, excluding voided" : rangeName.toLowerCase() + ", excluding voided") + "</div>" +
    '<div class="grid2"><div class="card"><h3>Top-selling products <span class="muted small">' + rangeName + "</span></h3>" +
    (top.map(t => '<div class="rank"><span>' + cap(esc(t[0])) + '</span><b>' + t[1] + ' sold</b><i class="rank-bar" style="--w:' + Math.round(t[1] / maxTop * 100) + '%"></i></div>').join("") || '<p class="muted">No sales in this period.</p>') + "</div>" +
    '<div class="card"><h3>Stock and expiry report</h3><b>Restock</b><p class="muted">' + (low.concat(outList()).map(cap).join(", ") || "None") + "</p><b>Expiry</b><p class=\"muted\">" + (ex.map(x => cap(x.n) + " (" + x.e + ")").join(", ") || "None") + "</p></div></div>" +
    '<div class="card"><h3>Transactions <span class="muted small">' + rangeName + '</span><input id="txq" placeholder="Search receipt # or product" oninput="drawTx()" style="width:240px;font-weight:400;margin-left:auto"></h3><div class="tbl-wrap" id="txt"></div></div>';
  drawTx();
}
function drawTx() {
  const q = ($("txq").value || "").toLowerCase().trim().replace(/^#/, "");
  const from = salesRange ? dkey(daysAgo(salesRange - 1)) : "";
  const list = sales.slice().reverse().filter(s => s.t.slice(0, 10) >= from).filter(s => !q || String(s.no).padStart(6, "0").includes(q) || String(s.no) === q || s.items.some(i => i.name.toLowerCase().includes(q)));
  $("txt").innerHTML = "<table><thead><tr><th>Receipt</th><th>When</th><th>Cashier</th><th>Items</th><th>Total</th><th>Status</th><th></th></tr></thead><tbody>" +
    (list.map(s => "<tr" + (s.void ? ' style="opacity:.6"' : "") + "><td>#" + String(s.no).padStart(6, "0") + "</td><td>" + s.t.replace("T", " ") + "</td><td>" + esc(s.cashier || "-") + "</td><td>" + s.items.map(i => i.qty + " × " + cap(esc(i.name))).join(", ") + "</td><td><b>" + (s.void ? "<s>" + peso(s.total) + "</s>" : peso(s.total)) + "</b></td><td>" +
      (s.void ? '<span class="badge b-bad">Voided</span><br><small>' + esc(s.void.reason) + "</small>" : '<span class="badge b-ok">Paid</span>') + '</td><td style="white-space:nowrap"><button class="btn sm sec" onclick="showReceipt(sales.find(x=>x.no===' + s.no + '))">Receipt</button> ' +
      (s.void ? "" : '<button class="btn sm red" onclick="voidDialog(' + s.no + ')">Void</button>') + "</td></tr>").join("") || '<tr><td colspan="7" class="muted">No transactions found.</td></tr>') + "</tbody></table>";
}
function voidDialog(no) {
  $("modal").innerHTML = '<div class="dialog"><h3 style="margin:0">Void receipt #' + String(no).padStart(6, "0") + '</h3><label>Reason</label><select id="vr">' +
    ["Wrong item scanned", "Customer cancelled", "Wrong quantity", "Item returned", "Other"].map(r => "<option>" + r + "</option>").join("") + '</select><label>If Other, type the reason</label><input id="vo" maxlength="80">' +
    '<div class="row" style="margin-top:18px"><button class="btn red" onclick="doVoid(' + no + ')">Void sale</button><button class="btn sec" onclick="closeModal()">Cancel</button></div></div>';
  $("modal").classList.remove("hidden");
}
function doVoid(no) {
  const r = $("vr").value, reason = r === "Other" ? $("vo").value.trim() : r;
  if (!reason) return alert("Type the reason for voiding.");
  sales.find(s => s.no === no).void = {t: today(), reason: reason};
  save(); closeModal(); salesView();
}

// ---------- data ----------
function dl(name, text, type) { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], {type: type || "text/csv"})); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1500); }
const cell = v => '"' + String(v).replace(/"/g, '""') + '"';
function dmsg(t, ok) { $("dmsg").innerHTML = '<div class="msg ' + (ok ? "ok" : "err") + '">' + esc(t) + "</div>"; }
function dataView() {
  $("view").innerHTML = head("Data management", "Export, back up and restore your store data") + '<div id="dmsg"></div>' +
    '<div class="card"><h3>Store details for receipts</h3><div class="form-row"><div><label>Store name</label><input id="st-name" maxlength="60" value="' + esc(settings.name) + '"></div>' +
    '<div><label>Address</label><input id="st-addr" maxlength="120" value="' + esc(settings.address) + '" placeholder="e.g. Brgy. Poblacion, Rosario, Cavite"></div>' +
    '<div><label>Contact (optional)</label><input id="st-contact" maxlength="60" value="' + esc(settings.contact) + '" placeholder="e.g. 0917 123 4567"></div>' +
    '<div><label>Footer message</label><input id="st-foot" maxlength="120" value="' + esc(settings.footer) + '"></div><div><button class="btn" onclick="saveStore()">Save store details</button></div></div></div>' +
    '<div class="card"><h3>Download</h3><div class="row"><button class="btn" onclick="exportProducts()">Products (CSV)</button><button class="btn" onclick="exportSales()">Sales (CSV)</button><button class="btn sec" onclick="backup()">Full backup (JSON)</button></div></div>' +
    '<div class="card"><h3>Restore from backup</h3><div class="row"><input type="file" id="rf" accept=".json"><button class="btn sec" onclick="restoreBackup()">Restore</button></div><p class="muted">Replaces current products and sales with the backup file.</p></div>' +
    '<div class="card"><h3>Sample data and reset</h3><div class="row"><button class="btn" onclick="loadDemo()">Load demo store data</button><button class="btn sec" onclick="sampleSales()">Add 30 days of sample sales</button><button class="btn red" onclick="resetSales()">Delete all sales</button></div></div>';
}
function saveStore() {
  const name = $("st-name").value.trim();
  if (!name) return dmsg("Enter a store name.");
  settings = {name: name, address: $("st-addr").value.trim(), contact: $("st-contact").value.trim(), footer: $("st-foot").value.trim()};
  localStorage.setItem(KEY_SET, JSON.stringify(settings)); dmsg("Store details saved.", true);
}
function exportProducts() { dl("products.csv", "name,category,price,stock,sellable,min_stock,nearest_expiry,barcode\n" + Object.keys(products).sort().map(n => { const p = products[n]; return [cell(n), cell(p.category), p.price, totalStock(p), available(p), p.min_stock, nearestExpiry(p), cell(p.barcode)].join(","); }).join("\n")); }
function exportSales() { dl("sales.csv", "receipt,date,cashier,items,total,status\n" + sales.map(s => [s.no, s.t, cell(s.cashier || ""), cell(s.items.map(i => i.qty + "x " + i.name).join("; ")), s.total, s.void ? "voided" : "paid"].join(",")).join("\n")); }
function backup() { dl("retailbot-backup-" + today() + ".json", JSON.stringify({products: products, sales: sales, settings: settings}, null, 2), "application/json"); }
function restoreBackup() {
  const f = $("rf").files[0]; if (!f) return dmsg("Choose a backup file first.");
  f.text().then(t => {
    const d = JSON.parse(t);
    if (!d || typeof d.products !== "object" || !Array.isArray(d.sales)) throw 0;
    if (!Object.values(d.products).every(p => p && p.price >= 0 && Array.isArray(p.batches))) throw 0;
    if (!confirm("Replace all current data with this backup?")) return;
    products = d.products; sales = d.sales; cart = [];
    if (d.settings && typeof d.settings === "object") { settings = Object.assign({}, DEFAULT_SETTINGS, d.settings); localStorage.setItem(KEY_SET, JSON.stringify(settings)); }
    save(); dmsg("Backup restored.", true);
  }).catch(() => dmsg("That file is not a valid RetailBot backup."));
}
function sampleSales() {
  const names = Object.keys(products); if (!names.length) return dmsg("Add a product first.");
  let no = sales.length ? Math.max(...sales.map(s => s.no)) : 0;
  for (let i = 29; i >= 0; i--) for (let k = 0, n = 2 + Math.floor(Math.random() * 5); k < n; k++) {
    const items = [...new Set([0, 1].map(() => names[Math.floor(Math.random() * names.length)]))].map(x => ({name: x, qty: 1 + Math.floor(Math.random() * 3), price: products[x].price}));
    sales.push({no: ++no, t: dkey(daysAgo(i)) + "T" + String(8 + Math.floor(Math.random() * 11)).padStart(2, "0") + ":" + String(Math.floor(Math.random() * 60)).padStart(2, "0"), cashier: "employee", items: items, total: items.reduce((a, x) => a + x.qty * x.price, 0), void: null});
  }
  save(); dmsg("Added sample sales for the last 30 days.", true);
}
function loadDemo() {
  if (!confirm("Replace ALL products and sales with the demo store data (37 products, 30 days of sales)?")) return;
  products = buildDemoProducts(); sales = buildDemoSales(); cart = [];
  save(); dmsg("Demo store data loaded: " + Object.keys(products).length + " products and " + sales.length + " sales.", true);
}
function resetSales() { if (confirm("Delete ALL sales records? This cannot be undone.")) { sales = []; save(); dmsg("All sales deleted.", true); } }

// ---------- accounts ----------
function amsg(t, ok) { $("amsg").innerHTML = '<div class="msg ' + (ok ? "ok" : "err") + '">' + esc(t) + "</div>"; }
function accountsView() {
  $("view").innerHTML = head("Accounts", "Manage who can sign in to RetailBot") + '<div id="amsg"></div>' +
    '<div class="card"><h3>Registered accounts</h3><div class="tbl-wrap"><table><thead><tr><th>Username</th><th>Role</th><th></th></tr></thead><tbody>' +
    Object.keys(USERS).map(n => "<tr><td><b>" + esc(n) + "</b>" + (n === user.name ? ' <span class="badge b-ok">You</span>' : "") + "</td><td>" + USERS[n].role + '</td><td><button class="btn sm sec" data-n="' + esc(n) + '" onclick="resetPw(this.dataset.n)">Reset password</button> ' +
      (USERS[n].role === "employee" ? '<button class="btn sm red" data-n="' + esc(n) + '" onclick="delUser(this.dataset.n)">Delete</button>' : "") + "</td></tr>").join("") + "</tbody></table></div></div>" +
    '<div class="card"><h3>Create account</h3><div class="form-row"><div><label>Username</label><input id="a-u" placeholder="3-20 letters or numbers"></div><div><label>Password</label><input id="a-p" type="password" placeholder="At least 6 characters"></div>' +
    '<div><label>Role</label><select id="a-r"><option value="employee">Employee</option><option value="admin">Admin</option></select></div><div><button class="btn" onclick="addUser()">Create account</button></div></div></div>' +
    '<div class="card"><h3>Change your password</h3><div class="form-row"><div><label>Current password</label><input id="c-o" type="password"></div><div><label>New password</label><input id="c-n" type="password"></div><div><button class="btn" onclick="changePw()">Update password</button></div></div></div>';
}
function addUser() {
  const n = $("a-u").value.trim().toLowerCase(), p = $("a-p").value;
  if (!/^[a-z0-9_.]{3,20}$/.test(n)) return amsg("Username must be 3-20 characters: letters, numbers, _ or .");
  if (USERS[n]) return amsg("That username already exists.");
  if (p.length < 6) return amsg("Password must be at least 6 characters.");
  USERS[n] = {pw: p, role: $("a-r").value}; saveUsers(); accountsView(); amsg('Account "' + n + '" created.', true);
}
function resetPw(n) { const p = prompt("New password for " + n + " (min 6 characters):"); if (p === null) return; if (p.length < 6) return amsg("Password must be at least 6 characters."); USERS[n].pw = p; saveUsers(); amsg("Password reset for " + n + ".", true); }
function delUser(n) { if (USERS[n].role !== "employee" || !confirm('Delete employee account "' + n + '"?')) return; delete USERS[n]; saveUsers(); accountsView(); amsg('Deleted "' + n + '".', true); }
function changePw() {
  const o = $("c-o").value, p = $("c-n").value;
  if (USERS[user.name].pw !== o) return amsg("Current password is wrong.");
  if (p.length < 6) return amsg("New password must be at least 6 characters.");
  USERS[user.name].pw = p; saveUsers(); $("c-o").value = $("c-n").value = ""; amsg("Password updated.", true);
}

