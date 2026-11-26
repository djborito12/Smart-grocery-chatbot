/* RetailBot HTML version - data is saved in the browser (localStorage). */
const KEY_P = "rb_products", KEY_S = "rb_sales", KEY_U = "rb_user";

// Starting data: maraming product (galing sa js/demo-data.js)
const SEED = buildDemoProducts();
// Demo accounts. NOTE: not secure, because everything runs in the browser.
let USERS = {admin: {pw: "admin123", role: "admin"}, employee: {pw: "employee123", role: "employee"}};
// Line icons (stroke = currentColor) so they follow the theme colour.
const ICONS = {
  dashboard: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  products:  '<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>',
  scan:      '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><path d="M8 9v6M12 9v6M16 9v6"/>',
  sales:     '<path d="M3 17l5-5 4 4 8-9"/><path d="M15 7h5v5"/>',
  chat:      '<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M18.5 15l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
  data:      '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
  accounts:  '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c1.9.7 3.2 2.5 3.5 5.2"/>',
  box:       '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
  wallet:    '<path d="M4 7a2 2 0 0 1 2-2h12v4"/><path d="M4 7v10a2 2 0 0 0 2 2h14V9H6a2 2 0 0 1-2-2z"/><circle cx="16.5" cy="14" r="1.2"/>',
  receipt:   '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  down:      '<path d="M3 7l6 6 4-4 8 8"/><path d="M15 17h6v-6"/>',
  hourglass: '<path d="M7 3h10M7 21h10"/><path d="M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9"/>',
  calendar:  '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  trend:     '<path d="M3 17l5-5 4 4 8-9"/><path d="M15 7h5v5"/>',
  logout:    '<path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3"/><path d="M16 8l4 4-4 4M20 12H9"/>',
  check:     '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  mail:      '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/>',
  bot:       '<rect x="4" y="8" width="16" height="11" rx="3.5"/><path d="M12 4v4"/><circle cx="12" cy="3.5" r="1"/><circle cx="9" cy="13.5" r="1.2" fill="currentColor"/><circle cx="15" cy="13.5" r="1.2" fill="currentColor"/><path d="M2 12.5v3M22 12.5v3"/>',
  send:      '<path d="M4 12l16-8-6 16-2.5-6.5z"/><path d="M11.5 13.5 20 4"/>',
  plus:      '<path d="M12 5v14M5 12h14"/>',
  x:         '<path d="M6 6l12 12M18 6 6 18"/>'
};
const ico = (n, size) => '<svg class="ico" width="' + (size || 20) + '" height="' + (size || 20) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[n] + "</svg>";

const PAGES = {
  dashboard: {label: "Dashboard",         icon: "dashboard", roles: ["admin"],                sub: "Store overview"},
  products:  {label: "Products",          icon: "products",  roles: ["admin", "employee"],    sub: "Manage inventory, stock and expiry dates"},
  scan:      {label: "Scan & Checkout",   icon: "scan",      roles: ["admin", "employee"],    sub: "Scan EAN-13 barcodes or QR codes with your camera"},
  sales:     {label: "Sales & Reports",   icon: "sales",     roles: ["admin"],                sub: "Review transactions and export reports"},
  chat:      {label: "Ask RetailBot",     icon: "chat",      roles: ["admin", "employee"],                sub: "A built-in assistant for product and store questions"},
  data:      {label: "Data Management",   icon: "data",      roles: ["admin"],                sub: "Export, back up and restore your store data"},
  accounts:  {label: "Accounts",          icon: "accounts",  roles: ["admin"],                sub: "Manage who can sign in to RetailBot"}
};

function load(key, def) {
  try { const v = JSON.parse(localStorage.getItem(key)); if (v !== null) return v; } catch (e) {}
  return JSON.parse(JSON.stringify(def));
}
let products = load(KEY_P, SEED), sales = load(KEY_S, null) || buildDemoSales(), user = load(KEY_U, null);
const KEY_SET = "rb_settings";
const DEFAULT_SETTINGS = {name: "RetailBot Mini Grocery", address: "", contact: "", footer: "Thank you for shopping! Please come again."};
let settings = Object.assign({}, DEFAULT_SETTINGS, load(KEY_SET, {}));
let cart = [], page = "products", scanner = null, lastScan = {code: "", t: 0};

