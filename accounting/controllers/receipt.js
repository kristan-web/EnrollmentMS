/* Controller for receipt.html: reads the URL PayMongo returned to and draws
   the matching screen.
     ?ref=SOA-...      -> treated as paid, since PayMongo only redirects on success
     ?session=cs_...   -> ask PayMongo for the exact status
   Definitive confirmation needs a webhook once there's a database. */

(function () {
  "use strict";

  var M = window.AccountingModel;
  var body = document.getElementById("receiptBody");

  var params  = new URLSearchParams(location.search);
  var session = params.get("session");
  var ref     = params.get("ref");
  var amount  = params.get("amt");
  var cancelled = params.get("cancelled");

  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* Same buttons on every state. */
  function actions() {
    return (
      '<div class="wizard-nav" style="justify-content:center;border-top:none;padding-top:20px;gap:12px;flex-wrap:wrap;">' +
        '<a class="btn btn--ghost" href="pay.html">Pay another fee</a>' +
        '<a class="btn btn--primary" href="../index.html">Back to Cashier</a>' +
      "</div>"
    );
  }

  /* Small receipt table. */
  function lines(items) {
    var rows = items.map(function (it) {
      return '<div class="receipt-lines__row"><dt>' + esc(it[0]) + "</dt><dd>" + esc(it[1]) + "</dd></div>";
    }).join("");
    return '<div class="receipt-lines">' + rows + "</div>";
  }

  /* Render one result screen. */
  function showResult(icon, iconCls, title, message, receiptRows, extra) {
    body.innerHTML =
      '<div class="receipt__icon ' + iconCls + '">' + icon + "</div>" +
      "<h2>" + esc(title) + "</h2>" +
      "<p>" + message + "</p>" +
      (receiptRows ? lines(receiptRows) : "") +
      (extra || "") +
      actions();
  }

  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
  var CLOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
  var CROSS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';

  var WEBHOOK_NOTE =
    '<p style="font-size:12.5px;color:var(--ink-3);max-width:440px;margin:14px auto 0;">' +
    "Keep this reference for your records. Official confirmation is finalized by " +
    "the cashier once the payment clears.</p>";

  /* Pick the screen. */

  if (cancelled) {
    showResult(CROSS, "receipt__icon--failed", "Payment cancelled",
      "No worries — you weren't charged. You can go back and try again whenever you're ready.");
    return;
  }

  if (session) {
    M.fetchStatus(session).then(function (data) {
      if (!data || !data.success) {
        showResult(CLOCK, "receipt__icon--pending", "We couldn't confirm this yet",
          "We couldn't read this payment's status right now. Please try the Check a Payment page in a few minutes.");
        return;
      }
      var rows = [
        ["Reference", data.reference || session],
        ["Amount", data.amount != null ? M.formatPeso(data.amount) : "—"],
        ["Payer", data.payer_name || "—"]
      ];
      if (data.status === "paid") {
        showResult(CHECK, "receipt__icon--paid", "Payment received!",
          "Thank you! Your payment was received by PayMongo. A copy of the receipt was emailed to you.",
          rows, WEBHOOK_NOTE);
      } else if (data.status === "unpaid") {
        showResult(CLOCK, "receipt__icon--pending", "Payment not completed",
          "This payment hasn't been completed yet. If you already paid, give it a minute and check again.", rows);
      } else {
        showResult(CROSS, "receipt__icon--failed", "Payment " + esc(data.status),
          "This payment didn't go through. You can head back and try again.", rows);
      }
    }).catch(function () {
      showResult(CLOCK, "receipt__icon--pending", "We couldn't confirm this yet",
        "We couldn't reach the server to confirm your payment. Please try the Check a Payment page shortly.");
    });
    return;
  }

  if (ref) {
    var rows = [["Reference", ref]];
    if (amount) rows.push(["Amount paid", M.formatPeso(amount)]);
    showResult(CHECK, "receipt__icon--paid", "Payment received!",
      "Thank you! Your school fee payment was successful. Please keep your reference number below.",
      rows, WEBHOOK_NOTE);
    return;
  }

  /* Nothing in the URL: the page was opened directly. */
  showResult(CLOCK, "receipt__icon--pending", "No payment to show",
    "This page shows your receipt after you pay. Head to the payment page to get started.");
})();
