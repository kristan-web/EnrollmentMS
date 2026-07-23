/* Step 3 of the pay flow: pick a method, review, then start the checkout. */

(function () {
  "use strict";

  var M = window.AccountingModel;

  /* Skipping the earlier steps sends you back to them. */
  var draft = M.requireDraft(["studentNumber", "studentName", "email", "plan", "amount"], "pay.php");
  if (!draft) return;

  var methodList  = document.getElementById("methodList");
  var reviewLines = document.getElementById("reviewLines");
  var payNowEl    = document.getElementById("payNow");
  var form        = document.getElementById("methodForm");
  var msg         = document.getElementById("methodMsg");
  var payBtn      = document.getElementById("payBtn");
  var offlineNote = document.getElementById("offlineNote");

  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function setMsg(text, type) {
    msg.textContent = text || "";
    msg.classList.remove("is-error", "is-success");
    if (type) msg.classList.add(type);
  }

  function planLabel(plan) {
    if (plan === "full") return "Pay in Full";
    if (plan === "down") return "Down Payment";
    return "Partial / Custom";
  }

  payNowEl.textContent = M.formatPeso(draft.amount);

  /* Review rail. */
  [
    ["Student No.", draft.studentNumber],
    ["Name", draft.studentName],
    ["Email", draft.email],
    ["Term", M.SCHOOL_YEAR + " · " + M.SEMESTER],
    ["Option", planLabel(draft.plan)],
    ["Amount", M.formatPeso(draft.amount)]
  ].forEach(function (row) {
    var div = document.createElement("div");
    div.className = "receipt-lines__row";
    div.innerHTML = "<dt>" + esc(row[0]) + "</dt><dd>" + esc(row[1]) + "</dd>";
    reviewLines.appendChild(div);
  });

  /* Method options, built from the model so the codes stay in one place. */
  M.METHODS.forEach(function (m, i) {
    var label = document.createElement("label");
    label.className = "plan plan--method";
    label.innerHTML =
      '<input type="radio" name="method" value="' + esc(m.code) + '"' + (i === 0 ? " checked" : "") + " />" +
      '<span class="plan__dot" aria-hidden="true"></span>' +
      '<img class="plan__logo" src="/EnrollmentMS/public/assets/images/accounting/' + esc(m.logo) + '" alt="" aria-hidden="true" />' +
      '<span class="plan__text">' +
        '<span class="plan__name">' + esc(m.name) + "</span>" +
        '<span class="plan__desc">' + esc(m.note) + "</span>" +
      "</span>";
    methodList.appendChild(label);
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var checked = form.querySelector('input[name="method"]:checked');
    if (!checked) {
      return setMsg("Please choose a payment method.", "is-error");
    }

    setMsg("");
    payBtn.disabled = true;
    payBtn.textContent = "Connecting to PayMongo…";

    M.createCheckout({
      studentNumber: draft.studentNumber,
      studentName: draft.studentName,
      email: draft.email,
      plan: draft.plan,
      amount: draft.amount,
      method: checked.value
    }).then(function (data) {
      if (data && data.success && data.checkout_url) {
        setMsg("Redirecting you to PayMongo…", "is-success");
        M.clearDraft();
        window.location.href = data.checkout_url;
      } else {
        setMsg((data && data.message) || "Sorry, we couldn't start the payment. Please try again.", "is-error");
        resetBtn();
      }
    }).catch(function () {
      if (offlineNote) offlineNote.hidden = false;
      setMsg("We couldn't reach the payment server. Please check your connection and try again.", "is-error");
      resetBtn();
    });
  });

  function resetBtn() {
    payBtn.disabled = false;
    payBtn.textContent = "Proceed to PayMongo";
  }
})();