const $ = id => document.getElementById(id);
const save = () => { localStorage.setItem(KEY_P, JSON.stringify(products)); localStorage.setItem(KEY_S, JSON.stringify(sales)); };
if (localStorage.getItem(KEY_S) === null) save();   // unang bukas: i-save ang demo data
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
const peso = n => "₱" + Number(n).toLocaleString("en-PH", {minimumFractionDigits: 2, maximumFractionDigits: 2});
const today = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };

// ---------- inventory helpers ----------
const isExpired = d => d < today();
const totalStock = p => p.batches.reduce((s, b) => s + b.quantity, 0);
const sellable = p => p.batches.filter(b => b.quantity > 0 && !isExpired(b.expiry));
const available = p => sellable(p).reduce((s, b) => s + b.quantity, 0);
const nearestExpiry = p => { const b = p.batches.filter(b => b.quantity > 0).map(b => b.expiry).sort(); return b[0] || "-"; };
function stockBadge(p) {
  const a = available(p);
  if (a === 0) return '<span class="badge b-bad">Out of stock</span>';
  if (a <= p.min_stock) return '<span class="badge b-low">Low stock</span>';
  return '<span class="badge b-ok">In stock</span>';
}
function expiryBadge(p) {
  const e = nearestExpiry(p);
  if (e === "-") return "-";
  if (isExpired(e)) return '<span class="badge b-bad">Expired ' + e + "</span>";
  const days = Math.round((new Date(e) - new Date(today())) / 86400000);
  if (days <= 7) return '<span class="badge b-low">' + e + " (" + days + "d)</span>";
  return e;
}
function ean13(first12) {
  let s = 0; for (let i = 0; i < 12; i++) s += +first12[i] * (i % 2 ? 3 : 1);
  return first12 + ((10 - (s % 10)) % 10);
}
function newBarcode() {
  const used = Object.values(products).map(p => p.barcode);
  let code; do { code = ean13("2" + String(Math.floor(Math.random() * 1e11)).padStart(11, "0")); } while (used.includes(code));
  return code;
}

// ---------- login ----------
$("login-form").addEventListener("submit", e => {
  e.preventDefault();
  if (loggingIn) return;
  const name = $("lg-user").value.trim().toLowerCase(), acc = USERS[name];
  if (!acc || acc.pw !== $("lg-pass").value) {
    $("lg-msg").textContent = "Wrong username or password.";
    if (window.LoginFX) LoginFX.fail("Access denied: wrong username or password.");
    return;
  }
  $("lg-msg").textContent = "";
  const enter = () => {
    loggingIn = false;
    user = {name: name, role: acc.role};
    localStorage.setItem(KEY_U, JSON.stringify(user));
    $("lg-pass").value = "";
    page = acc.role === "admin" ? "dashboard" : "products";
    start();
  };
  loggingIn = true;
  if (window.LoginFX) LoginFX.success(name, acc.role, enter); else enter();
});
let loggingIn = false;
function logout() { stopScanner(); pending = null; localStorage.removeItem(KEY_U); user = null; cart = []; if (typeof chatOwner !== "undefined") chatOwner = null; if (window.LoginFX) LoginFX.reset(); start(); }

function start() {
  $("login-screen").classList.toggle("hidden", !!user);
  $("app").classList.toggle("hidden", !user);
  if (user) render();
}
function go(p) { stopScanner(); pending = null; page = p; render(); }

function render() {
  if (!PAGES[page].roles.includes(user.role)) page = "products";
  $("nav").innerHTML = Object.keys(PAGES).filter(k => PAGES[k].roles.includes(user.role))
    .map(k => '<button class="' + (k === page ? "active" : "") + '" onclick="go(\'' + k + '\')">' + ico(PAGES[k].icon, 19) + "<span>" + PAGES[k].label + "</span></button>").join("");
  $("who").innerHTML = '<span class="avatar">' + esc(user.name.charAt(0).toUpperCase()) + '</span><span><b>' + esc(user.name) + '</b><small>' + (user.role === "admin" ? "Administrator" : "Employee") + "</small></span>";
  ({dashboard: dashboardView, products: productsView, scan: scanView, sales: salesView, chat: chatView, data: dataView, accounts: accountsView})[page]();
}

