// admission.js — the registrar’s admission console (Registrar/View/admission.php).
// Guarded: no registrar session -> back to the login.
//
// Implements the registrar flowchart's "Online submission" branch:
//   review admission details -> verify uploaded documents ->
//   approve / reject / request corrections -> assign strand -> assign section ->
//   finalize enrollment after payment is verified -> generate reports.
//
// All server access goes through RegistrarModel; this file only renders and
// wires events. Mirrors Accounting's cashier.js.
(function () {
  "use strict";

  var M = window.RegistrarModel;

  var queueRows = document.getElementById("queueRows");
  var queueCount = document.getElementById("queueCount");
  var emptyState = document.getElementById("emptyState");
  var pagination = document.getElementById("pagination");
  var pageInfo = document.getElementById("pageInfo");
  var pageControls = document.getElementById("pageControls");

  var PAGE_SIZE = 10;
  var applicantModal = document.getElementById("applicantModal");
  var applicantModalTitle = document.getElementById("applicantModalTitle");
  var closeApplicantModal = document.getElementById("closeApplicantModal");
  var queueHead = document.querySelector(".data-table thead");
  var searchBox = document.getElementById("searchBox");
  var statusTabs = document.getElementById("statusTabs");
  var schoolYearFilter = document.getElementById("schoolYearFilter");
  var detailPanel = document.getElementById("detailPanel");
  var registrarWho = document.getElementById("registrarWho");
  var logoutBtn = document.getElementById("logoutBtn");

  var noteModal = document.getElementById("noteModal");
  var noteTitle = document.getElementById("noteTitle");
  var noteHint = document.getElementById("noteHint");
  var noteText = document.getElementById("noteText");
  var noteMsg = document.getElementById("noteMsg");
  var cancelNoteBtn = document.getElementById("cancelNoteBtn");
  var confirmNoteBtn = document.getElementById("confirmNoteBtn");


  var state = {
    status: "All",
    keyword: "",
    schoolYear: "",
    selectedId: null,
    strands: [],
    sections: [],
    pickedSectionId: null,
    noteHandler: null,
    yearsLoaded: false,
    activeYear: "",
    applicants: [],   // the full filtered list; the table shows one page of it
    page: 1,
    sortKey: "",
    sortDir: "asc"
  };

  // Applicant status -> the badge classes portal.css already defines.
  var STATUS_BADGE = {
    "Pending": "badge--pending",
    "Under Review": "badge--review",
    "Approved": "badge--approved",
    "Rejected": "badge--rejected",
    "Enrolled": "badge--enrolled"
  };
  var DOC_BADGE = {
    "Pending": "badge--pending",
    "Verified": "badge--verified",
    "Rejected": "badge--rejected"
  };

  // ---- Helpers ----------------------------------------------------------

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function fullName(a) {
    return a.last_name + ", " + a.first_name + (a.middle_name ? " " + a.middle_name : "");
  }

  function formatDate(value) {
    if (!value) return "\u2014";
    var d = new Date(String(value).replace(" ", "T"));
    if (isNaN(d)) return value;
    return d.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
  }

  function formatSize(bytes) {
    var n = Number(bytes) || 0;
    if (n < 1024) return n + " B";
    if (n < 1048576) return (n / 1024).toFixed(0) + " KB";
    return (n / 1048576).toFixed(1) + " MB";
  }

  function debounce(fn, delay) {
    var timer = null;
    return function () {
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(null, args); }, delay);
    };
  }

  // Every action's outcome (approve / reject / assign / finalize / document
  // verify …) routes through here. It now surfaces as a SweetAlert toast so
  // the feedback is consistent and visible even over an open modal.
  function flash(text, type) {
    if (!text) return;
    RegAlert.toast(type === "is-error" ? "error" : "success", text);
  }

  // ---- Queue ------------------------------------------------------------

  function loadQueue() {
    return M.queue({
      status: state.status,
      keyword: state.keyword,
      schoolYear: state.schoolYear
    }).then(function (data) {
      if (!data || !data.authenticated) {
        window.location.href = "/EnrollmentMS/app/Registrar/View/index.php";
        return;
      }
      if (!data.success) {
        queueCount.textContent = data.message || "Could not load the queue.";
        return;
      }

      renderCounts(data.counts || {});
      if (data.active_school_year) state.activeYear = data.active_school_year.year;
      if (!state.yearsLoaded) {
        renderYearOptions(data.school_years || []);
        state.yearsLoaded = true;
      }
      renderQueue(data.applicants || []);
    });
  }

  function renderCounts(counts) {
    var map = {
      countAll: counts["All"],
      countPending: counts["Pending"],
      countUnderReview: counts["Under Review"],
      countApproved: counts["Approved"],
      countRejected: counts["Rejected"],
      countEnrolled: counts["Enrolled"]
    };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = map[id] || 0;
    });
  }

  function renderYearOptions(years) {
    years.forEach(function (y) {
      var opt = document.createElement("option");
      opt.value = y.year;
      opt.textContent = "S.Y. " + y.year + (y.status === "active" ? " (active)" : "");
      schoolYearFilter.appendChild(opt);
    });
  }

  // Column sorting. Reads a comparable value out of one applicant row; the
  // sort runs over the whole filtered list, so it spans every page.
  var STATUS_ORDER = ["Pending", "Under Review", "Approved", "Rejected", "Enrolled"];
  var SORT_KEYS = {
    reference: function (a) { return String(a.reference_number || "").toLowerCase(); },
    applicant: function (a) { return fullName(a).toLowerCase(); },
    type:      function (a) { return String(a.applicant_type || "").toLowerCase(); },
    grade:     function (a) { return Number(a.desired_grade_level || 0) * 100 + (String(a.strand_code || "").charCodeAt(0) || 0); },
    documents: function (a) { return Number(a.doc_verified || 0); },
    submitted: function (a) { return new Date(a.submitted_at || 0).getTime() || 0; },
    status:    function (a) { return STATUS_ORDER.indexOf(a.status); }
  };

  function sortApplicants() {
    var read = SORT_KEYS[state.sortKey];
    if (!read) return;
    var dir = state.sortDir === "desc" ? -1 : 1;
    state.applicants.sort(function (a, b) {
      var x = read(a), y = read(b);
      if (typeof x === "number" && typeof y === "number") return (x - y) * dir;
      return String(x).localeCompare(String(y)) * dir;
    });
  }

  function syncSortIndicators() {
    queueHead.querySelectorAll("th[data-sort]").forEach(function (th) {
      var on = th.dataset.sort === state.sortKey;
      th.classList.toggle("is-sorted", on);
      th.classList.toggle("is-desc", on && state.sortDir === "desc");
      th.setAttribute("aria-sort", on ? (state.sortDir === "desc" ? "descending" : "ascending") : "none");
    });
  }

  function applySort(key) {
    if (state.sortKey === key) {
      state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
    } else {
      state.sortKey = key;
      state.sortDir = "asc";
    }
    state.page = 1;
    sortApplicants();
    renderPage();
    syncSortIndicators();
  }

  queueHead.addEventListener("click", function (e) {
    var th = e.target.closest("th[data-sort]");
    if (th) applySort(th.dataset.sort);
  });

  queueHead.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var th = e.target.closest("th[data-sort]");
    if (!th) return;
    e.preventDefault();
    applySort(th.dataset.sort);
  });

  function renderQueue(applicants) {
    // Keep the full filtered list; the table shows one page of it. renderPage()
    // is what actually draws rows, so paging never re-fetches.
    state.applicants = applicants;
    state.page = 1;
    sortApplicants();
    renderPage();
    syncSortIndicators();
  }

  function renderPage() {
    var applicants = state.applicants;
    var total = applicants.length;
    var pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (state.page > pages) state.page = pages;
    var start = (state.page - 1) * PAGE_SIZE;
    var pageItems = applicants.slice(start, start + PAGE_SIZE);

    emptyState.hidden = total > 0;

    queueCount.textContent = total
      ? total + (total === 1 ? " application" : " applications")
      : "No applications in this view";

    renderPagination(total, pages, start, pageItems.length);

    queueRows.innerHTML = pageItems.map(function (a) {
      // Documents column: verified out of uploaded, so the registrar can judge
      // completeness without opening each one. Flag the two states that need
      // action \u2014 a short checklist, or something already rejected.
      var docs = a.doc_verified + "/" + a.doc_total + " verified";
      var flags = [];
      if (Number(a.doc_total) < Number(a.doc_required)) {
        flags.push((a.doc_required - a.doc_total) + " missing");
      }
      if (Number(a.doc_rejected) > 0) flags.push(a.doc_rejected + " rejected");

      return '<tr class="reg-row" data-id="' + a.applicant_id + '">' +
        "<td>" + esc(a.reference_number) + "</td>" +
        '<td><span class="cell-name">' + esc(fullName(a)) + "</span></td>" +
        "<td>" + esc(a.applicant_type) + "</td>" +
        "<td>Grade " + esc(a.desired_grade_level) + " " + esc(a.strand_code || "\u2014") + "</td>" +
        "<td>" + esc(docs) +
          (flags.length ? '<span class="cell-sub reg-flag">' + esc(flags.join(" \u00b7 ")) + "</span>" : "") + "</td>" +
        "<td>" + esc(formatDate(a.submitted_at)) + "</td>" +
        '<td><span class="badge ' + (STATUS_BADGE[a.status] || "badge--pending") + '">' + esc(a.status) + "</span></td>" +
        '<td class="no-print"><div class="row-actions">' +
          '<button type="button" class="btn btn--primary btn--sm" data-open="' + a.applicant_id + '">Review</button>' +
        "</div></td>" +
      "</tr>";
    }).join("");
  }

  // Delegate clicks on the table: the Review button, or anywhere on the row.
  queueRows.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-open]");
    var row = e.target.closest(".reg-row");
    var id = btn ? btn.getAttribute("data-open") : (row ? row.getAttribute("data-id") : null);
    if (!id) return;
    state.selectedId = id;
    loadDetail(id);
  });

  // ---- Pagination (same component as the admin app's list pages) --------

  // Which page numbers to show: all of them when few, else 1..2 \u2026 around the
  // current page \u2026 last-1..last with ellipses.
  function pageList(current, pages) {
    if (pages <= 7) {
      var all = [];
      for (var i = 1; i <= pages; i++) all.push(i);
      return all;
    }
    var wanted = [1, 2, current - 1, current, current + 1, pages - 1, pages]
      .filter(function (p, i, arr) { return p >= 1 && p <= pages && arr.indexOf(p) === i; })
      .sort(function (a, b) { return a - b; });
    var out = [];
    var prev = 0;
    wanted.forEach(function (p) {
      if (p - prev > 1) out.push("\u2026");
      out.push(p);
      prev = p;
    });
    return out;
  }

  function renderPagination(total, pages, start, shown) {
    if (total <= PAGE_SIZE) {
      pagination.hidden = true;
      return;
    }
    pagination.hidden = false;
    pageInfo.textContent = "Showing " + (start + 1) + "\u2013" + (start + shown) + " of " + total;

    var parts = ['<button class="page-btn" data-page="' + (state.page - 1) + '"' +
      (state.page === 1 ? " disabled" : "") + ' aria-label="Previous page">\u2039</button>'];
    pageList(state.page, pages).forEach(function (p) {
      parts.push(p === "\u2026"
        ? '<span class="page-ellipsis">\u2026</span>'
        : '<button class="page-btn' + (p === state.page ? " is-current" : "") + '" data-page="' + p + '">' + p + "</button>");
    });
    parts.push('<button class="page-btn" data-page="' + (state.page + 1) + '"' +
      (state.page === pages ? " disabled" : "") + ' aria-label="Next page">\u203a</button>');
    pageControls.innerHTML = parts.join("");
  }

  pageControls.addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-page]");
    if (!btn || btn.disabled) return;
    state.page = Number(btn.dataset.page);
    renderPage();
    // Jump back to the top of the table after changing pages.
    queueRows.closest(".table-wrap").scrollTop = 0;
  });

  // ---- Detail -----------------------------------------------------------

  function closeApplicant() {
    applicantModal.hidden = true;
    state.selectedId = null;
  }

  closeApplicantModal.addEventListener("click", closeApplicant);
  applicantModal.addEventListener("click", function (e) {
    if (e.target === applicantModal) closeApplicant();
  });

  function loadDetail(applicantId) {
    applicantModal.hidden = false;
    applicantModalTitle.textContent = "Application";
    detailPanel.innerHTML = '<p class="reg-muted">Loading\u2026</p>';

    return M.detail(applicantId).then(function (data) {
      if (!data || !data.authenticated) {
        window.location.href = "/EnrollmentMS/app/Registrar/View/index.php";
        return;
      }
      if (!data.success) {
        detailPanel.innerHTML = '<p class="form-msg is-error">' + esc(data.message || "Couldn't load that application.") + '</p>';
        return;
      }
      renderDetail(data);
    });
  }

  function renderDetail(data) {
    var a = data.applicant;
    var decided = a.status === "Approved" || a.status === "Rejected" || a.status === "Enrolled";

    applicantModalTitle.textContent = a.first_name + " " + (a.middle_name ? a.middle_name + " " : "") + a.last_name;

    // Sections inside the modal, not a nested card \u2014 the modal is the card.
    detailPanel.innerHTML =
      '<p class="reg-flash" id="detailFlash" hidden></p>' +

      '<div class="reg-detail__top">' +
        '<div>' +
          '<p class="reg-detail__meta" data-no-translate>' + esc(a.reference_number) + ' \u00b7 ' + esc(a.applicant_type) + ' \u00b7 Submitted ' + esc(formatDate(a.submitted_at)) + '</p>' +
        '</div>' +
        '<span class="badge ' + (STATUS_BADGE[a.status] || "badge--pending") + '">' + esc(a.status) + '</span>' +
      '</div>' +

      renderReviewNote(a) +

      // 1 \u2014 Review admission details
      '<h3 class="form-section">Admission details</h3>' +
      renderDetails(a) +

      // 2 \u2014 Verify uploaded documents
      '<h3 class="form-section">Uploaded documents</h3>' +
      renderDocuments(data.documents, data.missing, a.status) +

      // 3 \u2014 Approve / reject / request corrections
      renderDecision(a, decided) +

      // 4 \u2014 Assign strand + section
      renderAssign(a, data.enrollment) +

      // 5 \u2014 Finalize after payment
      renderFinalize(a, data.enrollment, data.payment);

    wireDetail(data);
  }

  // The registrar's last note: a rejection reason, or the outstanding items
  // from a "request corrections".
  function renderReviewNote(a) {
    if (!a.rejection_reason) return "";
    var label = a.status === "Rejected" ? "Rejection reason" : "Requested corrections";
    return '<p class="reg-doc__remarks" style="margin-bottom:14px;"><strong>' + label + ':</strong> ' + esc(a.rejection_reason) + '</p>';
  }

  function renderDetails(a) {
    var rows = [
      ["LRN", a.lrn || "Not provided"],
      ["Gender", a.gender],
      ["Birthdate", formatDate(a.birthdate)],
      ["Address", a.address],
      ["Email", a.email],
      ["Contact", a.contact_number || "\u2014"],
      ["Applying for", "Grade " + a.desired_grade_level + " \u00b7 " + (a.strand_code || "No strand") + (a.strand_name ? " (" + a.strand_name + ")" : "")],
      ["School year", a.school_year],
      ["Father", a.father_name ? a.father_name + (a.father_contact_number ? " \u00b7 " + a.father_contact_number : "") : "\u2014"],
      ["Mother", a.mother_name ? a.mother_name + (a.mother_contact_number ? " \u00b7 " + a.mother_contact_number : "") : "\u2014"],
      ["Guardian", a.guardian_name ? a.guardian_name + (a.guardian_relationship ? " (" + a.guardian_relationship + ")" : "") : "\u2014"],
      ["Emergency contact", a.emergency_contact_name + " (" + a.emergency_contact_relationship + ") \u00b7 " + a.emergency_contact_number]
    ];
    if (a.reviewer_name) {
      rows.push(["Last reviewed by", a.reviewer_name + (a.reviewed_at ? " \u00b7 " + formatDate(a.reviewed_at) : "")]);
    }
    if (a.student_number) {
      rows.push(["Student number", a.student_number]);
    }

    return '<dl class="info-grid" data-no-translate>' + rows.map(function (r) {
      return '<div class="info-row"><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>';
    }).join("") + '</dl>';
  }

  function renderDocuments(docs, missing, status) {
    var locked = status === "Enrolled";
    var html = "";

    if (!docs.length) {
      html += '<p class="reg-empty">This applicant hasn\'t uploaded any documents.</p>';
    } else {
      html += docs.map(function (d) {
        var actions = locked ? "" :
          '<div class="reg-doc__actions">' +
            '<a class="btn btn--ghost btn--sm" href="' + M.documentUrl(d.document_id) + '" target="_blank" rel="noopener">View file</a>' +
            (d.status !== "Verified" ? '<button type="button" class="btn btn--verify btn--sm" data-doc-verify="' + d.document_id + '">Verify</button>' : "") +
            (d.status !== "Rejected" ? '<button type="button" class="btn btn--reject btn--sm" data-doc-reject="' + d.document_id + '" data-doc-name="' + esc(d.document_type_name) + '">Reject</button>' : "") +
          '</div>';

        return '<div class="reg-doc">' +
          '<div class="reg-doc__head">' +
            '<div>' +
              '<span class="reg-doc__name">' + esc(d.document_type_name) + '</span>' +
              (Number(d.is_required) ? ' <span class="tag tag--required">Required</span>' : ' <span class="tag tag--optional">Optional</span>') +
              '<p class="reg-doc__meta" data-no-translate>' + esc(d.original_filename) + ' \u00b7 ' + esc(formatSize(d.file_size)) + ' \u00b7 ' + esc(formatDate(d.uploaded_at)) + '</p>' +
            '</div>' +
            '<span class="badge ' + (DOC_BADGE[d.status] || "badge--pending") + '">' + esc(d.status) + '</span>' +
          '</div>' +
          (d.status === "Rejected" && d.remarks ? '<p class="reg-doc__remarks">Remarks: ' + esc(d.remarks) + '</p>' : "") +
          actions +
        '</div>';
      }).join("");
    }

    if (missing && missing.length) {
      html += '<div class="reg-missing">' +
        '<p class="reg-missing__title">Missing required documents</p>' +
        '<ul>' + missing.map(function (m) { return '<li>' + esc(m.name) + '</li>'; }).join("") + '</ul>' +
      '</div>';
    }

    return html;
  }

  function renderDecision(a, decided) {
    if (a.status === "Enrolled") return "";

    var hint = decided
      ? 'This application is already marked <strong>' + esc(a.status) + '</strong>. You can still change the decision while it isn\'t enrolled.'
      : 'Verify the documents above, then decide. Approving lets you assign a strand and section.';

    return '<h3 class="form-section">Decision</h3>' +
      '<p class="reg-muted">' + hint + '</p>' +
      '<div class="reg-actions">' +
        '<button type="button" class="btn btn--ghost btn--sm" id="correctionsBtn">Request corrections</button>' +
        '<button type="button" class="btn btn--danger btn--sm" id="rejectBtn">Reject</button>' +
        '<button type="button" class="btn btn--primary btn--sm" id="approveBtn">Approve</button>' +
      '</div>';
  }

  function renderAssign(a, enrollment) {
    // Only approved applicants get a seat, and only once.
    if (a.status !== "Approved" || enrollment) return "";

    var needsLrn = !a.lrn;
    return '<h3 class="form-section">Assign strand &amp; section</h3>' +
      '<div class="form-grid">' +
        '<label class="field"><span>Strand</span>' +
          '<select id="assignStrand"><option value="" disabled selected>Select strand</option></select>' +
        '</label>' +
        '<label class="field"><span>Semester</span>' +
          '<select id="assignSemester">' +
            '<option value="1st Semester" selected>1st Semester</option>' +
            '<option value="2nd Semester">2nd Semester</option>' +
          '</select>' +
        '</label>' +
        (needsLrn
          ? '<label class="field field--wide"><span>LRN</span>' +
              '<input type="text" id="assignLrn" inputmode="numeric" maxlength="12" placeholder="12-digit LRN" />' +
              '<span class="field__hint">This applicant didn\'t provide an LRN, and a student record needs one.</span>' +
            '</label>'
          : "") +
      '</div>' +
      '<p class="reg-muted" id="sectionHint">Select a strand to see open sections for Grade ' + esc(a.desired_grade_level) + ', S.Y. ' + esc(a.school_year) + '.</p>' +
      '<div class="reg-sections" id="sectionRows"></div>' +
      '<div class="reg-actions">' +
        '<button type="button" class="btn btn--primary btn--sm" id="assignBtn" disabled>Reserve seat</button>' +
      '</div>';
  }

  function renderFinalize(a, enrollment, payment) {
    if (!enrollment) return "";

    var isEnrolled = a.status === "Enrolled";
    var html = '<p class="reg-section-title">' + (isEnrolled ? "Enrollment" : "Finalize enrollment") + '</p>' +
      '<dl class="info-grid" data-no-translate>' +
        '<div class="info-row"><dt>Section</dt><dd>' + esc(enrollment.section_name || "\u2014") + ' \u00b7 Grade ' + esc(enrollment.grade_level || a.desired_grade_level) + '</dd></div>' +
        '<div class="info-row"><dt>Strand</dt><dd>' + esc(enrollment.strand_code || "\u2014") + '</dd></div>' +
        '<div class="info-row"><dt>Term</dt><dd>' + esc(enrollment.semester) + ' \u00b7 S.Y. ' + esc(enrollment.school_year) + '</dd></div>' +
        '<div class="info-row"><dt>Student no.</dt><dd>' + esc(enrollment.student_number || "\u2014") + '</dd></div>' +
        '<div class="info-row"><dt>Seat status</dt><dd>' + esc(enrollment.status) + '</dd></div>' +
      '</dl>';

    if (payment) {
      html += '<div class="reg-figures" style="margin-top:12px;">' +
        '<div class="reg-figure"><span class="reg-figure__label">Assessment</span><span class="reg-figure__value">' + M.formatPeso(payment.assessment) + '</span></div>' +
        '<div class="reg-figure"><span class="reg-figure__label">Paid</span><span class="reg-figure__value">' + M.formatPeso(payment.paid) + '</span></div>' +
        '<div class="reg-figure reg-figure--bal"><span class="reg-figure__label">Balance</span><span class="reg-figure__value">' + M.formatPeso(payment.balance) + '</span></div>' +
      '</div>';
    }

    if (isEnrolled) {
      html += '<p class="reg-muted">This applicant is enrolled. Nothing further is needed here.</p>';
      return html;
    }

    // The payment gate: the cashier has to record a payment first.
    if (payment && payment.verified) {
      html += '<p class="reg-muted">' +
        (payment.fully_paid
          ? "Payment verified and fully settled \u2014 this enrollment can be finalized."
          : "A payment has been verified. You can finalize now; the balance stays on the student's account.") +
        '</p>' +
        '<div class="reg-actions"><button type="button" class="btn btn--primary btn--sm" id="finalizeBtn">Finalize enrollment</button></div>';
    } else {
      html += '<p class="reg-muted">The seat is reserved. The cashier must record a verified payment before this enrollment can be finalized.</p>' +
        '<div class="reg-actions"><button type="button" class="btn btn--primary btn--sm" disabled>Awaiting payment</button></div>';
    }

    return html;
  }

  // ---- Detail wiring ----------------------------------------------------

  function wireDetail(data) {
    var a = data.applicant;

    // Documents: verify / reject
    detailPanel.querySelectorAll("[data-doc-verify]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        btn.disabled = true;
        M.reviewDocument(btn.dataset.docVerify, "Verified", "").then(function (res) {
          if (res && res.success) {
            loadDetail(a.applicant_id).then(function () { flash(res.message, "is-success"); });
            loadQueue();
          } else {
            btn.disabled = false;
            flash((res && res.message) || "Could not verify the document.", "is-error");
          }
        });
      });
    });

    detailPanel.querySelectorAll("[data-doc-reject]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        askNote({
          title: "Reject document",
          hint: 'Tell the applicant what\'s wrong with "' + btn.dataset.docName + '" so they can re-upload it. They\'ll see this on Check Status.',
          confirm: "Reject document",
          onConfirm: function (text) {
            return M.reviewDocument(btn.dataset.docReject, "Rejected", text).then(function (res) {
              if (res && res.success) {
                loadDetail(a.applicant_id).then(function () { flash(res.message, "is-success"); });
                loadQueue();
              }
              return res;
            });
          }
        });
      });
    });

    // Decision
    var approveBtn = document.getElementById("approveBtn");
    if (approveBtn) {
      approveBtn.addEventListener("click", function () {
        approveBtn.disabled = true;
        M.decide(a.applicant_id, "approve", "").then(function (res) {
          approveBtn.disabled = false;
          if (res && res.success) {
            loadDetail(a.applicant_id).then(function () { flash(res.message, "is-success"); });
            loadQueue();
          } else {
            flash((res && res.message) || "Could not approve the application.", "is-error");
          }
        });
      });
    }

    var rejectBtn = document.getElementById("rejectBtn");
    if (rejectBtn) {
      rejectBtn.addEventListener("click", function () {
        askNote({
          title: "Reject application",
          hint: "The applicant will see this reason on the Check Status page.",
          confirm: "Reject application",
          onConfirm: function (text) {
            return M.decide(a.applicant_id, "reject", text).then(function (res) {
              if (res && res.success) {
                loadDetail(a.applicant_id).then(function () { flash(res.message, "is-success"); });
                loadQueue();
              }
              return res;
            });
          }
        });
      });
    }

    var correctionsBtn = document.getElementById("correctionsBtn");
    if (correctionsBtn) {
      correctionsBtn.addEventListener("click", function () {
        askNote({
          title: "Request corrections",
          hint: "Describe what's incomplete. Reject the specific documents above too \u2014 that's what the applicant re-uploads.",
          confirm: "Request corrections",
          onConfirm: function (text) {
            return M.decide(a.applicant_id, "corrections", text).then(function (res) {
              if (res && res.success) {
                loadDetail(a.applicant_id).then(function () { flash(res.message, "is-success"); });
                loadQueue();
              }
              return res;
            });
          }
        });
      });
    }

    // Assignment
    var strandSel = document.getElementById("assignStrand");
    if (strandSel) wireAssign(a, strandSel);

    // Finalize
    var finalizeBtn = document.getElementById("finalizeBtn");
    if (finalizeBtn) {
      finalizeBtn.addEventListener("click", function () {
        finalizeBtn.disabled = true;
        M.finalize(a.applicant_id).then(function (res) {
          if (res && res.success) {
            loadDetail(a.applicant_id).then(function () { flash(res.message, "is-success"); });
            loadQueue();
          } else {
            finalizeBtn.disabled = false;
            flash((res && res.message) || "Could not finalize the enrollment.", "is-error");
          }
        });
      });
    }
  }

  function wireAssign(a, strandSel) {
    var sectionRows = document.getElementById("sectionRows");
    var sectionHint = document.getElementById("sectionHint");
    var assignBtn = document.getElementById("assignBtn");
    var semesterSel = document.getElementById("assignSemester");
    var lrnInput = document.getElementById("assignLrn");

    state.pickedSectionId = null;

    // Strand options, defaulting to what the applicant asked for.
    function fillStrands(list) {
      state.strands = list || [];
      state.strands.forEach(function (s) {
        var opt = document.createElement("option");
        opt.value = s.strand_id;
        opt.textContent = s.strand_code + " \u2014 " + s.strand_name;
        strandSel.appendChild(opt);
      });
      if (a.desired_strand_id) {
        strandSel.value = a.desired_strand_id;
        loadSections();
      }
    }

    if (state.strands.length) {
      fillStrands(state.strands);
    } else {
      M.strands().then(function (list) { fillStrands(list || []); });
    }

    function loadSections() {
      var strandId = strandSel.value;
      if (!strandId) return;

      state.pickedSectionId = null;
      assignBtn.disabled = true;
      sectionRows.innerHTML = "";
      sectionHint.textContent = "Loading sections\u2026";

      M.sections(strandId, a.desired_grade_level, a.school_year).then(function (res) {
        if (!res || !res.success) {
          sectionHint.textContent = (res && res.message) || "Could not load sections.";
          return;
        }
        state.sections = res.sections || [];

        if (!state.sections.length) {
          sectionHint.textContent = "No open sections for that strand in Grade " + a.desired_grade_level + ", S.Y. " + a.school_year + ".";
          return;
        }

        sectionHint.textContent = "Pick a section to reserve a seat in.";
        sectionRows.innerHTML = state.sections.map(function (s) {
          var full = s.available <= 0;
          return '<button type="button" class="reg-sec" data-section="' + s.section_id + '"' + (full ? " disabled" : "") + '>' +
            '<span>' +
              '<span class="reg-sec__name">' + esc(s.section_name) + '</span>' +
              '<span class="reg-sec__meta">' + esc(s.adviser_name || "No adviser assigned") + '</span>' +
            '</span>' +
            '<span class="reg-sec__slots">' + (full ? "Full" : s.available + " of " + s.max_slots + " left") + '</span>' +
          '</button>';
        }).join("");
      });
    }

    strandSel.addEventListener("change", loadSections);

    sectionRows.addEventListener("click", function (e) {
      var btn = e.target.closest(".reg-sec");
      if (!btn || btn.disabled) return;
      state.pickedSectionId = btn.dataset.section;
      sectionRows.querySelectorAll(".reg-sec").forEach(function (el) {
        el.classList.toggle("is-active", el === btn);
      });
      assignBtn.disabled = false;
    });

    assignBtn.addEventListener("click", function () {
      if (!state.pickedSectionId) return flash("Pick a section first.", "is-error");

      var lrn = lrnInput ? lrnInput.value.trim() : "";
      if (lrnInput && !/^[0-9]{12}$/.test(lrn)) {
        return flash("Enter the applicant's 12-digit LRN before reserving a seat.", "is-error");
      }

      assignBtn.disabled = true;
      M.assign(a.applicant_id, strandSel.value, state.pickedSectionId, semesterSel.value, lrn).then(function (res) {
        if (res && res.success) {
          loadDetail(a.applicant_id).then(function () { flash(res.message, "is-success"); });
          loadQueue();
        } else {
          assignBtn.disabled = false;
          flash((res && res.message) || "Could not reserve the seat.", "is-error");
        }
      });
    });
  }

  // ---- Note prompt ------------------------------------------------------

  // One prompt reused for rejection reasons, correction notes, and document
  // remarks. opts: { title, hint, confirm, onConfirm(text) -> Promise(res) }
  function askNote(opts) {
    state.noteHandler = opts;
    noteTitle.textContent = opts.title;
    noteHint.textContent = opts.hint;
    confirmNoteBtn.textContent = opts.confirm;
    noteText.value = "";
    noteMsg.textContent = "";
    noteMsg.className = "form-msg";
    noteModal.hidden = false;
    noteText.focus();
  }

  function closeNote() {
    noteModal.hidden = true;
    state.noteHandler = null;
    confirmNoteBtn.disabled = false;
  }

  cancelNoteBtn.addEventListener("click", closeNote);
  document.getElementById("closeNoteModal").addEventListener("click", closeNote);

  noteModal.addEventListener("click", function (e) {
    if (e.target === noteModal) closeNote();
  });

  confirmNoteBtn.addEventListener("click", function () {
    if (!state.noteHandler) return;

    var text = noteText.value.trim();
    if (!text) {
      noteMsg.textContent = "Please write a short note first.";
      noteMsg.className = "form-msg is-error";
      return;
    }

    confirmNoteBtn.disabled = true;
    state.noteHandler.onConfirm(text).then(function (res) {
      if (res && res.success) {
        closeNote();
      } else {
        noteMsg.textContent = (res && res.message) || "That didn't go through. Please try again.";
        noteMsg.className = "form-msg is-error";
        confirmNoteBtn.disabled = false;
      }
    });
  });


  // ---- Walk-in enrollment (flowchart: Walk in? -> YES) ------------------

  var walkinModal = document.getElementById("walkinModal");
  var walkinForm = document.getElementById("walkinForm");
  var walkinMsg = document.getElementById("walkinMsg");
  var walkinSubmit = document.getElementById("walkinSubmit");
  var walkinGrade = document.getElementById("walkinGrade");
  var walkinStrand = document.getElementById("walkinStrand");
  var walkinSectionHint = document.getElementById("walkinSectionHint");
  var walkinSectionRows = document.getElementById("walkinSectionRows");
  var walkinDone = document.getElementById("walkinDone");
  var walkinDoneMsg = document.getElementById("walkinDoneMsg");
  var reportCardPrint = document.getElementById("reportCardPrint");
  var walkinState = { pickedSectionId: null, strandsLoaded: false, lastReportCard: null };

  function openWalkin() {
    walkinModal.hidden = false;
    walkinForm.hidden = false;
    walkinDone.hidden = true;
    walkinForm.reset();
    walkinMsg.textContent = "";
    walkinMsg.className = "form-msg";
    walkinState.pickedSectionId = null;
    walkinSectionRows.innerHTML = "";
    walkinSectionHint.textContent = "Select a grade level and strand to see open sections.";

    // Load the strand options once.
    if (!walkinState.strandsLoaded) {
      M.strands().then(function (list) {
        (list || []).forEach(function (s) {
          var opt = document.createElement("option");
          opt.value = s.strand_id;
          opt.textContent = s.strand_code + " \u2014 " + s.strand_name;
          walkinStrand.appendChild(opt);
        });
        walkinState.strandsLoaded = true;
      });
    }
  }

  function closeWalkin() { walkinModal.hidden = true; }

  document.getElementById("walkinBtn").addEventListener("click", openWalkin);
  // The sidebar item is an <a href="#walkin"> so it matches the other links;
  // open the modal in place instead of letting it jump to the hash.
  document.getElementById("walkinNavBtn").addEventListener("click", function (e) {
    e.preventDefault();
    openWalkin();
  });
  document.getElementById("closeWalkinModal").addEventListener("click", closeWalkin);
  document.getElementById("cancelWalkinBtn").addEventListener("click", closeWalkin);
  walkinModal.addEventListener("click", function (e) { if (e.target === walkinModal) closeWalkin(); });

  // Load open sections whenever grade + strand are both chosen.
  function loadWalkinSections() {
    var grade = walkinGrade.value;
    var strandId = walkinStrand.value;
    walkinState.pickedSectionId = null;
    walkinSectionRows.innerHTML = "";

    if (!grade || !strandId) {
      walkinSectionHint.textContent = "Select a grade level and strand to see open sections.";
      return;
    }
    walkinSectionHint.textContent = "Loading sections\u2026";

    // Sections are looked up for the active school year on the server; passing
    // the school year the queue reported keeps the two in step.
    M.sections(strandId, grade, state.activeYear || "").then(function (res) {
      if (!res || !res.success) {
        walkinSectionHint.textContent = (res && res.message) || "Could not load sections.";
        return;
      }
      if (!res.sections.length) {
        walkinSectionHint.textContent = "No open sections for that strand in Grade " + grade + ".";
        return;
      }
      walkinSectionHint.textContent = "Pick a section.";
      walkinSectionRows.innerHTML = res.sections.map(function (s) {
        var full = s.available <= 0;
        return '<button type="button" class="reg-sec" data-section="' + s.section_id + '"' + (full ? " disabled" : "") + '>' +
          '<span><span class="reg-sec__name">' + esc(s.section_name) + '</span>' +
          '<span class="reg-sec__meta">' + esc(s.adviser_name || "No adviser assigned") + '</span></span>' +
          '<span class="reg-sec__slots">' + (full ? "Full" : s.available + " of " + s.max_slots + " left") + '</span>' +
        '</button>';
      }).join("");
    });
  }

  walkinGrade.addEventListener("change", loadWalkinSections);
  walkinStrand.addEventListener("change", loadWalkinSections);

  walkinSectionRows.addEventListener("click", function (e) {
    var btn = e.target.closest(".reg-sec");
    if (!btn || btn.disabled) return;
    walkinState.pickedSectionId = btn.dataset.section;
    walkinSectionRows.querySelectorAll(".reg-sec").forEach(function (el) {
      el.classList.toggle("is-active", el === btn);
    });
  });

  // Submit: "Complete and valid?" -> create student + enrolment -> report card.
  walkinForm.addEventListener("submit", function (e) {
    e.preventDefault();
    walkinMsg.textContent = "";
    walkinMsg.className = "form-msg";

    if (!walkinState.pickedSectionId) {
      walkinMsg.textContent = "Pick a section before enrolling.";
      walkinMsg.className = "form-msg is-error";
      return;
    }

    var fields = {};
    Array.prototype.forEach.call(walkinForm.elements, function (el) {
      if (el.name) fields[el.name] = el.value.trim();
    });
    fields.section_id = walkinState.pickedSectionId;
    fields.strand_id = walkinStrand.value;

    walkinSubmit.disabled = true;
    walkinSubmit.textContent = "Enrolling\u2026";

    M.walkinEnroll(fields).then(function (res) {
      walkinSubmit.disabled = false;
      walkinSubmit.textContent = "Enroll & generate report card";

      if (!res || !res.success) {
        // "Inform student to complete documents" \u2014 the validation errors.
        walkinMsg.textContent = (res && res.message) || "Could not enroll the student.";
        walkinMsg.className = "form-msg is-error";
        return;
      }

      walkinState.lastReportCard = res.report_card;
      walkinDoneMsg.textContent = res.message || "Walk-in enrolled.";
      walkinForm.hidden = true;
      walkinDone.hidden = false;
      loadQueue();   // a new Pending enrollment now exists
    }).catch(function () {
      walkinSubmit.disabled = false;
      walkinSubmit.textContent = "Enroll & generate report card";
      walkinMsg.textContent = "We couldn't reach the server. Please try again.";
      walkinMsg.className = "form-msg is-error";
    });
  });

  document.getElementById("walkinAnotherBtn").addEventListener("click", openWalkin);

  // Print the temporary report card.
  document.getElementById("walkinPrintBtn").addEventListener("click", function () {
    if (!walkinState.lastReportCard) return;
    reportCardPrint.innerHTML = reportCardHtml(walkinState.lastReportCard);
    document.body.classList.add("print-card");
    window.print();
  });

  window.addEventListener("afterprint", function () {
    document.body.classList.remove("print-card");
  });

  function reportCardHtml(d) {
    var name = [d.last_name + ",", d.first_name, d.middle_name].filter(Boolean).join(" ");
    var rows = [
      ["Student No.", d.student_number],
      ["LRN", d.lrn],
      ["Name", name],
      ["Gender", d.gender],
      ["Grade Level", "Grade " + d.grade_level],
      ["Track / Strand", (d.track_name ? d.track_name + " \u2014 " : "") + (d.strand_name || d.strand_code || "\u2014")],
      ["Section", d.section_name || "\u2014"],
      ["Adviser", d.adviser_name || "Not assigned"],
      ["School Year", d.school_year],
      ["Semester", d.semester],
      ["Date Enrolled", (d.date_enrolled || "").slice(0, 10)],
      ["Enrollment Status", d.status + " (temporary \u2014 pending payment)"]
    ];
    var body = rows.map(function (r) {
      return '<tr><td class="rk">' + esc(r[0]) + '</td><td class="rv">' + esc(r[1]) + '</td></tr>';
    }).join("");

    return '<div class="report-card-doc">' +
      '<div class="report-card-doc__head">' +
        '<h1>Enrollment Management System</h1>' +
        '<p>Office of the Registrar</p>' +
        '<h2>TEMPORARY REPORT CARD</h2>' +
      '</div>' +
      '<table class="report-card-doc__table"><tbody>' + body + '</tbody></table>' +
      '<p class="report-card-doc__note">This is a provisional record for a newly enrolled student. ' +
        'Grades are not yet available. It becomes final once payment is verified and the enrollment is finalized.</p>' +
      '<div class="report-card-doc__sign"><span>Registrar</span></div>' +
    '</div>';
  }

  // Innermost modal first: the note sits on top of the applicant modal.
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (!noteModal.hidden) closeNote();
    else if (!walkinModal.hidden) closeWalkin();
    else if (!applicantModal.hidden) closeApplicant();
  });

  // The Reports page links here as admission.php#walkin to start a walk-in,
  // since the walk-in form lives on this page. Open it when we arrive that way.
  if (window.location.hash === "#walkin") {
    openWalkin();
  }

  // ---- Filters ----------------------------------------------------------

  statusTabs.addEventListener("click", function (e) {
    var tab = e.target.closest(".tab");
    if (!tab) return;
    state.status = tab.dataset.status;
    statusTabs.querySelectorAll(".tab").forEach(function (el) {
      el.classList.toggle("is-active", el === tab);
    });
    loadQueue();
  });

  searchBox.addEventListener("input", debounce(function () {
    state.keyword = searchBox.value.trim();
    loadQueue();
  }, 300));

  schoolYearFilter.addEventListener("change", function () {
    state.schoolYear = schoolYearFilter.value;
    loadQueue();
  });

  // The sidebar's logout is an <a> for styling, so stop it navigating to "#".
  // Confirm first, then log out.
  logoutBtn.addEventListener("click", function (e) {
    e.preventDefault();
    RegAlert.confirmLogout().then(function (ok) {
      if (ok) M.logout();
    });
  });

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

  // ---- Boot -------------------------------------------------------------

  M.requireAuth("/EnrollmentMS/app/Registrar/View/index.php").then(function (user) {
    if (!user) return;
    registrarWho.innerHTML = whoHtml(user.full_name, user.role);
    loadQueue();
  });
})();
