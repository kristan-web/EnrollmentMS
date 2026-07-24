// cashier.js — the accounting-side (cashier) console.
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
  var isLoading = false;   // Prevent multiple simultaneous requests

  // ---- Debug logging ----------------------------------------------------
  console.log("Cashier.js loaded");
  console.log("CashierModel available:", typeof M !== 'undefined');

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

  // function whoHtml(name, role) {
  //   return (
  //     '<span class="who__avatar" aria-hidden="true">' + esc(initials(name)) + "</span>" +
  //     '<span class="who__meta">' +
  //       '<strong class="who__name">' + esc(name || "") + "</strong>" +
  //       '<span class="who__role">' + esc(role || "Staff") + "</span>" +
  //     "</span>"
  //   );
  // }

  // ---- Centralized click handling ---------------------------------------
function handleTableClick(e) {
  console.log("handleTableClick called with target:", e.target);
  
  // Always prevent default and stop propagation
  e.preventDefault();
  e.stopPropagation();
  
  // Check if click is on or inside a Collect button
  var btn = e.target.closest("[data-open]");
  if (btn) {
    var id = btn.getAttribute("data-open");
    console.log("Collect button clicked for enrollment:", id);
    // Use setTimeout to ensure the click event is fully processed before opening modal
    setTimeout(function() {
      selectStudent(id);
    }, 50);
    return;
  }
  
  // Check if click is on or inside a row
  var row = e.target.closest(".cash-row");
  if (row) {
    var id = row.getAttribute("data-id");
    console.log("Row clicked for enrollment:", id);
    setTimeout(function() {
      selectStudent(id);
    }, 50);
    return;
  }
  
  console.log("Click was not on a button or row - target:", e.target.tagName, e.target.className);
}

  function setupClickHandlers() {
    console.log("Setting up click handlers");
    
    // Use event capturing phase to catch clicks before they bubble
    var table = document.querySelector(".data-table");
    if (table) {
      console.log("Attaching click handler to table (capture phase)");
      table.addEventListener("click", handleTableClick, true); // true = capture phase
    }
    
    // Also attach to tbody
    if (awaitingRows) {
      console.log("Attaching click handler to awaitingRows (capture phase)");
      awaitingRows.addEventListener("click", handleTableClick, true);
    }
    
    // Prevent default on all links and buttons inside the table
    if (table) {
      table.addEventListener("click", function(e) {
        var target = e.target;
        // If it's a link or button, prevent default behavior
        if (target.tagName === 'A' || target.tagName === 'BUTTON' || target.closest('a') || target.closest('button')) {
          // But allow our data-open buttons to work
          if (!target.closest('[data-open]') && !target.closest('.cash-row')) {
            e.preventDefault();
          }
        }
      }, true);
    }
  }

  // ---- session guard ----------------------------------------------------
  // Check if session data is available from PHP
  if (window.sessionData && window.sessionData.authenticated) {
    console.log("Session data found:", window.sessionData);
    // Display cashier info in sidebar
    if (cashierWho) {
      cashierWho.innerHTML = whoHtml(
        window.sessionData.cashier.full_name, 
        window.sessionData.cashier.role
      );
    }
    // Load the queue
    loadQueue("");
  } else {
    console.log("No session data, using requireAuth");
    // Fallback: use requireAuth to check session
    M.requireAuth("index.php").then(function (cashier) {
      if (!cashier) return; // requireAuth already redirected
      console.log("Cashier from requireAuth:", cashier);
      if (cashierWho) {
        cashierWho.innerHTML = whoHtml(cashier.full_name, cashier.role);
      }
      loadQueue("");
    }).catch(function(error) {
      console.error("requireAuth error:", error);
    });
  }

  // The sidebar's logout is an <a> for styling, so stop it navigating to "#".
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      // Check if AcctAlert is defined, otherwise use confirm
      if (typeof AcctAlert !== 'undefined' && AcctAlert.confirmLogout) {
        AcctAlert.confirmLogout().then(function (ok) {
          if (ok) M.logout();
        });
      } else {
        if (confirm("Are you sure you want to logout?")) {
          M.logout();
        }
      }
    });
  }

  // ---- students awaiting payment ---------------------------------------
  function loadQueue(q) {
    if (isLoading) return;
    isLoading = true;
    
    console.log("Loading queue with query:", q);
    if (queueCount) queueCount.textContent = "Loading…";
    
    M.listAwaiting(q).then(function (data) {
      console.log("Queue data received:", data);
      if (!data || data.authenticated === false) {
        console.log("Not authenticated, redirecting to index");
        window.location.href = "index.php";
        return;
      }
      renderQueue(data.students || []);
      isLoading = false;
    }).catch(function (error) {
      console.error("Error loading queue:", error);
      if (queueCount) queueCount.textContent = "Couldn't load the list.";
      isLoading = false;
    });
  }

  function renderQueue(students) {
    console.log("Rendering queue with", students.length, "students");
    if (emptyState) emptyState.hidden = students.length > 0;

    if (queueCount) {
      queueCount.textContent = students.length
        ? students.length + (students.length === 1 ? " student" : " students") + " with a balance"
        : "No students awaiting payment";
    }

    if (students.length === 0) {
      if (awaitingRows) awaitingRows.innerHTML = "";
      return;
    }

    // One row per student. The whole row opens the student; the Collect button
    // is the explicit affordance.
    if (awaitingRows) {
      awaitingRows.innerHTML = students.map(function (s) {
        return (
          '<tr class="cash-row" data-id="' + s.enrollment_id + '">' +
            "<td>" + esc(s.student_number || "—") + "</td>" +
            '<td><span class="cell-name">' + esc(s.full_name) + "</span></td>" +
            "<td>" + esc(s.section_name || "—") + "</td>" +
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

      // Log the rendered HTML to verify
      console.log("Rendered", awaitingRows.children.length, "rows");
    }
  }

  // ---- Set up click handlers after page load ----------------------------
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupClickHandlers);
  } else {
    setupClickHandlers();
  }

  // Debounced search.
  if (searchBox) {
    searchBox.addEventListener("input", function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () { 
        loadQueue(searchBox.value.trim()); 
      }, 250);
    });
  }

  // ---- one student's detail --------------------------------------------
 function openModal() {
  if (studentModal) {
    studentModal.hidden = false;
    console.log("Modal opened");
    document.body.style.overflow = 'hidden';
    // Add a small delay to prevent immediate closing
    setTimeout(function() {
      studentModal.classList.add('modal--open');
    }, 10);
  }
}

 function closeModal() {
  if (studentModal) {
    studentModal.hidden = true;
    selectedId = null;
    console.log("Modal closed");
    document.body.style.overflow = '';
    studentModal.classList.remove('modal--open');
  }
}

  if (closeStudentModal) {
    closeStudentModal.addEventListener("click", function(e) {
      e.preventDefault();
      e.stopPropagation();
      closeModal();
    });
  }

 // Update modal click handler to prevent closing when clicking inside
