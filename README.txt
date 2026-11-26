RetailBot - Smart Chatbot Integration for Mini Grocery Inventory Management (HTML version)

HOW TO RUN
1. Extract (unzip) this folder.
2. Double-click index.html. It opens in Chrome or Edge.
   (Or in VS Code: right-click index.html > Open with Live Server.)

FILES AND LANGUAGES
index.html      HTML       page structure (login, menu, containers)
css/style.css   CSS        design and layout
js/demo-data.js JavaScript demo store data: 37 products and 30 days of sales (dates follow today)
js/app.js       JavaScript login, products, scan and checkout, receipts, edit product
js/extra.js     JavaScript dashboard (with alerts notification), sales and reports, data management, accounts
js/chatbot.js   JavaScript Ask RetailBot: chatbot, typing animation (5 seconds), chat history
js/login-fx.js  JavaScript animated login/register: stars, terminal log, success check
register.html   HTML       create an EMPLOYEE account (not linked from the login page)
js/register.js  JavaScript register form

LIBRARY (loaded from the internet): html5-qrcode (camera barcode and QR scanning)
DATA: saved in the browser (localStorage). Use Data Management > Backup to keep a copy.

CHATBOT
- Answers from the store data shown in the system (no internet or AI API needed).
- Administrator: sees products, stock, expiry, sales, reports, receipts and accounts.
  The History on the left shows ALL conversations (admin and employees), with the username under each one.
  Opening an employee's conversation is read-only.
- Employee: products, stock, prices, expiry, and their own sales for TODAY only (resets every day).
  Sales history, monthly/weekly totals, top sellers and other reports are blocked. Always starts a new chat.
- It does not reset, delete, back up or restore data. Use Data Management for that.

REGISTER (hidden)
- Open it by typing register.html instead of index.html in the address bar,
  e.g. https://<username>.github.io/<repo>/register.html
- It only creates Employee accounts. Admin accounts are still created in Accounts.

LOGIN ANIMATION
- Space background with stars and orbit rings, glass "WELCOME BACK" card and a terminal (auth.log) that types while you sign in.
- Wrong password: the card shakes and the terminal shows a red error.
- Correct password: glowing border, particles, green check, then the card grows into a
  "WELCOME, ADMINISTRATOR" screen (hologram ring, store numbers, loading bar, terminal)
  and the dashboard builds itself piece by piece.