function head(t, s) { return '<div class="page-head"><span class="page-icon">' + ico(PAGES[page].icon, 24) + '</span><div><h2 class="title">' + t + '</h2><p class="sub">' + s + "</p></div></div>"; }

// ---------- dashboard ----------
function dashboardView() {
  const list = Object.keys(products);
  const low = list.filter(n => { const a = available(products[n]); return a > 0 && a <= products[n].min_stock; });
  const out = list.filter(n => available(products[n]) === 0);
  const expired = list.filter(n => products[n].batches.some(b => b.quantity > 0 && isExpired(b.expiry)));
  const live = sales.filter(s => !s.void);
  const todaySales = live.filter(s => s.t.slice(0, 10) === today()).reduce((a, s) => a + s.total, 0);
  const alerts = [];
  out.forEach(n => alerts.push('<span class="badge b-bad">Out</span> ' + esc(n)));
  low.forEach(n => alerts.push('<span class="badge b-low">Low</span> ' + esc(n) + " (" + available(products[n]) + " left)"));
  expired.forEach(n => alerts.push('<span class="badge b-bad">Expired batch</span> ' + esc(n)));
  $("view").innerHTML = head("Dashboard", "Store overview") +
    '<div class="stats">' +
    '<div class="stat"><div class="lbl">Products</div><div class="val">' + list.length + "</div></div>" +
    '<div class="stat"><div class="lbl">Low / out of stock</div><div class="val">' + (low.length + out.length) + "</div></div>" +
    '<div class="stat"><div class="lbl">Products with expired batch</div><div class="val">' + expired.length + "</div></div>" +
    '<div class="stat"><div class="lbl">Today\'s sales</div><div class="val">' + peso(todaySales) + "</div></div></div>" +
    '<div class="grid2"><div class="card"><h3>Alerts</h3>' + (alerts.length ? alerts.map(a => "<p>" + a + "</p>").join("") : '<p class="muted">No alerts</p>') + "</div>" +
    '<div class="card"><h3>Recent sales</h3>' + (live.length ? live.slice(-6).reverse().map(s =>
      '<div class="receipt-line" style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--line)"><span>#' + s.no + " · " + s.t.slice(0, 16).replace("T", " ") + "</span><b>" + peso(s.total) + "</b></div>").join("") : '<p class="muted">No sales yet.</p>') + "</div></div>";
}