if (studentModal) {
  studentModal.addEventListener("click", function (e) {
    // Only close if clicking on the overlay itself, not its children
    if (e.target === studentModal) {
      e.preventDefault();
      e.stopPropagation();
      closeModal();
    }
  });
}
// Escape key handler
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && studentModal && !studentModal.hidden) {
    e.preventDefault();
    closeModal();
  }
});

  function selectStudent(enrollmentId, flash) {
    console.log("selectStudent called with enrollmentId:", enrollmentId);
    if (!enrollmentId) {
      console.error("No enrollment ID provided");
      return;
    }
    
    // Prevent multiple simultaneous requests
    if (isLoading) {
      console.log("Already loading, ignoring request");
      return;
    }
    isLoading = true;
    
    selectedId = enrollmentId;
    openModal();

    if (studentModalTitle) {
      studentModalTitle.textContent = "Student";
    }

    if (detailPanel) {
      detailPanel.innerHTML = '<div class="acct-spinner"></div><p style="text-align:center;color:var(--ink-3);">Fetching student information…</p>';
    }

    console.log("Calling M.getStudent for enrollment:", enrollmentId);
    M.getStudent(enrollmentId).then(function (data) {
      console.log("Student data received:", data);
      isLoading = false;
      
      if (!data || data.authenticated === false) {
        console.log("Not authenticated, redirecting to index");
        window.location.href = "index.php";
        return;
      }
      if (!data.success) {
        if (detailPanel) {
          detailPanel.innerHTML = '<p class="form-msg is-error">' +
            esc(data.message || "That student could not be loaded.") + "</p>";
        }
        return;
      }
      renderDetail(data, flash);
    }).catch(function (error) {
      console.error("Error fetching student:", error);
      isLoading = false;
      if (detailPanel) {
        detailPanel.innerHTML = '<p class="form-msg is-error">We couldn\'t reach the server. Please try again.</p>';
      }
    });
  }

  function soaRows(items) {
    if (!items || !items.length) return "";
    return items.map(function (f) {
      return '<li class="soa__row"><span class="soa__name">' + esc(f.name) +
        (f.note ? '<span class="soa__note">' + esc(f.note) + "</span>" : "") +
        '</span><span class="soa__amount">' + peso(f.amount) + "</span></li>";
    }).join("");
  }

  function paymentRows(payments) {
    if (!payments || !payments.length) {
      return '<p class="cashier-muted">No payments recorded yet.</p>';
    }
    var rows = payments.map(function (p) {
      var when = (p.payment_date || "").replace("T", " ").slice(0, 16);
      return '<div class="receipt-lines__row"><dt>' + esc(when) + " · " + esc(p.payment_method) +
        "</dt><dd>" + peso(p.amount) + "</dd></div>";
    }).join("");
    return '<div class="receipt-lines" style="max-width:none;margin:0;">' + rows + "</div>";
  }

  function proofBlock(proofs) {
    if (!proofs || !proofs.length) {
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
          (meta.length ? '<p class="proof__meta">' + meta.join(" · ") + "</p>" : "") +
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
    console.log("Rendering detail for student:", data);
    var d = data.enrollment;
    if (!d) {
      console.error("No enrollment data in response");
      if (detailPanel) {
        detailPanel.innerHTML = '<p class="form-msg is-error">Invalid student data received.</p>';
      }
      return;
    }
    
    var name = (d.first_name + " " + d.last_name).trim();
    var canPay = data.balance > 0;

    if (studentModalTitle) {
      studentModalTitle.textContent = name;
    }

    if (detailPanel) {
      detailPanel.innerHTML =
        flashBanner(flash) +

        '<div class="cashier-detail__top">' +
          "<div>" +
            '<p class="cashier-detail__meta">' + esc(d.student_number || "—") +
              (d.section_name ? " · " + esc(d.section_name) : "") +
              (d.strand_code ? " · " + esc(d.strand_code) : "") + "</p>" +
            '<p class="cashier-detail__meta">' + esc(d.school_year || "") +
              (d.semester ? " · " + esc(d.semester) : "") + "</p>" +
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
                '<label class="cashier-input"><span>Amount (₱)</span>' +
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
    }

    bindDetail(data, flash);
  }

  function bindDetail(data, flash) {
    // Print (from the just-recorded receipt, if any).
    if (flash && flash.receipt) {
      var printBtn = document.getElementById("printBtn");
      if (printBtn) {
        printBtn.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          printReceiptDoc(flash.receipt);
        });
      }
    }

    var payForm = document.getElementById("payForm");
    if (payForm) {
      var amountEl = document.getElementById("payAmount");
      var fillFull = document.getElementById("fillFull");
      if (fillFull) {
        fillFull.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          if (amountEl) {
            amountEl.value = data.balance; 
            amountEl.focus();
          }
        });
      }

      payForm.addEventListener("submit", function (e) {
        e.preventDefault();
        e.stopPropagation();
        recordPayment(data);
      });
    }

    var proofWrap = document.getElementById("proofWrap");
    if (proofWrap) {
      proofWrap.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-decision]");
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
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
    var amountEl = document.getElementById("payAmount");
    
    if (!amountEl) return;
    
    var amount = parseFloat(amountEl.value);
    var method = document.getElementById("payMethod") ? document.getElementById("payMethod").value : 'Cash';

    if (msg) {
      msg.textContent = "";
      msg.classList.remove("is-error", "is-success");
    }

    if (!(amount > 0)) {
      if (msg) {
        msg.textContent = "Enter an amount greater than zero.";
        msg.classList.add("is-error");
      }
      return;
    }
    if (amount > data.balance + 0.001) {
      if (msg) {
        msg.textContent = "Amount is more than the remaining balance of " + peso(data.balance) + ".";
        msg.classList.add("is-error");
      }
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.textContent = "Recording…";
    }

    M.recordPayment(data.enrollment.enrollment_id, amount, method).then(function (res) {
      if (res && res.success) {
        // Refresh the detail (shows new balance + status) with a success banner,
        // and refresh the queue since the balance changed.
        selectStudent(data.enrollment.enrollment_id, {
          type: "success",
          message: res.message,
          receipt: res.receipt
        });
        loadQueue(searchBox ? searchBox.value.trim() : "");
        return;
      }
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Record payment";
      }
      if (msg) {
        msg.textContent = (res && res.message) || "Could not record the payment. Please try again.";
        msg.classList.add("is-error");
      }
    }).catch(function () {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Record payment";
      }
      if (msg) {
        msg.textContent = "We couldn't reach the server. Please try again.";
        msg.classList.add("is-error");
      }
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
      ["Term", (r.school_year || "") + (r.semester ? " · " + r.semester : "")],
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

    if (receiptPrint) {
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
    }

    window.print();
  }
})();