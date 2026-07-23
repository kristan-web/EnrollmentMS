/* Controller for status.php: looks up a payment reference and shows a badge.
   Badge classes come from portal.css. */

(function () {
  "use strict";

  var M = window.AccountingModel;
  var form   = document.getElementById("statusForm");
  var btn    = document.getElementById("statusBtn");
  var msg    = document.getElementById("statusMsg");
  var result = document.getElementById("statusResult");

  function setMsg(text, type) {
    msg.textContent = text || "";
    msg.classList.remove("is-error", "is-success");
    if (type) msg.classList.add(type);
  }

  /* PayMongo status -> badge colour + wording. */
  function badgeFor(status) {
    if (status === "paid")     return { cls: "badge--approved", label: "Paid" };
    if (status === "unpaid")   return { cls: "badge--pending",  label: "Not paid yet" };
    if (status === "expired")  return { cls: "badge--rejected", label: "Expired" };
    return { cls: "badge--review", label: status || "Unknown" };
  }

  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* Draw the result box once PHP replies. */
  function render(data) {
    var b = badgeFor(data.status);
    var amount = data.amount != null ? M.formatPeso(data.amount) : "—";

    result.innerHTML =
      '<div class="review-block" style="margin-top:20px;">' +
        '<div class="review-block__head">Payment Result <span class="badge ' + b.cls + '">' + b.label + "</span></div>" +
        '<dl class="review-grid">' +
          "<div><dt>Reference</dt><dd style=\"font-family:'Roboto Mono',monospace;\">" + esc(data.reference || data.session || "—") + "</dd></div>" +
          "<div><dt>Amount</dt><dd>" + amount + "</dd></div>" +
          "<div><dt>Payer</dt><dd>" + esc(data.payer_name || "—") + "</dd></div>" +
          "<div><dt>Description</dt><dd>" + esc(data.description || "—") + "</dd></div>" +
        "</dl>" +
      "</div>";
    result.hidden = false;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var session = form.elements.session.value.trim();
    form.elements.session.classList.remove("is-invalid");

    if (!session) {
      form.elements.session.classList.add("is-invalid");
      return setMsg("Please enter your payment reference.", "is-error");
    }

    setMsg("");
    result.hidden = true;
    result.innerHTML = '<div class="acct-spinner"></div>';
    result.hidden = false;
    btn.disabled = true;

    M.fetchStatus(session).then(function (data) {
      if (data && data.success) {
        render(data);
      } else {
        result.hidden = true;
        setMsg((data && data.message) || "We couldn't find that reference. Please double-check and try again.", "is-error");
      }
    }).catch(function () {
      result.hidden = true;
      setMsg("We couldn't reach the server. Please try again in a bit.", "is-error");
    }).then(function () {
      btn.disabled = false;
    });
  });
})();
