/* Step 2 of the pay flow: pick the plan and work out the amount. */

(function () {
  "use strict";

  var M = window.AccountingModel;

  /* Skipping step 1 sends you back to it. */
  var draft = M.requireDraft(["studentNumber", "studentName", "email"], "pay.php");
  if (!draft) return;

  var soaList     = document.getElementById("soaList");
  var soaTotalRow = document.getElementById("soaTotalRow");
  var soaTotalEl  = document.getElementById("soaTotal");
  var soaMeta     = document.getElementById("soaMeta");
  var priceFull   = document.getElementById("priceFull");
  var priceDown   = document.getElementById("priceDown");
  var downDesc    = document.getElementById("downDesc");
  var customWrap  = document.getElementById("customWrap");
  var customInput = document.getElementById("customAmount");
  var payNowEl    = document.getElementById("payNow");
  var payingAs    = document.getElementById("payingAs");
  var form        = document.getElementById("amountForm");
  var msg         = document.getElementById("amountMsg");
  var offlineNote = document.getElementById("offlineNote");

  var total = 0;

  soaMeta.textContent = "S.Y. " + M.SCHOOL_YEAR + " · " + M.SEMESTER;
  payingAs.textContent = "Paying as " + draft.studentName + " (" + draft.studentNumber + ").";

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

  M.fetchFees().then(function (result) {
    if (result.offline && offlineNote) offlineNote.hidden = false;

    total = M.money(M.totalOf(result.fees));

    soaList.innerHTML = "";
    result.fees.forEach(function (f) {
      var li = document.createElement("li");
      li.className = "soa__row";
      li.innerHTML =
        '<span class="soa__name">' + esc(f.name) +
          (f.note ? '<span class="soa__note">' + esc(f.note) + "</span>" : "") +
        "</span>" +
        '<span class="soa__amount">' + M.formatPeso(f.amount) + "</span>";
      soaList.appendChild(li);
    });

    soaTotalEl.textContent = M.formatPeso(total);
    soaTotalRow.hidden = false;

    priceFull.textContent = M.formatPeso(total);
    priceDown.textContent = M.formatPeso(M.money(total * M.DOWNPAYMENT_RATE));
    downDesc.textContent =
      "Pay " + Math.round(M.DOWNPAYMENT_RATE * 100) + "% now (" +
      M.formatPeso(M.money(total * M.DOWNPAYMENT_RATE)) +
      ") and settle the balance later.";

    /* Restore the earlier choice once the totals are known. */
    if (draft.plan) {
      var prev = form.querySelector('input[name="plan"][value="' + draft.plan + '"]');
      if (prev) prev.checked = true;
    }
    if (draft.plan === "custom" && draft.amount) customInput.value = draft.amount;

    refreshPayNow();
  });

  function selectedPlan() {
    var checked = form.querySelector('input[name="plan"]:checked');
    return checked ? checked.value : "full";
  }

  /* Recalculate the "Amount to pay now" figure. */
  function refreshPayNow() {
    var plan = selectedPlan();
    customWrap.hidden = plan !== "custom";

    var amount = M.amountForPlan(plan, total, customInput.value);
    payNowEl.textContent = M.formatPeso(amount);
    return amount;
  }

  form.addEventListener("change", refreshPayNow);
  customInput.addEventListener("input", refreshPayNow);

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var plan = selectedPlan();
    var amount = refreshPayNow();

    if (plan === "custom") {
      var typed = Number(customInput.value);
      if (!typed || typed < M.MIN_CUSTOM_PAYMENT) {
        customInput.classList.add("is-invalid");
        return setMsg("Please enter an amount of at least " + M.formatPeso(M.MIN_CUSTOM_PAYMENT) + ".", "is-error");
      }
      customInput.classList.remove("is-invalid");
    }

    if (amount <= 0) {
      return setMsg("Your assessment hasn't loaded yet. Please wait a moment and try again.", "is-error");
    }

    setMsg("");
    M.saveDraft({ plan: plan, amount: amount });
    location.href = "pay-method.php";
  });
})();
