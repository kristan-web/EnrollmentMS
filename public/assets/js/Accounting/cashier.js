// cashier.js \u2014 the accounting-side (cashier) console.
// Follows the "Accounting-side Flow Chart" once the cashier is signed in:
//   fetch students awaiting payment -> pick a valid student -> fetch their
//   statement -> take a payment -> Fully paid? -> update status -> print receipt.
// Also lets the cashier verify uploaded proofs of payment.
(function () {
  "use strict";

  var M = window.CashierModel;
  var peso = M.formatPeso;

  var awaitingRows = document.getElementById("awaitingRows");
  var queueCount   = document.getElementById("queueCount");
  var emptyState   = document.getElementById("emptyState");
  var searchBox    = document.getElementById("searchBox");
  var detailPanel  = document.getElementById("detailPanel");
  var cashierWho   = document.getElementById("cashierWho");
  var logoutBtn    = document.getElementById("logoutBtn");
  var receiptPrint = document.getElementById("receiptPrint");

  var studentModal = document.getElementById("studentModal");
  var studentModalTitle = document.getElementById("studentModalTitle");
  var closeStudentModal = document.getElementById("closeStudentModal");

  var selectedId = null;   // enrollment_id of the open student
  var searchTimer = null;

  // ---- helpers ----------------------------------------------------------
  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function statusClass(status) {
    if (status === "Fully Paid") return "status-badge--paid";
    if (status === "Partial")    return "status-badge--partial";
    return "status-badge--unpaid";
  }

  function badge(status) {
    return '<span class="status-badge ' + statusClass(status) + '">' + esc(status) + "</span>";
  }

  function proofClass(status) {
    if (status === "Verified") return "status-badge--paid";
    if (status === "Rejected") return "status-badge--unpaid";
    return "status-badge--partial";
  }

  function initials(name) {
    var parts = String(name == null ? "" : name).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    var last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
    return (parts[0].charAt(0) + last).toUpperCase();
  }

  function whoHtml(name, role) {
    return (
      '<span class="who__avatar" aria-hidden="true">' + esc(initials(name)) + "</span>" +
      '<span class="who__meta">' +
        '<strong class="who__name">' + esc(name || "") + "</strong>" +
        '<span class="who__role">' + esc(role || "Staff") + "</span>" +
      "</span>"
    );
  }

  // ---- session guard ----------------------------------------------------
  M.requireAuth("index.php").then(function (cashier) {
    if (!cashier) return; // requireAuth already redirected
    // Shown in the sidebar, above Log out.
    cashierWho.innerHTML = whoHtml(cashier.full_name, cashier.role);
    loadQueue("");
  });

  // The sidebar's logout is an <a> for styling, so stop it navigating to "#".
  logoutBtn.addEventListener("click", function (e) {
    e.preventDefault();
    AcctAlert.confirmLogout().then(function (ok) {
      if (ok) M.logout();
    });
  });

  // ---- students awaiting payment ---------------------------------------
  function loadQueue(q) {
    queueCount.textContent = "Loading\u2026";
    M.listAwaiting(q).then(function (data) {
      if (!data || data.authenticated === false) {
        window.location.href = "index.php";
        return;
      }
      renderQueue(data.students || []);
    }).catch(function () {
      queueCount.textContent = "Couldn't load the list.";
    });
  }

  function renderQueue(students) {
    emptyState.hidden = students.length > 0;

    queueCount.textContent = students.length
      ? students.length + (students.length === 1 ? " student" : " students") + " with a balance"
      : "No students awaiting payment";

    // One row per student. The whole row opens the student; the Collect button
    // is the explicit affordance.
    awaitingRows.innerHTML = students.map(function (s) {
      return (
        '<tr class="cash-row" data-id="' + s.enrollment_id + '">' +
          "<td>" + esc(s.student_number || "\u2014") + "</td>" +
          '<td><span class="cell-name">' + esc(s.full_name) + "</span></td>" +
          "<td>" + esc(s.section_name || "\u2014") + "</td>" +
          '<td><span class="cell-sub">' + esc(s.school_year || "") + "<br>" + esc(s.semester || "") + "</span></td>" +
          '<td class="cash-num">' + peso(s.assessment) + "</td>" +
          '<td class="cash-num">' + peso(s.paid) + "</td>" +
          '<td class="cash-num cash-num--bal">' + peso(s.balance) + "</td>" +
          "<td>" + badge(s.status) + "</td>" +
          '<td class="no-print"><div class="row-actions">' +
            '<button type="button" class="btn btn--primary btn--sm" data-open="' + s.enrollment_id + '">Collect</button>' +
          "</div></td>" +
        "</tr>"
      );
    }).join("");
  }

  // Delegate clicks on the table: the Collect button, or anywhere on the row.
  awaitingRows.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-open]");
    if (btn) { selectStudent(btn.getAttribute("data-open")); return; }
    var row = e.target.closest(".cash-row");
    if (row) selectStudent(row.getAttribute("data-id"));
  });

  // Debounced search.
  searchBox.addEventListener("input", function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () { loadQueue(searchBox.value.trim()); }, 250);
  });

  // ---- one student's detail --------------------------------------------
  function openModal() {
    studentModal.hidden = false;
  }

  function closeModal() {
    studentModal.hidden = true;
    selectedId = null;
  }

  closeStudentModal.addEventListener("click", closeModal);
  studentModal.addEventListener("click", function (e) {
    if (e.target === studentModal) closeModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !studentModal.hidden) closeModal();
  });

  function selectStudent(enrollmentId, flash) {
    selectedId = enrollmentId;
    openModal();

    studentModalTitle.textContent = "Student";
    detailPanel.innerHTML = '<div class="acct-spinner"></div><p style="text-align:center;color:var(--ink-3);">Fetching student information\u2026</p>';

    M.getStudent(enrollmentId).then(function (data) {
      if (!data || data.authenticated === false) {
        window.location.href = "index.php";
        return;
      }
      if (!data.success) {
        detailPanel.innerHTML = '<p class="form-msg is-error">' +
          esc(data.message || "That student could not be loaded.") + "</p>";
        return;
      }
      renderDetail(data, flash);
    }).catch(function () {
      detailPanel.innerHTML = '<p class="form-msg is-error">We couldn\'t reach the server. Please try again.</p>';
    });
  }

  function soaRows(items) {
    return items.map(function (f) {
      return '<li class="soa__row"><span class="soa__name">' + esc(f.name) +
        (f.note ? '<span class="soa__note">' + esc(f.note) + "</span>" : "") +
        '</span><span class="soa__amount">' + peso(f.amount) + "</span></li>";
    }).join("");
  }

  function paymentRows(payments) {
    if (!payments.length) {
      return '<p class="cashier-muted">No payments recorded yet.</p>';
    }
    var rows = payments.map(function (p) {
      var when = (p.payment_date || "").replace("T", " ").slice(0, 16);
      return '<div class="receipt-lines__row"><dt>' + esc(when) + " &middot; " + esc(p.payment_method) +
        "</dt><dd>" + peso(p.amount) + "</dd></div>";
    }).join("");
    return '<div class="receipt-lines" style="max-width:none;margin:0;">' + rows + "</div>";
  }

  function proofBlock(proofs) {
    if (!proofs.length) {
      return '<p class="cashier-muted">No proof-of-payment uploads from this student.</p>';
    }
    return proofs.map(function (pr) {
      var pending = pr.status !== "Verified" && pr.status !== "Rejected";
      var meta = [];
      if (pr.amount) meta.push(peso(pr.amount));
      if (pr.method) meta.push(esc(pr.method));
      if (pr.payment_reference) meta.push("Ref " + esc(pr.payment_reference));
      var actions = pending
        ? '<div class="proof__actions">' +
            '<input type="text" class="proof__remarks" data-proof="' + pr.proof_id + '" placeholder="Remarks (optional)" aria-label="Remarks" />' +
            '<button type="button" class="btn btn--sm btn--verify" data-proof="' + pr.proof_id + '" data-decision="Verified">Verify</button>' +
            '<button type="button" class="btn btn--sm btn--reject" data-proof="' + pr.proof_id + '" data-decision="Rejected">Reject</button>' +
          "</div>"
        : (pr.remarks ? '<p class="proof__remark-note">Remarks: ' + esc(pr.remarks) + "</p>" : "");
      return (
        '<div class="proof">' +
          '<div class="proof__head">' +
            '<span class="proof__file">' + esc(pr.original_filename || "Uploaded file") + "</span>" +
            '<span class="status-badge ' + proofClass(pr.status) + '">' + esc(pr.status) + "</span>" +
          "</div>" +
          (meta.length ? '<p class="proof__meta">' + meta.join(" &middot; ") + "</p>" : "") +
          actions +
        "</div>"
      );
    }).join("");
  }

  function flashBanner(flash) {
    if (!flash) return "";
    var printBtn = flash.receipt
      ? '<button type="button" class="btn btn--primary btn--sm" id="printBtn">Print receipt</button>'
      : "";
    return '<div class="cashier-flash ' + (flash.type === "error" ? "is-error" : "is-success") + '">' +
      "<span>" + esc(flash.message) + "</span>" + printBtn + "</div>";
  }

  function renderDetail(data, flash) {
    var d = data.enrollment;
    var name = (d.first_name + " " + d.last_name).trim();
    var canPay = data.balance > 0;

    studentModalTitle.textContent = name;

    // Sections inside the modal, not nested cards \u2014 the modal is the card.
    detailPanel.innerHTML =
      flashBanner(flash) +

      '<div class="cashier-detail__top">' +
        "<div>" +
          '<p class="cashier-detail__meta">' + esc(d.student_number || "\u2014") +
            (d.section_name ? " &middot; " + esc(d.section_name) : "") +
            (d.strand_code ? " &middot; " + esc(d.strand_code) : "") + "</p>" +
          '<p class="cashier-detail__meta">' + esc(d.school_year || "") +
            (d.semester ? " &middot; " + esc(d.semester) : "") + "</p>" +
        "</div>" +
        badge(data.status) +
      "</div>" +

      // balance summary
      '<div class="cashier-figures">' +
        '<div class="cashier-figure"><span>Assessment</span><strong>' + peso(data.soa.assessment) + "</strong></div>" +
        '<div class="cashier-figure"><span>Paid</span><strong>' + peso(data.paid) + "</strong></div>" +
        '<div class="cashier-figure cashier-figure--bal"><span>Balance</span><strong>' + peso(data.balance) + "</strong></div>" +
      "</div>" +

      // statement of account
      '<h3 class="form-section">Statement of Account</h3>' +
      '<ul class="soa">' + soaRows(data.soa.items) + "</ul>" +
      '<div class="soa__total"><span class="soa__total-label">Total Assessment</span>' +
        '<span class="soa__total-amount">' + peso(data.soa.assessment) + "</span></div>" +

      // take a payment
      '<h3 class="form-section">Take a payment</h3>' +
      (canPay
        ? '<form id="payForm" class="cashier-payform" novalidate>' +
            '<div class="cashier-payform__grid">' +
              '<label class="cashier-input"><span>Amount (\u20b1)</span>' +
                '<input type="number" id="payAmount" min="1" step="0.01" max="' + data.balance + '" value="' + data.balance + '" required /></label>' +
              '<label class="cashier-input"><span>Method</span>' +
                '<select id="payMethod"><option value="Cash">Cash</option><option value="PayMongo">PayMongo</option></select></label>' +
            "</div>" +
            '<div class="cashier-payform__actions">' +
              '<button type="button" class="btn btn--ghost btn--sm" id="fillFull">Pay full balance</button>' +
              '<button type="submit" class="btn btn--primary" id="paySubmit">Record payment</button>' +
            "</div>" +
            '<p class="form-msg" id="payMsg"></p>' +
          "</form>"
        : '<p class="cashier-muted">This student is fully paid. No further payment is due.</p>') +
      '<h4 class="cashier-subtitle">Payment history</h4>' +
      paymentRows(data.payments) +

      // proof of payment
      '<h3 class="form-section">Proof of payment</h3>' +
      '<div id="proofWrap">' + proofBlock(data.proofs) + "</div>";

    bindDetail(data, flash);
  }

  function bindDetail(data, flash) {
    // Print (from the just-recorded receipt, if any).
    if (flash && flash.receipt) {
      var printBtn = document.getElementById("printBtn");
      if (printBtn) printBtn.addEventListener("click", function () { printReceiptDoc(flash.receipt); });
    }

    var payForm = document.getElementById("payForm");
    if (payForm) {
      var amountEl = document.getElementById("payAmount");
      var fillFull = document.getElementById("fillFull");
      fillFull.addEventListener("click", function () { amountEl.value = data.balance; amountEl.focus(); });

      payForm.addEventListener("submit", function (e) {
        e.preventDefault();
        recordPayment(data);
      });
    }

    var proofWrap = document.getElementById("proofWrap");
    if (proofWrap) {
      proofWrap.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-decision]");
        if (!btn) return;
        var proofId = btn.getAttribute("data-proof");
        var decision = btn.getAttribute("data-decision");
        var remarksEl = proofWrap.querySelector('.proof__remarks[data-proof="' + proofId + '"]');
        verifyProof(proofId, decision, remarksEl ? remarksEl.value.trim() : "");
      });
    }
  }

  // ---- record a payment -------------------------------------------------
  function recordPayment(data) {
    var msg = document.getElementById("payMsg");
    var btn = document.getElementById("paySubmit");
    var amount = parseFloat(document.getElementById("payAmount").value);
    var method = document.getElementById("payMethod").value;

    msg.textContent = "";
    msg.classList.remove("is-error", "is-success");

    if (!(amount > 0)) {
      msg.textContent = "Enter an amount greater than zero.";
      msg.classList.add("is-error");
      return;
    }
    if (amount > data.balance + 0.001) {
      msg.textContent = "Amount is more than the remaining balance of " + peso(data.balance) + ".";
      msg.classList.add("is-error");
      return;
    }

    btn.disabled = true;
    btn.textContent = "Recording\u2026";

    M.recordPayment(data.enrollment.enrollment_id, amount, method).then(function (res) {
      if (res && res.success) {
        // Refresh the detail (shows new balance + status) with a success banner,
        // and refresh the queue since the balance changed.
        selectStudent(data.enrollment.enrollment_id, {
          type: "success",
          message: res.message,
          receipt: res.receipt
        });
        loadQueue(searchBox.value.trim());
        return;
      }
      btn.disabled = false;
      btn.textContent = "Record payment";
      msg.textContent = (res && res.message) || "Could not record the payment. Please try again.";
      msg.classList.add("is-error");
    }).catch(function () {
      btn.disabled = false;
      btn.textContent = "Record payment";
      msg.textContent = "We couldn't reach the server. Please try again.";
      msg.classList.add("is-error");
    });
  }

  // ---- verify a proof ---------------------------------------------------
  function verifyProof(proofId, decision, remarks) {
    M.verifyProof(proofId, decision, remarks).then(function (res) {
      if (res && res.success) {
        // Reload the current student so the proof's new status shows.
        selectStudent(selectedId);
        return;
      }
      alert((res && res.message) || "Could not update the proof. Please try again.");
    }).catch(function () {
      alert("We couldn't reach the server. Please try again.");
    });
  }

  // ---- printable receipt ------------------------------------------------
  function printReceiptDoc(r) {
    var rows = [
      ["Receipt No.", r.receipt_no],
      ["Date", r.date],
      ["Student", r.student_name],
      ["Student No.", r.student_number],
      ["Term", (r.school_year || "") + (r.semester ? " \u00b7 " + r.semester : "")],
      ["Payment method", r.method],
      ["Amount paid", peso(r.amount)],
      ["Total paid to date", peso(r.paid_total)],
      ["Balance", peso(r.balance)],
      ["Status", r.status],
      ["Received by", r.cashier]
    ];
    var body = rows.map(function (row) {
      return '<tr><td class="rk">' + esc(row[0]) + '</td><td class="rv">' + esc(row[1]) + "</td></tr>";
    }).join("");

    receiptPrint.innerHTML =
      '<div class="receipt-doc">' +
        '<div class="receipt-doc__head">' +
          "<h1>Enrollment Management System</h1>" +
          "<p>Cashier &amp; Accounting Office</p>" +
          '<h2>OFFICIAL RECEIPT</h2>' +
        "</div>" +
        '<table class="receipt-doc__table"><tbody>' + body + "</tbody></table>" +
        '<div class="receipt-doc__amount">' +
          "<span>Amount Paid</span><strong>" + peso(r.amount) + "</strong>" +
        "</div>" +
        '<p class="receipt-doc__foot">This serves as your official receipt. Please keep it for your records.</p>' +
      "</div>";

    window.print();
  }
})();