// ---------- products ----------
function productsView() {
  const admin = user.role === "admin";
  const rows = Object.keys(products).sort().map(n => { const p = products[n]; return "<tr><td><b>" + esc(n) + "</b></td><td>" + esc(p.category) + "</td><td>" + peso(p.price) +
    "</td><td>" + totalStock(p) + " (sellable " + available(p) + ")</td><td>" + stockBadge(p) + "</td><td>" + expiryBadge(p) + "</td><td>" + p.barcode +
    '</td><td><button class="btn sm sec" data-n="' + esc(n) + '" onclick="restock(this.dataset.n)">Restock</button> ' +
    (admin ? '<button class="btn sm sec" data-n="' + esc(n) + '" onclick="editProduct(this.dataset.n)">Edit</button> <button class="btn sm red" data-n="' + esc(n) + '" onclick="delProduct(this.dataset.n)">Delete</button>' : "") + "</td></tr>"; }).join("");
  $("view").innerHTML = head("Products", "Manage inventory, stock and expiry dates") +
    '<div id="pmsg"></div><div class="card"><h3>Add new product</h3><div class="form-row">' +
    '<div><label>Name</label><input id="n-name"></div><div><label>Category</label><input id="n-cat" value="Grocery"></div>' +
    '<div><label>Price (₱)</label><input id="n-price" type="number" min="0" step="0.01"></div><div><label>Quantity</label><input id="n-qty" type="number" min="0" step="1"></div>' +
    '<div><label>Expiry</label><input id="n-exp" type="date"></div><div><label>Min stock</label><input id="n-min" type="number" min="0" value="5"></div>' +
    '<div><button class="btn" onclick="addProduct()">Add product</button></div></div></div>' +
    '<div class="card"><h3>Inventory</h3><div class="tbl-wrap"><table><thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Nearest expiry</th><th>Barcode</th><th></th></tr></thead><tbody>' + rows + "</tbody></table></div></div>";
}
function pmsg(t, ok) { const el = $("pmsg"); if (el) el.innerHTML = '<div class="msg ' + (ok ? "ok" : "err") + '">' + esc(t) + "</div>"; }
function addProduct() {
  const name = $("n-name").value.trim().toLowerCase(), price = parseFloat($("n-price").value),
    qty = parseInt($("n-qty").value, 10), exp = $("n-exp").value, min = parseInt($("n-min").value, 10);
  if (!name) return pmsg("Enter a product name.");
  if (products[name]) return pmsg("That product already exists. Use Restock.");
  if (!(price > 0)) return pmsg("Price must be greater than 0.");
  if (!(qty >= 0)) return pmsg("Quantity must be 0 or more.");
  if (!exp) return pmsg("Choose an expiry date.");
  if (exp < today()) return pmsg("Expiry date cannot be in the past.");
  products[name] = {price: price, barcode: newBarcode(), category: $("n-cat").value.trim() || "General", min_stock: min >= 0 ? min : 5, batches: [{quantity: qty, expiry: exp}]};
  save(); productsView(); pmsg('Added "' + name + '".', true);
}
function restock(name) {
  const q = parseInt(prompt("Quantity to add for " + name + ":"), 10);
  if (!(q > 0)) return;
  const exp = prompt("Expiry date (YYYY-MM-DD):", today());
  if (!exp || !/^\d{4}-\d{2}-\d{2}$/.test(exp) || isNaN(new Date(exp)) || exp < today()) return alert("Invalid or past date. Use YYYY-MM-DD.");
  const same = products[name].batches.find(b => b.expiry === exp);
  if (same) same.quantity += q; else products[name].batches.push({quantity: q, expiry: exp});
  save(); productsView(); pmsg("Restocked " + name + " (+" + q + ").", true);
}
// ---------- edit product (administrator) ----------
let editing = null;
function editProduct(name) {
  if (user.role !== "admin" || !products[name]) return;
  editing = name;
  const p = products[name];
  $("modal").innerHTML = '<div class="editbox"><h3>Edit product</h3>' +
    '<div class="form-row"><div><label>Name</label><input id="ed-name" maxlength="40" value="' + esc(name) + '"></div>' +
    '<div><label>Category</label><input id="ed-cat" value="' + esc(p.category) + '"></div>' +
    '<div><label>Price (₱)</label><input id="ed-price" type="number" min="0.01" step="0.01" value="' + p.price + '"></div>' +
    '<div><label>Minimum stock alert</label><input id="ed-min" type="number" min="0" step="1" value="' + (p.min_stock != null ? p.min_stock : 5) + '"></div></div>' +
    '<p class="muted">Barcode: ' + esc(p.barcode) + ' (cannot be changed). Stock and batches are changed with Restock.</p><div id="ed-msg"></div>' +
    '<div class="row"><button class="btn" onclick="saveEdit()">Save changes</button><button class="btn sec" onclick="closeModal()">Cancel</button></div></div>';
  $("modal").classList.remove("hidden");
}
function saveEdit() {
  const old = editing, p = products[old];
  if (!p) return closeModal();
  const name = $("ed-name").value.trim().toLowerCase(), cat = $("ed-cat").value.trim() || "General",
    price = parseFloat($("ed-price").value), min = parseInt($("ed-min").value, 10);
  const fail = t => { $("ed-msg").innerHTML = '<div class="msg err">' + esc(t) + "</div>"; };
  if (!name) return fail("Enter a product name.");
  if (name !== old && products[name]) return fail("Another product already uses that name.");
  if (!(price > 0)) return fail("Price must be greater than 0.");
  if (!(min >= 0)) return fail("Minimum stock cannot be negative.");
  p.price = price; p.category = cat; p.min_stock = min;
  if (name !== old) {
    products[name] = p; delete products[old];
    cart.forEach(c => { if (c.name === old) c.name = name; });
  }
  editing = null; save(); closeModal(); productsView(); pmsg('Updated "' + name + '".', true);
}
function delProduct(name) {
  if (user.role !== "admin") return;
  if (!confirm('Delete "' + name + '"?')) return;
  delete products[name]; cart = cart.filter(c => c.name !== name);
  save(); productsView(); pmsg('Deleted "' + name + '".', true);
}

