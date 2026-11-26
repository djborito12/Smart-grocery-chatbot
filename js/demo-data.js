/* RetailBot demo data: mga product at benta para may laman ang system.
   - Ang mga petsa ay binibilang mula sa ARAW NGAYON, kaya laging may benta "ngayon",
     sa nakaraang 10 araw at sa nakaraang 30 araw, at laging may produktong malapit mag-expire.
   - Ginagamit lang ito sa unang bukas (kapag wala pang naka-save sa browser),
     o kapag pinindot ang "Load demo store data" sa Data Management. */

// Petsa na X araw mula ngayon (YYYY-MM-DD). Negatibo = nakaraan.
function demoDay(offset) {
  const d = new Date(); d.setDate(d.getDate() + offset);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
// Paulit-ulit na "random" (pare-pareho ang resulta tuwing ginagawa)
function demoRandom(seed) {
  let a = seed >>> 0;
  return function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function demoBarcode(n) {
  const first12 = "2" + String(480000000000 + n * 7919).slice(-11);
  let s = 0; for (let i = 0; i < 12; i++) s += +first12[i] * (i % 2 ? 3 : 1);
  return first12 + ((10 - (s % 10)) % 10);
}

// [pangalan, category, presyo, min stock, popularity (1-10), mga batch: [quantity, araw bago mag-expire]]
const DEMO_CATALOG = [
  ["rice",              "Grocery",       55, 10, 10, [[34, 280], [20, 340]], "2955326982197"],
  ["milk",              "Dairy",         35,  6,  7, [[8, -2], [14, 4]],       "2272301904143"],
  ["bread",             "Bakery",        45,  5,  8, [[6, -1], [9, 2]],        "2974346031166"],
  ["eggs",              "Dairy",          9, 24, 10, [[30, 0], [96, 12]],      "2471555585034"],
  ["coffee",            "Coffee",        12, 20,  9, [[0, -6], [64, 240]],     "2403709354302"],
  ["noodles",           "Noodles",       10, 15,  9, [[3, 150]],               "2382530528390"],
  ["pancit canton",     "Noodles",       16, 15,  9, [[42, 160], [30, 210]]],
  ["cup noodles",       "Noodles",       28,  8,  5, [[18, 190]]],
  ["sardines",          "Canned Goods",  24, 12,  9, [[48, 540]]],
  ["corned beef",       "Canned Goods",  42,  8,  7, [[22, 600]]],
  ["tuna",              "Canned Goods",  38,  8,  6, [[26, 620]]],
  ["meat loaf",         "Canned Goods",  28,  8,  5, [[5, 480]]],
  ["luncheon meat",     "Canned Goods",  65,  6,  4, [[12, 560]]],
  ["white sugar",       "Grocery",       42,  8,  6, [[20, 365]]],
  ["brown sugar",       "Grocery",       38,  8,  5, [[16, 365]]],
  ["cooking oil",       "Grocery",       65,  6,  6, [[14, 300]]],
  ["salt",              "Condiments",    15,  6,  4, [[25, 720]]],
  ["soy sauce",         "Condiments",    22,  8,  7, [[30, 400]]],
  ["vinegar",           "Condiments",    20,  8,  6, [[28, 420]]],
  ["fish sauce",        "Condiments",    25,  6,  4, [[18, 380]]],
  ["evaporated milk",   "Dairy",         32,  8,  5, [[24, 210]]],
  ["condensed milk",    "Dairy",         48,  6,  4, [[15, 230]]],
  ["cheese",            "Dairy",         52,  5,  4, [[4, 25]]],
  ["butter",            "Dairy",         58,  4,  2, [[3, -4]]],
  ["pandesal",          "Bakery",         5, 30,  8, [[40, 1], [60, 3]]],
  ["soft drink",        "Beverages",     20, 24, 10, [[72, 160], [48, 200]]],
  ["bottled water",     "Beverages",     15, 24,  8, [[60, 330]]],
  ["juice drink",       "Beverages",     12, 20,  6, [[36, 6]]],
  ["energy drink",      "Beverages",     25, 12,  5, [[24, 240]]],
  ["biscuits",          "Snacks",        10, 20,  8, [[50, 120]]],
  ["chips",             "Snacks",        15, 20,  7, [[34, 90]]],
  ["chocolate",         "Snacks",         8, 20,  6, [[45, 150]]],
  ["shampoo sachet",    "Personal Care",  7, 24,  6, [[80, 700]]],
  ["bath soap",         "Personal Care", 28, 10,  5, [[22, 900]]],
  ["toothpaste",        "Personal Care", 45,  6,  3, [[10, 800]]],
  ["detergent",         "Household",     12, 24,  7, [[66, 900]]],
  ["dishwashing liquid","Household",     18, 12,  5, [[2, 900]]]
];

function buildDemoProducts() {
  const out = {};
  DEMO_CATALOG.forEach((c, i) => {
    out[c[0]] = {price: c[2], barcode: c[6] || demoBarcode(i + 11), category: c[1], min_stock: c[3],
      batches: c[5].map(b => ({quantity: b[0], expiry: demoDay(b[1])}))};
  });
  return out;
}

// Mga benta sa nakaraang 30 araw hanggang ngayon (mas marami tuwing Sabado at Linggo)
function buildDemoSales() {
  const rnd = demoRandom(20261126), now = new Date(), sales = [];
  const pool = [];
  DEMO_CATALOG.forEach(c => { for (let k = 0; k < c[4]; k++) pool.push(c); });
  const cashiers = ["employee", "employee", "employee", "admin"];
  const reasons = ["Wrong item scanned", "Customer cancelled", "Wrong quantity"];
  for (let day = 29; day >= 0; day--) {
    const d = new Date(); d.setDate(d.getDate() - day);
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    let count = Math.round((weekend ? 14 : 9) + rnd() * 6 + (29 - day) * 0.12);   // dahan-dahang lumalaki ang benta
    const lastHour = day === 0 ? Math.max(7, now.getHours()) : 21;
    if (day === 0) count = Math.max(4, Math.round(count * Math.min(1, (lastHour - 6) / 15)));
    const times = [];
    for (let k = 0; k < count; k++) {
      let h = 7 + Math.floor(rnd() * (lastHour - 6)), m = Math.floor(rnd() * 60);
      if (day === 0 && (h > now.getHours() || (h === now.getHours() && m > now.getMinutes()))) { h = Math.max(0, now.getHours() - 1 - Math.floor(rnd() * 3)); }
      times.push(String(Math.min(h, 23)).padStart(2, "0") + ":" + String(m).padStart(2, "0"));
    }
    times.sort().forEach(t => {
      const n = 1 + Math.floor(rnd() * 4), picked = {};
      for (let k = 0; k < n; k++) { const c = pool[Math.floor(rnd() * pool.length)]; picked[c[0]] = c; }
      const items = Object.values(picked).map(c => {
        const qty = c[0] === "eggs" ? [6, 12, 3][Math.floor(rnd() * 3)] : c[0] === "pandesal" ? 5 + Math.floor(rnd() * 11) : 1 + Math.floor(rnd() * 3);
        return {name: c[0], qty: qty, price: c[2]};
      });
      sales.push({no: 0, t: demoDay(-day) + "T" + t, cashier: cashiers[Math.floor(rnd() * cashiers.length)], items: items,
        total: items.reduce((a, x) => a + x.qty * x.price, 0), void: null});
    });
  }
  sales.forEach((s, i) => s.no = i + 1);
  // ilang na-void na benta
  [17, 88, 151, 230].forEach((i, k) => { if (sales[i] && sales.length - i > 3) sales[i].void = {t: sales[i].t.slice(0, 10), reason: reasons[k % reasons.length]}; });
  return sales;
}
