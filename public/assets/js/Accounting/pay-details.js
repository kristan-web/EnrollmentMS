/* Step 1 of the pay flow: collect the student's details and show the statement. */

(function () {
  "use strict";

  var M = window.AccountingModel;

  var soaList     = document.getElementById("soaList");
  var soaTotalRow = document.getElementById("soaTotalRow");
  var soaTotalEl  = document.getElementById("soaTotal");
  var soaMeta     = document.getElementById("soaMeta");
  var form        = document.getElementById("detailsForm");
  var msg         = document.getElementById("detailsMsg");
  var offlineNote = document.getElementById("offlineNote");

  soaMeta.textContent = "S.Y. " + M.SCHOOL_YEAR + " · " + M.SEMESTER;

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

  /* Draw the statement so the student sees what they're paying for. */
  M.fetchFees().then(function (result) {
    if (result.offline && offlineNote) offlineNote.hidden = false;

    var total = M.money(M.totalOf(result.fees));

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
  });

  /* Coming back from step 2 refills what was already typed. */
  var draft = M.getDraft();
  if (draft.studentNumber) form.elements.studentNumber.value = draft.studentNumber;
  if (draft.studentName)   form.elements.studentName.value = draft.studentName;
  if (draft.email)         form.elements.email.value = draft.email;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var sNum   = form.elements.studentNumber.value.trim();
    var sName  = form.elements.studentName.value.trim();
    var sEmail = form.elements.email.value.trim();

    [form.elements.studentNumber, form.elements.studentName, form.elements.email]
      .forEach(function (el) { el.classList.remove("is-invalid"); });

    if (!sNum)  form.elements.studentNumber.classList.add("is-invalid");
    if (!sName) form.elements.studentName.classList.add("is-invalid");
    var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sEmail);
    if (!emailOk) form.elements.email.classList.add("is-invalid");

    if (!sNum || !sName || !emailOk) {
      return setMsg("Please fill in your student number, name and a valid email first.", "is-error");
    }

    setMsg("");
    M.saveDraft({ studentNumber: sNum, studentName: sName, email: sEmail });
    location.href = "pay-amount.php";
  });
})();