// ---------- scan & checkout ----------
function scanView() {
  $("view").innerHTML = head("Scan & Checkout", "Scan EAN-13 barcodes or QR codes with your laptop camera") +
    '<div class="grid2"><div class="card"><h3>Scanner</h3><div id="reader"></div>' +
    '<div class="row"><button class="btn" id="btn-start" onclick="startScanner()">Start camera</button><button class="btn sec" onclick="stopScanner()">Stop</button></div>' +
    '<div class="row"><input id="manual" placeholder="Or type barcode / product name"><button class="btn sec" onclick="manualAdd()">Find</button></div>' +
    '<div id="smsg"></div><div id="scanpanel"></div></div><div class="card"><h3>Cart</h3><div id="cart"></div></div></div>' + labelHtml();
  $("manual").addEventListener("keydown", e => { if (e.key === "Enter") manualAdd(); });
  drawCart(); drawScanPanel(); drawLabel();
}
function smsg(t, type) { const el = $("smsg"); if (el) el.innerHTML = '<div class="msg ' + type + '">' + esc(t) + "</div>"; }
function startScanner() {
  if (typeof Html5Qrcode === "undefined") return smsg("Scanner library not loaded. Check your internet connection.", "err");
  if (scanner) return;
  scanner = new Html5Qrcode("reader");
  scanner.start({facingMode: "environment"}, {fps: 10, qrbox: {width: 280, height: 160}, formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.QR_CODE]},
    text => handleCode(text), () => {})
    .then(() => smsg("Camera is on. Point it at a barcode.", "info"))
    .catch(err => { scanner = null; smsg("Cannot open camera: " + err, "err"); });
}
function stopScanner() {
  if (!scanner) return;
  const s = scanner; scanner = null;
  s.stop().then(() => s.clear()).catch(() => {});
}
function findProduct(code) {
  code = code.trim();
  return Object.keys(products).find(n => products[n].barcode === code || n === code.toLowerCase());
}
function handleCode(code) {
  const now = Date.now();
  if (pending && (pending.ok || pending.newCode)) return;          // wait until the cashier chooses an action
  if (code === lastScan.code && now - lastScan.t < 2500) return;   // ignore repeat reads
  lastScan = {code: code, t: now};
  recordScan(code);
}
function manualAdd() {
  const el = $("manual");
  if (!el || !el.value.trim()) return;
  recordScan(el.value); el.value = "";
}

