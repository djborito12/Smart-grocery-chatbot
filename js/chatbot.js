/* RetailBot chatbot: Ask RetailBot page.
   Rule-based assistant na sumasagot gamit ang data na nasa system (walang API).
   - Admin: may chat history sa gilid (naka-save sa browser).
   - Employee: laging bagong chat, walang history.
   - Sumasagot ayon sa role: hindi ipinapakita sa employee ang store-wide sales at accounts.
   - Hindi tumutulong sa reset, delete, backup o restore ng data. */

const BOT_ALIAS = {gatas: "milk", itlog: "eggs", bigas: "rice", tinapay: "bread", kape: "coffee", noodle: "noodles", egg: "eggs"};
const TL_WORDS = new Set(["magkano", "ilan", "ilang", "meron", "mayroon", "ano", "anong", "ba", "bang", "mga", "po", "ngayon", "kahapon", "benta", "nabenta",
  "presyo", "natitira", "natira", "salamat", "kumusta", "kamusta", "wala", "paano", "sino", "saan", "kailan", "pakita", "ubos", "paubos", "kulang",
  "pinakamabenta", "pinakamura", "pinakamahal", "linggo", "buwan", "lahat", "yung", "lang", "naman", "kita", "nito", "niyan", "iyan", "yan", "yun"]);

let chats = [], chatId = null, chatOwner = null, botBusy = false, botCtx = {};
let chat = [], viewing = null;          // viewing = username ng chat na binubuksan ni admin (kung hindi kanya)
const BOT_DELAY = 5000;                  // 5 segundo bago sumagot ang bot

const CHATS_KEY = "rb_chats";            // iisang history para sa lahat ng user (nakikita ni admin)
const isAdmin = () => user && user.role === "admin";
const fmtDate = d => new Date(d + "T00:00").toLocaleDateString("en-US", {month: "short", day: "numeric", year: "numeric"});
const rno = n => "#" + String(n).padStart(6, "0");

function botWelcome() {
  const name = cap(user.name);
  return {r: "bot", t: isAdmin()
    ? "Hi " + name + "! I'm RetailBot, your store assistant. Ask me about products, stock, expiry dates, sales or reports. English or Tagalog is fine."
    : "Hi " + name + "! I'm RetailBot. Ask me about a product's price, stock or expiry date, or about your sales today. English or Tagalog is fine."};
}
function botSuggestions() {
  return isAdmin()
    ? ["How much did we sell today?", "What are the top-selling products?", "What is low on stock?", "What is expiring soon?", "Magkano ang gatas?", "Show the last 5 transactions"]
    : ["Magkano ang gatas?", "Is the bread still available?", "What is low on stock?", "What is expiring soon?", "My sales today"];
}

// ---------- history ----------
// Lahat ng usapan (admin at employee) ay naka-save sa iisang listahan.
// Admin lang ang nakakakita ng listahan; employee ay laging bagong chat.
function readChats() {
  let all = [];
  try { const v = JSON.parse(localStorage.getItem(CHATS_KEY)); if (Array.isArray(v)) all = v; } catch (e) {}
  // ilipat ang lumang history ng admin (rb_chats_admin) papunta sa bagong listahan
  Object.keys(localStorage).filter(k => k.startsWith("rb_chats_")).forEach(k => {
    try { (JSON.parse(localStorage.getItem(k)) || []).forEach(c => { c.user = c.user || k.slice(9); if (!all.some(x => x.id === c.id)) all.push(c); }); } catch (e) {}
    localStorage.removeItem(k);
  });
  return all.sort((a, b) => String(b.updated).localeCompare(String(a.updated)));
}
function writeChats(all) { localStorage.setItem(CHATS_KEY, JSON.stringify(all.slice(0, 80))); }
function loadChats() { chats = isAdmin() ? readChats() : []; }
function newChat() {
  if (botBusy) return;
  chatId = null; viewing = null; botCtx = {}; chat = [botWelcome()];
  drawChat(); drawHistory(); setViewing();
  const el = $("chat-in"); if (el) el.focus();
}
function openChat(id) {
  if (botBusy) return;
  loadChats();
  const c = chats.find(x => x.id === id); if (!c) return drawHistory();
  chatId = id; botCtx = {}; chat = c.msgs.slice();
  viewing = c.user && c.user !== user.name ? c.user : null;
  drawChat(); drawHistory(); setViewing();
}
function deleteChat(id) {
  if (botBusy || !confirm("Delete this conversation?")) return;
  writeChats(readChats().filter(x => x.id !== id)); loadChats();
  if (chatId === id) newChat(); else drawHistory();
}
function storeChat() {
  if (viewing) return;
  const all = readChats();
  const firstQ = (chat.find(m => m.r === "me") || {}).t || "New chat";
  let c = all.find(x => x.id === chatId);
  if (!c) { chatId = "c" + Date.now() + Math.floor(Math.random() * 1000); c = {id: chatId, title: firstQ.slice(0, 48), user: user.name, role: user.role}; all.unshift(c); }
  c.msgs = chat.slice(); c.updated = new Date().toISOString();
  writeChats([c].concat(all.filter(x => x !== c)));
  loadChats();
}
function whenLabel(iso) {
  const d = new Date(iso), k = dkey(d);
  if (k === today()) return d.toLocaleTimeString("en-US", {hour: "numeric", minute: "2-digit"});
  if (k === dkey(daysAgo(1))) return "Yesterday";
  return d.toLocaleDateString("en-US", {month: "short", day: "numeric"});
}
function drawHistory() {
  const el = $("chat-history"); if (!el) return;
  el.innerHTML = '<button class="btn new-chat" onclick="newChat()">' + ico("plus", 18) + "New chat</button>" +
    '<div class="hist-title">History</div>' +
    (chats.length ? chats.map(c => '<div class="hist' + (c.id === chatId ? " active" : "") + '"><button class="hist-open" onclick="openChat(\'' + c.id + '\')"><span>' + esc(c.title) +
      '</span><small><b class="hist-user' + (c.role === "employee" ? " emp" : "") + '">' + esc(c.user || "admin") + "</b> · " + whenLabel(c.updated) + '</small></button><button class="hist-del" title="Delete conversation" aria-label="Delete conversation" onclick="deleteChat(\'' + c.id + '\')">' + ico("x", 15) + "</button></div>").join("")
      : '<p class="hist-empty">Conversations from you and your employees will appear here.</p>');
}
// Kapag binubuksan ni admin ang chat ng employee: basahin lang, hindi puwedeng mag-type
function setViewing() {
  const bar = $("chat-view-note"), input = $("chat-in"), send = $("chat-send"), chips = $("chips");
  if (bar) { bar.classList.toggle("hidden", !viewing); bar.innerHTML = viewing ? "Viewing <b>" + esc(viewing) + "</b>'s conversation. Press <b>New chat</b> to ask RetailBot yourself." : ""; }
  if (input) { input.disabled = !!viewing; input.placeholder = viewing ? "Read only" : "Message RetailBot…"; }
  if (send) send.disabled = !!viewing || botBusy;
  if (chips && viewing) chips.classList.add("hidden");
}

