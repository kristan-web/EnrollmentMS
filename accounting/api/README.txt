========================================================================
 ACCOUNTING MODULE — PayMongo backend (READ ME)
========================================================================

Hi! This is the accounting / cashier module for the Enrollment Management
System. It lets a student pay their school fees online using PayMongo
(GCash, Maya, GrabPay or a card).

It's built the same way as the rest of the project:
    Controllers  ->  Models  ->  Dao   (just like enrollment/section/etc.)
...except the "Dao" here talks to the PayMongo API instead of MySQL,
because there is NO DATABASE yet (that's the next step).

------------------------------------------------------------------------
 FOLDER MAP
------------------------------------------------------------------------
accounting/
  index.html                      landing page
  assets/css/accounting.css       accounting-only styles (theme = portal.css)
  models/accounting-model.js      shared front-end helpers (NO localStorage)
  controllers/
     home.js                      landing page
     pay.js                       the pay page logic
     status.js                    "check my payment" logic
     receipt.js                   the page PayMongo returns to
  views/
     pay.html                     statement of account + pay
     status.html                  look up a payment
     receipt.html                 receipt after paying
  api/                            <-- the PHP backend
     config/paymongo.php          >>> PUT YOUR KEYS HERE <<<
     Models/payment_model.php     fee list + validation
     Dao/PayMongoDAO.php          the cURL calls to PayMongo
     Controllers/payments_controllers.php   the router

------------------------------------------------------------------------
 HOW TO MAKE IT WORK (3 steps)
------------------------------------------------------------------------
1. Put the project inside your XAMPP "htdocs" folder and start Apache.
   (PHP + the cURL extension must be on — cURL is on by default in XAMPP.)

2. Make a free PayMongo account -> https://dashboard.paymongo.com
   Go to Developers > API Keys and copy your TEST keys.
   Open  accounting/api/config/paymongo.php  and paste them into:
        PAYMONGO_SECRET_KEY   (sk_test_....)
        PAYMONGO_PUBLIC_KEY   (pk_test_....)

3. Open the module in your browser, e.g.
        http://localhost/EnrollmentMS-Fixed-File-structure/accounting/
   Click "Pay School Fees", fill in the details, and pay.
   In TEST mode you can use PayMongo's test GCash/card so no real money moves.

That's it — the JavaScript is "plug and play": it already knows where the
PHP is, so once the keys are in, paying just works.

------------------------------------------------------------------------
 CHANGING THE FEES
------------------------------------------------------------------------
The fee amounts live in:
    api/Models/payment_model.php   ->  FeeSchedule::items()   (this is the boss)
There's a matching copy in:
    models/accounting-model.js     ->  FALLBACK_FEES          (offline preview)
If you edit one, edit the other so they match.

------------------------------------------------------------------------
 THINGS TO DO LATER (when we add the database)
------------------------------------------------------------------------
- Save each payment attempt + result into a "payments" table.
- Add a PayMongo WEBHOOK so payments are confirmed automatically and
  securely (right now the receipt page trusts PayMongo's redirect).
- Load a REAL per-student statement of account instead of one fixed list.
========================================================================