// ---------- scan result: the cashier chooses what to do ----------
let pending = null;            // last scan result waiting for a choice
const MAX_CODE = 40;
const isValidEan13 = c => /^\d{13}$/.test(c) && ean13(c.slice(0, 12)) === c;
const nice = s => s.charAt(0).toUpperCase() + s.slice(1);
function recordScan(raw) {
  const text = String(raw).trim();
  if (!text) return;
  if (text.length > MAX_CODE) pending = {ok: false, code: text.slice(0, MAX_CODE) + "...", msg: "That code is not a RetailBot product code. Ignored."};
  else {
    const name = findProduct(text);
    if (name) pending = {ok: true, name: name, code: text, mode: null};
    else if (/^\d{13}$/.test(text)) pending = isValidEan13(text)
      ? {ok: false, code: text, newCode: text, mode: null, msg: "Barcode " + text + " is not in the inventory."}
      : {ok: false, code: text, msg: "Barcode was misread (wrong check digit). Please try again."};
    else pending = {ok: false, code: text, msg: "No product matches that barcode or name."};
  }
  drawScanPanel();
}
function closeScan() { pending = null; lastScan.t = Date.now(); drawScanPanel(); }
function dismissScan() { closeScan(); }
function scanMode(m) { if (pending) { pending.mode = m; drawScanPanel(); } }
function scanToCart() { if (pending && pending.ok && addToCart(pending.name)) closeScan(); }
function drawScanPanel() {
  const el = $("scanpanel"); if (!el) return;
  const s = pending;
  if (!s) { el.innerHTML = ""; return; }
  if (s.ok) {
    const p = products[s.name];
    if (!p) { pending = null; el.innerHTML = ""; return; }
    el.innerHTML = '<div class="msg ok">Product recognized. Choose what you want to do next.</div>' +
      '<div class="spanel"><h4>' + esc(nice(s.name)) + "</h4>Price: <b>" + peso(p.price) + "</b><br>Category: " + esc(p.category) + "<br>Barcode: " + esc(p.barcode) +
      "<br>Available stock: " + available(p) + "<br>Nearest expiry: " + expiryBadge(p) + "</div>" +
      '<div class="row" style="margin-top:12px"><button class="btn" onclick="scanToCart()">Add to cart / Buy</button><button class="btn sec" onclick="scanMode(\'restock\')">Add to products / Restock</button><button class="btn sec" onclick="dismissScan()">Cancel</button></div>' +
      (s.mode === "restock" ? '<div class="spanel"><b>Restock ' + esc(nice(s.name)) + '</b><div class="form-row" style="margin-top:10px"><div><label>Additional quantity</label><input id="sr-qty" type="number" min="1" step="1" value="1"></div>' +
        '<div><label>Expiration date</label><input id="sr-exp" type="date" min="' + today() + '" value="' + today() + '"></div><div><button class="btn" onclick="saveScanRestock()">Save to inventory</button></div></div></div>' : "");
    return;
  }
  el.innerHTML = '<div class="msg err">' + esc(s.msg) + "</div>" + (s.code ? '<div class="spanel">Scanned code: <b>' + esc(s.code) + "</b></div>" : "") +
    (s.newCode
      ? '<p class="muted">This code is not registered yet. You can register it as a new product.</p><div class="row"><button class="btn" onclick="scanMode(\'new\')">Add new product to inventory</button><button class="btn sec" onclick="dismissScan()">Cancel</button></div>' +
        (s.mode === "new" ? '<div class="spanel"><b>New product details</b><div class="form-row" style="margin-top:10px"><div><label>Product name</label><input id="sn-name" maxlength="40"></div>' +
          '<div><label>Selling price (₱)</label><input id="sn-price" type="number" min="0.01" step="0.01" value="1"></div><div><label>Initial quantity</label><input id="sn-qty" type="number" min="1" step="1" value="1"></div>' +
          '<div><label>Category</label><input id="sn-cat" value="General"></div><div><label>Minimum stock alert</label><input id="sn-min" type="number" min="0" step="1" value="5"></div>' +
          '<div><label>Expiration date</label><input id="sn-exp" type="date" min="' + today() + '" value="' + today() + '"></div><div><button class="btn" onclick="saveScanNew()">Save new product</button></div></div></div>' : "")
      : '<p class="muted">Only a valid EAN-13 barcode can be registered from a scan.</p>');
}
function saveScanRestock() {
  if (!pending || !pending.ok) return;
  const name = pending.name, q = parseInt($("sr-qty").value, 10), exp = $("sr-exp").value;
  if (!(q > 0)) return smsg("Quantity must be greater than zero.", "err");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(exp) || exp < today()) return smsg("Invalid or past expiration date.", "err");
  const same = products[name].batches.find(b => b.expiry === exp);
  if (same) same.quantity += q; else products[name].batches.push({quantity: q, expiry: exp});
  save(); closeScan(); smsg("Restocked " + name + " (+" + q + ").", "ok");
}
function saveScanNew() {
  if (!pending || !pending.newCode) return;
  const code = pending.newCode, name = $("sn-name").value.trim().toLowerCase(), price = parseFloat($("sn-price").value),
    qty = parseInt($("sn-qty").value, 10), min = parseInt($("sn-min").value, 10), exp = $("sn-exp").value, cat = $("sn-cat").value.trim() || "General";
  if (!name) return smsg("Enter a product name.", "err");
  if (products[name]) return smsg("That product name already exists. Use another name or restock it.", "err");
  if (!(price > 0)) return smsg("Price must be greater than 0.", "err");
  if (!(qty > 0)) return smsg("Quantity must be greater than zero.", "err");
  if (!(min >= 0)) return smsg("Minimum stock cannot be negative.", "err");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(exp) || exp < today()) return smsg("Invalid or past expiration date.", "err");
  if (Object.values(products).some(p => p.barcode === code)) return smsg("Another product already uses that barcode.", "err");
  products[name] = {price: price, barcode: code, category: cat, min_stock: min, batches: [{quantity: qty, expiry: exp}]};
  save(); closeScan(); smsg('Added "' + name + '".', "ok");
}