// ---------- page ----------
function chatView() {
  // Employee: laging bago. Bagong user: bagong chat.
  if (!isAdmin() || chatOwner !== user.name) { chatOwner = user.name; chatId = null; viewing = null; botCtx = {}; chat = [botWelcome()]; }
  loadChats();
  $("view").innerHTML = head("Ask RetailBot", isAdmin() ? "Your store assistant for products, stock, sales and reports" : "Your store assistant for products, stock and expiry dates") +
    '<div class="chat-layout' + (isAdmin() ? "" : " solo") + '">' + (isAdmin() ? '<aside class="chat-history" id="chat-history" aria-label="Chat history"></aside>' : "") +
    '<div class="card chat"><div class="chat-top"><span class="bot-ava big">' + ico("bot", 22) + '</span><div><b>RetailBot</b><small><i class="online"></i>Online · knows your store data</small></div>' +
    (isAdmin() ? "" : '<button class="btn sm sec" onclick="newChat()" title="Start over">' + ico("plus", 15) + "New chat</button>") + "</div>" +
    '<div class="view-note hidden" id="chat-view-note"></div>' +
    '<div class="msgs" id="msgs" aria-live="polite"></div><div class="chips" id="chips">' + botSuggestions().map(s => '<button class="chip" onclick="ask(this.textContent)">' + esc(s) + "</button>").join("") +
    '</div><form class="chatbar" onsubmit="event.preventDefault();ask($(\'chat-in\').value)"><input id="chat-in" placeholder="Message RetailBot…" autocomplete="off" aria-label="Message RetailBot">' +
    '<button class="send" id="chat-send" aria-label="Send">' + ico("send", 20) + "</button></form></div></div>";
  drawChat(); drawHistory(); setViewing();
}

// Simpleng format: **bold** at mga linyang nagsisimula sa "• "
function botFormat(t) {
  const lines = esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").split("\n");
  let html = "", list = [];
  const flush = () => { if (list.length) { html += "<ul>" + list.map(i => "<li>" + i + "</li>").join("") + "</ul>"; list = []; } };
  lines.forEach(l => { if (l.startsWith("• ")) list.push(l.slice(2)); else { flush(); if (l.trim()) html += "<p>" + l + "</p>"; } });
  flush();
  return html;
}
function msgHtml(m) {
  return m.r === "me"
    ? '<div class="row-msg me"><div class="bub me">' + esc(m.t) + '</div><span class="me-ava">' + esc((viewing || user.name).charAt(0).toUpperCase()) + "</span></div>"
    : '<div class="row-msg"><span class="bot-ava">' + ico("bot", 18) + '</span><div class="bub bot">' + botFormat(m.t) + "</div></div>";
}
function drawChat() {
  const el = $("msgs"); if (!el) return;
  el.innerHTML = chat.map(msgHtml).join("");
  el.scrollTop = el.scrollHeight;
  const chips = $("chips"); if (chips) chips.classList.toggle("hidden", chat.length > 1 || !!viewing);
}
const reduceMotion = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function ask(q) {
  q = String(q || "").trim();
  if (!q || botBusy || viewing) return;
  const input = $("chat-in"); if (input) input.value = "";
  chat.push({r: "me", t: q});
  drawChat();
  const reply = botReply(q);
  botBusy = true; setBusy(true);
  const el = $("msgs");
  el.insertAdjacentHTML("beforeend", '<div class="row-msg" id="typing"><span class="bot-ava">' + ico("bot", 18) + '</span><div class="bub bot typing" aria-label="RetailBot is typing"><i></i><i></i><i></i></div></div>');
  el.scrollTop = el.scrollHeight;
  const wait = BOT_DELAY;
  setTimeout(() => {
    const t = $("typing"); if (t) t.remove();
    chat.push({r: "bot", t: reply});
    if (reduceMotion() || !$("msgs")) return finishReply();
    // Lumalabas ang sagot nang paunti-unti, parang nagta-type
    const box = $("msgs");
    box.insertAdjacentHTML("beforeend", '<div class="row-msg" id="streaming"><span class="bot-ava">' + ico("bot", 18) + '</span><div class="bub bot"></div></div>');
    const bub = box.querySelector("#streaming .bub"), words = reply.split(/(\s+)/);
    let i = 0;
    const step = () => {
      if (!$("streaming")) return finishReply();
      i = Math.min(words.length, i + 3);
      bub.innerHTML = botFormat(words.slice(0, i).join(""));
      box.scrollTop = box.scrollHeight;
      if (i < words.length) setTimeout(step, 28); else finishReply();
    };
    step();
  }, wait);
}
function finishReply() { botBusy = false; setBusy(false); storeChat(); drawChat(); drawHistory(); const el = $("chat-in"); if (el) el.focus(); }
function setBusy(b) { const s = $("chat-send"); if (s) s.disabled = b || !!viewing; }