// ---------- barcode pictures (EAN-13) for testing ----------
const EAN_L = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"];
const EAN_G = ["0100111", "0110011", "0011011", "0100001", "0011101", "0111001", "0000101", "0010001", "0001001", "0010111"];
const EAN_PARITY = ["LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG", "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"];
function eanModules(code) {
  let bits = "101";
  for (let i = 1; i <= 6; i++) bits += (EAN_PARITY[+code[0]][i - 1] === "L" ? EAN_L : EAN_G)[+code[i]];
  bits += "01010";
  for (let i = 7; i <= 12; i++) bits += EAN_L[+code[i]].split("").map(c => c === "1" ? "0" : "1").join("");
  return bits + "101";
}
function drawBarcode(canvas, code, title) {
  const scale = 4, quiet = 11, bits = eanModules(code), w = (bits.length + 2 * quiet) * scale + 40, h = 230, c = canvas.getContext("2d");
  canvas.width = w; canvas.height = h;
  c.fillStyle = "#fff"; c.fillRect(0, 0, w, h); c.fillStyle = "#000";
  for (let i = 0; i < bits.length; i++) if (bits[i] === "1") c.fillRect(20 + (quiet + i) * scale, 40, scale, 140);
  c.textAlign = "center"; c.font = "bold 18px Arial"; c.fillText(title, w / 2, 26); c.font = "20px monospace"; c.fillText(code, w / 2, 206);
}
function labelHtml() {
  const names = Object.keys(products).sort();
  return '<div class="card"><h3>Print product barcodes</h3><p class="muted">Print the EAN-13 barcode or show it on a phone, then point the laptop camera at it.</p>' +
    (names.length ? '<div class="row"><select id="lb-pick" onchange="drawLabel()">' + names.map(n => '<option value="' + esc(n) + '">' + esc(nice(n)) + "</option>").join("") +
      '</select><button class="btn sec" onclick="downloadLabel()">Download PNG</button></div><canvas id="bc-canvas" style="max-width:100%;border-radius:8px"></canvas>' : '<p class="muted">No products yet.</p>') + "</div>";
}
function drawLabel() {
  const sel = $("lb-pick"), cv = $("bc-canvas"); if (!sel || !cv || !products[sel.value]) return;
  const code = String(products[sel.value].barcode);
  if (!isValidEan13(code)) { cv.width = 1; cv.height = 1; return smsg("This product's barcode is not a valid EAN-13, so no picture can be drawn.", "info"); }
  drawBarcode(cv, code, nice(sel.value));
}
function downloadLabel() {
  const sel = $("lb-pick"), cv = $("bc-canvas"); if (!sel || !cv) return;
  const a = document.createElement("a"); a.href = cv.toDataURL("image/png"); a.download = "barcode-" + sel.value + ".png"; a.click();
}

function addToCart(name) {
  const item = cart.find(c => c.name === name), have = available(products[name]);
  if (have === 0) return smsg(name + " has no sellable stock (out of stock or expired).", "err");
  if (item && item.qty >= have) return smsg("Only " + have + " " + name + " available.", "err");
  if (item) item.qty++; else cart.push({name: name, qty: 1});
  smsg("Added: " + name, "ok"); drawCart(); return true;
}
function changeQty(name, d) {
  const item = cart.find(c => c.name === name); if (!item) return;
  const n = item.qty + d;
  if (n <= 0) cart = cart.filter(c => c !== item);
  else if (n > available(products[name])) return smsg("Not enough stock.", "err");
  else item.qty = n;
  drawCart();
}
const cartTotal = () => cart.reduce((s, c) => s + c.qty * products[c.name].price, 0);
function drawCart() {
  const el = $("cart"); if (!el) return;
  cart = cart.filter(c => products[c.name]);
  if (!cart.length) { el.innerHTML = '<p class="muted">Cart is empty. Scan a product to begin.</p>'; return; }
  el.innerHTML = '<table><tbody>' + cart.map(c => '<tr><td><b>' + esc(c.name) + '</b><br><span class="muted">' + peso(products[c.name].price) + '</span></td><td><span class="qty">' +
    '<button class="btn sm sec" data-n="' + esc(c.name) + '" onclick="changeQty(this.dataset.n,-1)">−</button>' + c.qty +
    '<button class="btn sm sec" data-n="' + esc(c.name) + '" onclick="changeQty(this.dataset.n,1)">+</button></span></td><td style="text-align:right"><b>' +
    peso(c.qty * products[c.name].price) + "</b></td></tr>").join("") + "</tbody></table>" +
    '<div class="total"><span>Total</span><span>' + peso(cartTotal()) + '</span></div><div class="row"><button class="btn" onclick="checkout()">Checkout</button><button class="btn sec" onclick="cart=[];drawCart()">Clear</button></div>';
}
function checkout() {
  if (!cart.length) return;
  for (const c of cart) if (c.qty > available(products[c.name])) return smsg("Stock changed for " + c.name + ". Adjust the cart.", "err");
  for (const c of cart) {                                   // take stock from the earliest-expiring batch first
    let need = c.qty;
    for (const b of sellable(products[c.name]).sort((a, b) => a.expiry.localeCompare(b.expiry))) {
      const take = Math.min(b.quantity, need); b.quantity -= take; need -= take; if (!need) break;
    }
  }
  const d = new Date(), t = today() + "T" + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  const sale = {no: sales.length ? Math.max(...sales.map(s => s.no)) + 1 : 1, t: t, cashier: user.name,
    items: cart.map(c => ({name: c.name, qty: c.qty, price: products[c.name].price})), total: cartTotal(), void: null};
  sales.push(sale); save(); cart = []; drawCart(); showReceipt(sale);
}
function showReceipt(s) {
  $("modal").innerHTML = '<div class="receipt"><h4>' + esc(settings.name) + "</h4>" + (settings.address ? '<div class="c">' + esc(settings.address) + "</div>" : "") + (settings.contact ? '<div class="c">' + esc(settings.contact) + "</div>" : "") + '<div class="c">Official Receipt</div>' + (s.void ? '<div class="c"><b>*** VOIDED ***</b><br>' + esc(s.void.reason) + "</div>" : "") + "<hr>" +
    '<div class="ln"><span>Receipt #' + String(s.no).padStart(6, "0") + "</span><span>" + s.t.replace("T", " ") + '</span></div><div class="ln"><span>Cashier</span><span>' + esc(s.cashier) + "</span></div><hr>" +
    s.items.map(i => '<div class="ln"><span>' + i.qty + " x " + esc(i.name) + "</span><span>" + peso(i.qty * i.price) + "</span></div>").join("") +
    '<hr><div class="ln"><b>TOTAL</b><b>' + peso(s.total) + '</b></div><hr><div class="c">' + esc(settings.footer) + "</div>" +
    '<div class="row no-print" style="margin-top:16px"><button class="btn" onclick="window.print()">Print</button><button class="btn sec" onclick="closeModal()">Close</button></div></div>';
  $("modal").classList.remove("hidden");
}
function closeModal() { $("modal").classList.add("hidden"); }

// ---------- sales ----------
function salesView() {
  const live = sales.filter(s => !s.void), total = live.reduce((a, s) => a + s.total, 0);
  const rows = sales.slice().reverse().map(s => "<tr><td>#" + s.no + "</td><td>" + s.t.replace("T", " ") + "</td><td>" + esc(s.cashier || "-") + "</td><td>" +
    s.items.map(i => i.qty + " x " + esc(i.name)).join(", ") + "</td><td><b>" + peso(s.total) + "</b></td><td>" + (s.void ? '<span class="badge b-bad">Void</span>' : "") +
    '</td><td><button class="btn sm sec" onclick="showReceipt(sales.find(x=>x.no===' + s.no + '))">Receipt</button></td></tr>').join("");
  $("view").innerHTML = head("Sales", "Transaction history") +
    '<div class="stats"><div class="stat"><div class="lbl">Transactions</div><div class="val">' + live.length + '</div></div><div class="stat"><div class="lbl">Total sales</div><div class="val">' + peso(total) + "</div></div></div>" +
    '<div class="card"><div class="tbl-wrap"><table><thead><tr><th>No.</th><th>Date</th><th>Cashier</th><th>Items</th><th>Total</th><th></th><th></th></tr></thead><tbody>' +
    (rows || '<tr><td colspan="7" class="muted">No sales yet.</td></tr>') + "</tbody></table></div></div>";
}