// ---------- utak ng bot ----------
function botReply(msg) {
  const low = msg.toLowerCase(), w = low.match(/[a-zñ0-9']+/g) || [];
  if (!w.length) return "Please type a question about a product, stock or sales.";
  const S = new Set(w), has = (...a) => a.some(x => S.has(x)), hasStr = (...a) => a.some(x => low.includes(x));
  const tl = w.some(x => TL_WORDS.has(x));
  const L = (en, t) => tl ? t : en;
  const admin = isAdmin();
  const names = Object.keys(products);

  // 1. Mga bawal: reset, delete, backup, restore ng data
  if (has("reset", "backup", "restore", "wipe", "import", "burahin", "bura") || (has("delete", "remove", "clear") && has("data", "sales", "all", "everything", "lahat", "records", "product", "products")))
    return L("I can't help with resetting, deleting, backing up or restoring store data. " + (admin ? "You can do that in **Data Management**." : "Please ask an administrator."),
      "Hindi ako puwedeng tumulong sa pag-reset, pagbura, backup o restore ng data. " + (admin ? "Magagawa mo iyan sa **Data Management**." : "Pakisabi sa administrator."));
  if (has("password", "passwords", "pw"))
    return L("For security, I never show passwords. " + (admin ? "You can reset a password in **Accounts**." : "Ask an administrator to reset your password."),
      "Para sa seguridad, hindi ako nagpapakita ng password. " + (admin ? "Puwede mong i-reset ang password sa **Accounts**." : "Pakisabi sa administrator na i-reset ang password mo."));

  // 2. Usapang pangkaraniwan
  if (has("thanks", "thank", "salamat", "ty"))
    return L("You're welcome! Anything else you want to check?", "Walang anuman! May iba ka pa bang gustong malaman?");
  if ((has("who", "sino") || (has("what", "ano") && has("are", "ka"))) && has("you", "ka", "ikaw") && w.length <= 5)
    return L("I'm RetailBot, the assistant built into this store system. I read the live inventory and sales data, so my answers match what you see on the screens.",
      "Ako si RetailBot, ang assistant ng system na ito. Binabasa ko ang inventory at sales data, kaya tugma ang sagot ko sa nakikita mo sa system.");
  if (has("help", "tulong") || (has("what", "ano") && has("can", "kaya", "magagawa") && has("you", "mo")))
    return L("Here's what I can help with:", "Ito ang mga kaya kong sagutin:") + "\n• " + L("Price, stock, category and expiry of any product", "Presyo, stock, category at expiry ng kahit anong product") +
      "\n• " + L("Low stock, out of stock, expired and expiring items", "Paubos, ubos, expired at malapit nang mag-expire") +
      (admin ? "\n• " + L("Sales today, this week or this month, top sellers and transactions", "Benta ngayon, ngayong linggo o buwan, pinakamabenta at mga transaction") + "\n• " + L("Stock value, receipts and accounts", "Halaga ng stock, mga resibo at accounts")
        : "\n• " + L("Your own sales today", "Ang sarili mong benta ngayong araw"));
  if ((has("date", "petsa", "time", "oras") || (has("anong", "ano") && has("araw"))) && !has("expiry", "expire", "expiration", "sales", "benta", "sold", "nabenta", "kita"))
    return L("Today is **", "Ngayon ay **") + new Date().toLocaleDateString("en-US", {weekday: "long", month: "long", day: "numeric", year: "numeric"}) + "**, " + new Date().toLocaleTimeString("en-US", {hour: "numeric", minute: "2-digit"}) + ".";
  if (w.length <= 3 && has("hi", "hello", "hey", "kumusta", "kamusta", "morning", "afternoon", "evening", "yo"))
    return L("Hello! What would you like to check in the store today?", "Hello! Ano ang gusto mong i-check sa store ngayon?");

  // 3. Accounts (admin lang)
  if (has("account", "accounts", "users", "user", "employees", "employee", "staff", "cashiers") && !has("sales", "sold", "benta", "sell")) {
    if (!admin) return L("Account details are only available to administrators.", "Para sa administrator lang ang detalye ng accounts.");
    const list = Object.keys(USERS);
    return L("There are **" + list.length + "** accounts:", "May **" + list.length + "** na account:") + "\n" + list.map(n => "• " + n + " (" + (USERS[n].role === "admin" ? "Administrator" : "Employee") + ")").join("\n");
  }

  // 4. Resibo / transaction number
  const rm = low.match(/(?:receipt|resibo|transaction|sale|#)\s*(?:no\.?|number|#)?\s*0*(\d{1,6})/);
  if (rm) {
    const s = sales.find(x => x.no === +rm[1]);
    if (!s) return L("I can't find receipt " + rno(+rm[1]) + ".", "Wala akong makitang resibo " + rno(+rm[1]) + ".");
    if (!admin && (s.cashier !== user.name || s.t.slice(0, 10) !== today()))
      return L("You can only view your own receipts from today.", "Ang sarili mong resibo lang ngayong araw ang puwede mong makita.");
    return "**Receipt " + rno(s.no) + "** · " + s.t.replace("T", " ") + (s.cashier ? " · " + s.cashier : "") + "\n" +
      s.items.map(i => "• " + i.qty + " × " + cap(i.name) + " = " + peso(i.qty * i.price)).join("\n") + "\n" + L("Total: **", "Kabuuan: **") + peso(s.total) + "**" +
      (s.void ? "\n" + L("This sale was voided: ", "Na-void ang benta na ito: ") + s.void.reason : "");
  }

  // 5. Hanapin ang product(s) sa tanong
  const found = [];
  const addP = n => { if (n && products[n] && !found.includes(n)) found.push(n); };
  // 1) mga pangalang dalawang salita ("evaporated milk"); tanggalin sa tanong para hindi mabasa ulit bilang "milk"
  let rest = " " + low.replace(/[^a-zñ0-9' ]/g, " ") + " ";
  names.filter(n => n.includes(" ")).sort((a, b) => b.length - a.length).forEach(n => {
    if (rest.includes(" " + n + " ") || rest.includes(" " + n + "s ")) { addP(n); rest = rest.split(n).join(" "); }
  });
  const rw = rest.match(/[a-zñ0-9']+/g) || [];
  rw.forEach(x => {
    if (BOT_ALIAS[x]) addP(BOT_ALIAS[x]);
    if (products[x]) addP(x);
    else if (x.endsWith("s") && products[x.slice(0, -1)]) addP(x.slice(0, -1));
    else if (products[x + "s"]) addP(x + "s");
    // 2) bahagi ng pangalan: "sugar" -> white sugar, brown sugar
    else if (x.length >= 4) names.filter(n => n.includes(" ") && n.split(" ").includes(x)).forEach(addP);
  });
  if (!found.length) w.forEach(x => { if (x.length >= 4) { const m = names.find(n => n.length >= 4 && (n.startsWith(x.slice(0, 4)) || x.startsWith(n.slice(0, 4))) && Math.abs(n.length - x.length) < 3); if (m) addP(m); } });

  const PRICE = has("price", "prices", "cost", "much", "magkano", "presyo", "halaga");
  const QTY = has("many", "left", "remaining", "quantity", "ilan", "ilang", "natira", "natitira", "count");
  const AVAIL = has("have", "available", "stock", "meron", "mayroon", "avail", "sell", "carry");
  const EXP = has("expire", "expires", "expiry", "expiration", "expired", "fresh", "safe", "spoiled", "good", "mag-expire", "expire");
  const SOLD = has("sold", "sales", "benta", "nabenta", "sell", "selling", "bought", "binili");
  const CAT = has("category", "kategorya", "type", "uri");
  const CODE = has("barcode", "code");
  const BATCH = has("batch", "batches");
  const pronoun = has("it", "that", "yun", "iyan", "yan", "nito", "niyan", "iyon");
  const SOLDQ = has("sold", "nabenta", "benta", "binili", "bought") || (has("sell", "selling", "sales") && has("did", "i", "we", "ko", "namin", "today", "ngayon"));
  const intentOf = () => SOLDQ || (SOLD && !AVAIL) ? "sold" : EXP ? "exp" : PRICE ? "price" : QTY ? "qty" : CODE ? "code" : CAT ? "cat" : BATCH ? "batch" : AVAIL ? "avail" : null;

  let intent = intentOf();
  if (!found.length && pronoun && botCtx.prod && products[botCtx.prod] && intent) found.push(botCtx.prod);
  if (found.length && !intent && botCtx.intent && w.length <= 5) intent = botCtx.intent;       // "how about eggs?"

  if (!found.length && pronoun && (PRICE || QTY || EXP || AVAIL))
    return L("Which product do you mean? Type its name, for example \"price of rice\".", "Aling product ang tinutukoy mo? I-type ang pangalan, halimbawa \"magkano ang bigas\".");
  if (found.length) {
    botCtx = {prod: found[found.length - 1], intent: intent};
    const todayQ = has("today", "ngayon", "ngayong");
    return found.map(n => productAnswer(n, intent || "summary", L, admin, todayQ)).join("\n\n");
  }

  // 6. Benta / sales
  const SALESQ = has("sales", "sale", "sold", "sell", "benta", "nabenta", "revenue", "kita", "income", "earn", "earned", "kinita", "transactions", "transaction",
    "top", "best", "bestseller", "bestsellers", "pinakamabenta", "mabenta", "average", "cashier", "voided", "void", "recent", "latest", "last", "huling");
  if (SALESQ && !has("stock", "expire", "expiring", "expired")) return salesAnswer(w, has, L, admin, tl);

  // 7. Halaga ng stock
  if (hasStr("stock value", "inventory value", "worth", "halaga ng stock", "value of")) {
    if (!admin) return L("Stock value is only available to administrators.", "Para sa administrator lang ang halaga ng stock.");
    const v = names.reduce((a, n) => a + products[n].price * available(products[n]), 0);
    return L("Your sellable stock is worth **" + peso(v) + "** at selling price, across " + names.length + " products.",
      "Ang halaga ng sellable stock mo ay **" + peso(v) + "** sa selling price, mula sa " + names.length + " na product.");
  }

  // 8. Pinakamura / pinakamahal
  if (has("cheapest", "pinakamura", "lowest", "mura") && names.length) {
    const n = names.slice().sort((a, b) => products[a].price - products[b].price)[0];
    return L("The cheapest product is **" + cap(n) + "** at " + peso(products[n].price) + ".", "Ang pinakamura ay **" + cap(n) + "** sa halagang " + peso(products[n].price) + ".");
  }
  if (has("expensive", "pinakamahal", "highest", "mahal", "priciest") && names.length) {
    const n = names.slice().sort((a, b) => products[b].price - products[a].price)[0];
    return L("The most expensive product is **" + cap(n) + "** at " + peso(products[n].price) + ".", "Ang pinakamahal ay **" + cap(n) + "** sa halagang " + peso(products[n].price) + ".");
  }

  // 9. Categories
  const cats = [...new Set(names.map(n => products[n].category))];
  const catHit = cats.find(c => S.has(c.toLowerCase()));
  if (catHit) {
    const list = names.filter(n => products[n].category === catHit);
    return L("**" + catHit + "** products:", "Mga product sa **" + catHit + "**:") + "\n" + list.map(n => "• " + cap(n) + " · " + peso(products[n].price) + " · " + available(products[n]) + L(" available", " available")).join("\n");
  }
  if (has("categories", "category", "kategorya"))
    return L("We have " + cats.length + " categories:", "May " + cats.length + " na category:") + "\n" + cats.map(c => "• " + c + " (" + names.filter(n => products[n].category === c).length + ")").join("\n");

  // 10. Stock at expiry na listahan
  const fmtList = arr => arr.map(x => "• " + x).join("\n");
  if ((has("out") && has("stock", "sold", "available")) || has("ubos", "wala", "naubos")) {
    const o = outList();
    return o.length ? L("These are out of stock:", "Ubos na ang mga ito:") + "\n" + fmtList(o.map(cap)) : L("Good news, nothing is out of stock.", "Ayos, walang ubos na product.");
  }
  if (has("restock", "restocking", "low", "paubos", "kulang", "reorder", "order")) {
    const lw = lowList(), o = outList();
    if (!lw.length && !o.length) return L("Everything is above its minimum stock. No restock needed.", "Lahat ay lampas sa minimum stock. Hindi pa kailangang mag-restock.");
    return L("These need restocking:", "Kailangan nang i-restock ang mga ito:") + "\n" +
      fmtList(o.map(n => cap(n) + L(": out of stock", ": ubos na")).concat(lw.map(n => cap(n) + ": " + available(products[n]) + L(" left (minimum ", " na lang (minimum ") + products[n].min_stock + ")")));
  }
  if (has("expired")) {
    const x = expList().filter(i => i.d < 0);
    return x.length ? L("These batches have expired and can't be sold:", "Expired na ang mga batch na ito at hindi na puwedeng ibenta:") + "\n" + fmtList(x.map(i => cap(i.n) + " (" + fmtDate(i.e) + ")"))
      : L("No expired batches right now.", "Walang expired na batch ngayon.");
  }
  if (has("expiring", "soon", "malapit", "expire", "expiry", "mag-expire")) {
    const x = expList().filter(i => i.d >= 0);
    return x.length ? L("Expiring within 7 days:", "Mag-e-expire sa loob ng 7 araw:") + "\n" + fmtList(x.map(i => cap(i.n) + " · " + fmtDate(i.e) + " (" + (i.d === 0 ? L("today", "ngayon") : i.d + L(i.d === 1 ? " day left" : " days left", " araw na lang")) + ")"))
      : L("Nothing expires in the next 7 days.", "Walang mag-e-expire sa susunod na 7 araw.");
  }
  if (has("how", "ilan", "ilang") && has("many", "products", "items", "product") && !has("sold"))
    return L("You have **" + names.length + "** products in the inventory.", "May **" + names.length + "** na product sa inventory.");

  // 11. Store info
  if (has("store", "tindahan", "address", "contact", "located", "location")) {
    return "**" + settings.name + "**" + (settings.address ? "\n" + settings.address : "") + (settings.contact ? "\n" + settings.contact : "") +
      (!settings.address && !settings.contact ? "\n" + L("No address or contact is set yet.", "Wala pang naka-set na address o contact.") : "");
  }

  // 12. Listahan ng products
  if (has("products", "product", "items", "item", "list", "menu", "available", "stock", "meron", "mayroon", "sell", "tinda", "paninda", "what", "ano")) {
    const avail = names.filter(n => available(products[n]) > 0).sort();
    if (!avail.length) return L("No products are available right now.", "Walang available na product ngayon.");
    return L("Here's what's available right now:", "Ito ang available ngayon:") + "\n" + fmtList(avail.map(n => cap(n) + " · " + peso(products[n].price) + " · " + available(products[n]) + L(" in stock", " ang stock")));
  }

  // 13. Hindi naintindihan
  const asking = PRICE || QTY || AVAIL || EXP;
  const stop = new Set(["the", "a", "an", "is", "are", "of", "do", "you", "we", "how", "much", "many", "what", "ang", "ng", "ba", "po", "mga", "sa", "kayo", "ninyo", "still", "can", "i", "may", "pa", "for", "to", "in", "and", "is"]);
  const unknown = w.filter(x => x.length > 2 && !stop.has(x) && !TL_WORDS.has(x) && !["price", "cost", "stock", "left", "have", "available", "expire", "expiry", "magkano", "meron", "mayroon", "ilan", "presyo"].includes(x));
  if (asking && unknown.length)
    return L("I couldn't find \"" + unknown[0] + "\" in the inventory. Ask \"What's available?\" to see what we carry.",
      "Wala akong nakitang \"" + unknown[0] + "\" sa inventory. Itanong ang \"Ano ang available?\" para makita ang mga paninda.");
  return L("I'm not sure I understood that. Try asking about a product's price or stock, what's low or expiring" + (admin ? ", or today's sales." : "."),
    "Hindi ko masyadong naintindihan. Subukang magtanong tungkol sa presyo o stock ng product, mga paubos o malapit mag-expire" + (admin ? ", o benta ngayon." : "."));
}

function productAnswer(n, intent, L, admin, todayQ) {
  const p = products[n], nm = cap(n), a = available(p), tot = totalStock(p);
  const live = p.batches.filter(b => b.quantity > 0 && !isExpired(b.expiry)).map(b => b.expiry).sort();
  const near = live[0], dl = near ? daysLeft(near) : null;
  const expiredQty = p.batches.filter(b => b.quantity > 0 && isExpired(b.expiry)).reduce((s, b) => s + b.quantity, 0);
  switch (intent) {
    case "price": return L(nm + " costs **" + peso(p.price) + "**.", "Ang " + nm + " ay **" + peso(p.price) + "**.") + (a ? "" : L(" It's out of stock right now, though.", " Pero ubos ito ngayon."));
    case "qty": return a ? L("There are **" + a + "** sellable " + nm + " in stock", "May **" + a + "** na sellable na " + nm) + (expiredQty ? L(" (plus " + expiredQty + " expired that can't be sold).", " (at " + expiredQty + " na expired na hindi puwedeng ibenta).") : ".")
      : L(nm + " is out of stock" + (expiredQty ? ": the remaining " + expiredQty + " have expired." : "."), "Ubos na ang " + nm + (expiredQty ? ": expired na ang natitirang " + expiredQty + "." : "."));
    case "avail": return a ? L("Yes, we have " + nm + ". **" + a + "** available at " + peso(p.price) + " each.", "Oo, meron kaming " + nm + ". **" + a + "** ang available sa " + peso(p.price) + " bawat isa.") + (a <= p.min_stock ? L(" Stock is running low.", " Paubos na ito.") : "")
      : L("Sorry, " + nm + " is out of stock" + (expiredQty ? " (the remaining stock has expired)." : "."), "Pasensya, ubos na ang " + nm + (expiredQty ? " (expired na ang natitirang stock)." : "."));
    case "exp":
      if (!near) return expiredQty ? L("All remaining " + nm + " stock has expired. Don't sell it.", "Expired na ang lahat ng natitirang " + nm + ". Huwag na itong ibenta.") : L(nm + " has no stock, so there's no expiry date to check.", "Walang stock ang " + nm + ", kaya walang expiry na titingnan.");
      return (dl === 0 ? L("The nearest " + nm + " batch expires **today** (" + fmtDate(near) + "). Sell it first.", "Ngayong araw (**" + fmtDate(near) + "**) mag-e-expire ang pinakamalapit na batch ng " + nm + ". Unahin itong ibenta.")
        : dl <= 7 ? L("Yes, it's still good. The nearest batch expires on **" + fmtDate(near) + "**, in " + dl + " days, so sell it soon.", "Oo, puwede pa. Mag-e-expire ang pinakamalapit na batch sa **" + fmtDate(near) + "**, " + dl + " araw na lang, kaya unahin itong ibenta.")
        : L("Yes, " + nm + " is still good. The nearest batch expires on **" + fmtDate(near) + "**.", "Oo, puwede pa ang " + nm + ". Ang pinakamalapit na expiry ay **" + fmtDate(near) + "**.")) +
        (expiredQty ? L(" Note: " + expiredQty + " units in an older batch have expired.", " Paalala: may " + expiredQty + " na expired sa lumang batch.") : "");
    case "cat": return L(nm + " is under **" + p.category + "**.", "Ang " + nm + " ay nasa **" + p.category + "**.");
    case "code": return L("The barcode of " + nm + " is **" + p.barcode + "**.", "Ang barcode ng " + nm + " ay **" + p.barcode + "**.");
    case "batch": return L(nm + " has " + p.batches.length + " batch(es):", "May " + p.batches.length + " na batch ang " + nm + ":") + "\n" +
      p.batches.map((b, i) => "• " + L("Batch ", "Batch ") + (i + 1) + ": " + b.quantity + L(" units, expires ", " piraso, expiry ") + fmtDate(b.expiry) + (isExpired(b.expiry) ? L(" (expired)", " (expired)") : "")).join("\n");
    case "sold": {
      if (!admin) {
        if (!todayQ) return L("Sales history per product is only available to administrators. Ask \"how many " + n + " did I sell today\" instead.", "Para sa administrator lang ang lumang benta bawat product. Itanong ang \"ilang " + n + " ang nabenta ko ngayon\".");
        let u2 = 0; liveSales().filter(s => s.cashier === user.name && s.t.slice(0, 10) === today()).forEach(s => s.items.forEach(i => { if (i.name === n) u2 += i.qty; }));
        return u2 ? L("You sold **" + u2 + "** " + nm + " today.", "Nakabenta ka ng **" + u2 + "** na " + nm + " ngayong araw.") : L("You haven't sold any " + nm + " today.", "Wala ka pang nabentang " + nm + " ngayong araw.");
      }
      let units = 0, amt = 0, wk = 0;
      const since = dkey(daysAgo(6));
      liveSales().forEach(s => s.items.forEach(i => { if (i.name === n) { units += i.qty; amt += i.qty * i.price; if (s.t.slice(0, 10) >= since) wk += i.qty; } }));
      return units ? L("We've sold **" + units + "** " + nm + " in total (" + peso(amt) + "), " + wk + " of them in the last 7 days.", "Nakabenta tayo ng **" + units + "** na " + nm + " (" + peso(amt) + "), " + wk + " dito ay sa nakaraang 7 araw.")
        : L("No " + nm + " has been sold yet.", "Wala pang nabentang " + nm + ".");
    }
    default:
      return "**" + nm + "** · " + p.category + "\n• " + L("Price: ", "Presyo: ") + peso(p.price) + "\n• " + L("Available: ", "Available: ") + a + (tot !== a ? L(" (of " + tot + " total)", " (sa " + tot + " lahat)") : "") +
        "\n• " + L("Nearest expiry: ", "Pinakamalapit na expiry: ") + (near ? fmtDate(near) : L("none", "wala")) + (a === 0 ? "\n" + L("It's out of stock right now.", "Ubos ito ngayon.") : a <= p.min_stock ? "\n" + L("Stock is running low.", "Paubos na ito.") : "");
  }
}

function salesAnswer(w, has, L, admin, tl) {
  const S = new Set(w);
  const mine = has("my", "i", "me", "ko", "akin", "ako", "ikaw");
  // Employee: benta NGAYONG ARAW lang. Bawal ang lumang benta at mga report ng buong store.
  if (!admin) {
    const todayWords = has("today", "ngayon", "ngayong");
    const otherPeriod = has("yesterday", "kahapon", "week", "weeks", "weekly", "linggo", "month", "months", "monthly", "buwan", "year", "years", "taon",
      "all", "total", "lahat", "overall", "ever", "history", "previous", "nakaraan", "noon", "10", "30", "7", "days") || (has("araw") && !todayWords);
    const reportWords = has("top", "best", "bestseller", "bestsellers", "pinakamabenta", "mabenta", "most", "popular", "least", "worst", "slow", "pinakamahina", "matumal",
      "average", "avg", "cashier", "cashiers", "employees", "staff", "void", "voided", "cancelled", "canceled", "revenue", "income", "kita", "kinita");
    if (otherPeriod || reportWords)
      return L("Sorry, sales history and store reports are only available to administrators. I can only show your sales for **today**. Try asking \"my sales today\".",
        "Pasensya, para sa administrator lang ang lumang benta at mga report ng store. Ang benta mo lang **ngayong araw** ang maipapakita ko. Subukang itanong ang \"benta ko ngayon\".");
    const td = liveSales().filter(s => s.cashier === user.name && s.t.slice(0, 10) === today());
    if (!td.length) return L("You haven't made any sales today yet.", "Wala ka pang benta ngayong araw.");
    const tot = td.reduce((a, s) => a + s.total, 0), units = td.reduce((a, s) => a + s.items.reduce((b, i) => b + i.qty, 0), 0);
    if (has("recent", "latest", "last", "huling", "pinakahuli", "transactions", "transaction", "receipts"))
      return L("Your sales today:", "Ang mga benta mo ngayong araw:") + "\n" + td.slice(-5).reverse().map(s => "• " + rno(s.no) + " · " + s.t.slice(11) + " · " + peso(s.total)).join("\n");
    return L("Today you made **" + td.length + "** sale" + (td.length === 1 ? "" : "s") + " totaling **" + peso(tot) + "** (" + units + " items).",
      "Ngayong araw, nakagawa ka ng **" + td.length + "** na benta na may kabuuang **" + peso(tot) + "** (" + units + " na item).") +
      "\n" + L("Your latest: ", "Ang pinakahuli mo: ") + rno(td[td.length - 1].no) + " · " + td[td.length - 1].t.slice(11) + " · " + peso(td[td.length - 1].total);
  }
  const live = liveSales();
  // Panahon
  let from = null, label = L("in total", "sa lahat");
  if (has("yesterday", "kahapon")) { from = 1; label = L("yesterday", "kahapon"); }
  else if (S.has("10") || has("ten", "sampung")) { from = 9; label = L("in the last 10 days", "sa nakaraang 10 araw"); }
  else if (has("week", "weeks", "weekly", "linggo") || S.has("7")) { from = 6; label = L("in the last 7 days", "sa nakaraang 7 araw"); }
  else if (has("month", "months", "monthly", "buwan") || S.has("30")) { from = 29; label = L("in the last 30 days", "sa nakaraang 30 araw"); }
  else if (has("today", "ngayon", "ngayong")) { from = 0; label = L("today", "ngayong araw"); }
  const inRange = s => from === null ? true : from === 1 ? s.t.slice(0, 10) === dkey(daysAgo(1)) : s.t.slice(0, 10) >= dkey(daysAgo(from));
  const set = live.filter(inRange);

  if (has("void", "voided", "cancelled", "canceled")) {
    const v = sales.filter(s => s.void);
    return v.length ? L("There are **" + v.length + "** voided sales:", "May **" + v.length + "** na na-void na benta:") + "\n" + v.slice(-5).reverse().map(s => "• " + rno(s.no) + " · " + peso(s.total) + " · " + s.void.reason).join("\n")
      : L("No sales have been voided.", "Walang na-void na benta.");
  }
  if (has("recent", "latest", "last", "huling", "pinakahuli") && !has("week", "month", "linggo", "buwan", "days", "day", "araw", "today", "yesterday", "kahapon")) {
    const m = w.find(x => /^\d+$/.test(x)), n = Math.min(10, m ? +m : 5), list = sales.slice(-n).reverse();
    return list.length ? L("The last " + list.length + " transactions:", "Ang huling " + list.length + " na transaction:") + "\n" +
      list.map(s => "• " + rno(s.no) + " · " + s.t.replace("T", " ") + " · " + peso(s.total) + (s.cashier ? " · " + s.cashier : "") + (s.void ? L(" (voided)", " (void)") : "")).join("\n") : L("There are no transactions yet.", "Wala pang transaction.");
  }
  if (has("top", "best", "bestseller", "bestsellers", "pinakamabenta", "mabenta", "most", "popular")) {
    const m = {}; set.forEach(s => s.items.forEach(i => m[i.name] = (m[i.name] || 0) + i.qty));
    const top = Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return top.length ? L("Top-selling products " + label + ":", "Pinakamabenta " + label + ":") + "\n" + top.map((t, i) => "• " + (i + 1) + ". " + cap(t[0]) + " · " + t[1] + L(" sold", " nabenta")).join("\n")
      : L("No sales " + label + " yet.", "Wala pang benta " + label + ".");
  }
  if (has("least", "worst", "slow", "pinakamahina", "matumal")) {
    const m = {}; Object.keys(products).forEach(n => m[n] = 0); set.forEach(s => s.items.forEach(i => { if (i.name in m) m[i.name] += i.qty; }));
    const low = Object.entries(m).sort((a, b) => a[1] - b[1]).slice(0, 3);
    return L("Slowest-moving products " + label + ":", "Pinakamatumal " + label + ":") + "\n" + low.map(t => "• " + cap(t[0]) + " · " + t[1] + L(" sold", " nabenta")).join("\n");
  }
  if (has("cashier", "cashiers", "employee", "employees", "staff")) {
    const m = {}; set.forEach(s => { const c = s.cashier || "unknown"; m[c] = m[c] || {n: 0, t: 0}; m[c].n++; m[c].t += s.total; });
    const e = Object.entries(m).sort((a, b) => b[1].t - a[1].t);
    return e.length ? L("Sales per cashier " + label + ":", "Benta bawat cashier " + label + ":") + "\n" + e.map(x => "• " + x[0] + " · " + x[1].n + L(" sales · ", " benta · ") + peso(x[1].t)).join("\n") : L("No sales " + label + " yet.", "Wala pang benta " + label + ".");
  }
  const tot = set.reduce((a, s) => a + s.total, 0);
  if (has("average", "avg", "karaniwan"))
    return set.length ? L("The average sale " + label + " is **" + peso(tot / set.length) + "** across " + set.length + " transactions.", "Ang average na benta " + label + " ay **" + peso(tot / set.length) + "** mula sa " + set.length + " na transaction.")
      : L("No sales " + label + " yet.", "Wala pang benta " + label + ".");
  if (from === null && !has("total", "all", "lahat", "overall", "ever")) return salesAnswer(w.concat(["today"]), (...a) => a.some(x => S.has(x) || x === "today"), L, admin, tl);
  const units = set.reduce((a, s) => a + s.items.reduce((b, i) => b + i.qty, 0), 0);
  return set.length ? L("Sales " + label + ": **" + peso(tot) + "** from " + set.length + " transaction" + (set.length === 1 ? "" : "s") + " (" + units + " items sold).",
    "Benta " + label + ": **" + peso(tot) + "** mula sa " + set.length + " na transaction (" + units + " na item ang nabenta).")
    : L("No sales " + label + " yet.", "Wala pang benta " + label + ".");
}

start();
