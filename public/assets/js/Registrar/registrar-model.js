// registrar-model.js — the registrar module's single connection to the
// PHP/MySQL backend. Same style as Accounting's cashier-model.js: every page
// talks to the module's Controller/, and the PHP session cookie rides along on
// same-origin requests.
//
// Every page loads this from the same absolute path, so the endpoints below are
// absolute too and do not care which View/ page is open.
(function () {
  "use strict";

  var BASE = "/EnrollmentMS/app/Registrar";
  var VIEWS = BASE + "/View";
  var API = BASE + "/Controller/registrar_controllers.php";

  var pesoFmt = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2
  });

  function formatPeso(amount) {
    var n = Number(amount);
    if (isNaN(n)) n = 0;
    return pesoFmt.format(n);
  }

  // POST a plain object as a urlencoded form; parse the JSON reply.
  function postForm(data) {
    var body = new URLSearchParams();
    Object.keys(data).forEach(function (k) { body.set(k, data[k]); });
    return fetch(API, {
      method: "POST",
      headers: { "X-Requested-With": "XMLHttpRequest" },
      body: body
    }).then(function (res) { return res.json(); })
      .catch(function () {
        return { success: false, message: "We couldn't reach the server. Please check your connection and try again." };
      });
  }

  function getJson(params) {
    var query = new URLSearchParams(params).toString();
    return fetch(API + "?" + query, { headers: { "X-Requested-With": "XMLHttpRequest" } })
      .then(function (res) {
        if (res.status === 401) return { authenticated: false };
        return res.json();
      })
      .catch(function () { return null; });
  }

  // ---- Session ----
  function login(email, password) {
    return postForm({ form_type: "login", email: email, password: password });
  }

  // Sends the browser back to the registrar login.
  function logout() {
    return postForm({ form_type: "logout" }).then(function (data) {
      window.location.href = (data && data.redirect) || (VIEWS + "/index.php");
    });
  }

  function me() {
    return getJson({ action: "me" });
  }

  // Guard the console: bounce to the login (View/index.php) if there is
  // no registrar session.
  function requireAuth(loginPage) {
    return me().then(function (data) {
      if (!data || !data.authenticated) {
        window.location.href = loginPage || (VIEWS + "/index.php");
        return null;
      }
      return data.user;
    });
  }

  // For the login page: skip straight to the console if already signed in.
  function redirectIfAuthed(dest) {
    return me().then(function (data) {
      if (data && data.authenticated) window.location.href = dest || (VIEWS + "/admission.php");
    });
  }

  // ---- Console data ----
  function queue(filters) {
    return getJson({
      action: "queue",
      status: (filters && filters.status) || "",
      keyword: (filters && filters.keyword) || "",
      school_year: (filters && filters.schoolYear) || ""
    });
  }

  function detail(applicantId) {
    return getJson({ action: "detail", applicant_id: applicantId });
  }

  function strands() {
    return getJson({ action: "strands" });
  }

  function sections(strandId, grade, schoolYear) {
    return getJson({
      action: "sections",
      strand_id: strandId,
      grade: grade,
      school_year: schoolYear
    });
  }

  function report(schoolYear) {
    return getJson({ action: "report", school_year: schoolYear || "" });
  }

  // Uploads live outside the web root — this endpoint is the only way to view
  // one. Safe to drop straight into an href.
  function documentUrl(documentId) {
    return API + "?action=document&document_id=" + encodeURIComponent(documentId);
  }

  // ---- Actions ----
  function reviewDocument(documentId, decision, remarks) {
    return postForm({
      action: "review_document",
      document_id: documentId,
      decision: decision,
      remarks: remarks || ""
    });
  }

  // decision: "approve" | "reject" | "corrections"
  function decide(applicantId, decision, reason) {
    return postForm({
      action: "decide",
      applicant_id: applicantId,
      decision: decision,
      reason: reason || ""
    });
  }

  function assign(applicantId, strandId, sectionId, semester, lrn) {
    return postForm({
      action: "assign",
      applicant_id: applicantId,
      strand_id: strandId,
      section_id: sectionId,
      semester: semester,
      lrn: lrn || ""
    });
  }

  function finalize(applicantId) {
    return postForm({ action: "finalize", applicant_id: applicantId });
  }

  // Walk-in enrollment: `fields` is the typed student form plus strand_id,
  // section_id, gradeLevel and semester. Returns the report-card payload.
  function walkinEnroll(fields) {
    var data = { action: "walkin_enroll" };
    Object.keys(fields).forEach(function (k) { data[k] = fields[k]; });
    return postForm(data);
  }

  window.RegistrarModel = {
    formatPeso: formatPeso,
    login: login,
    logout: logout,
    me: me,
    requireAuth: requireAuth,
    redirectIfAuthed: redirectIfAuthed,
    queue: queue,
    detail: detail,
    strands: strands,
    sections: sections,
    report: report,
    documentUrl: documentUrl,
    reviewDocument: reviewDocument,
    decide: decide,
    assign: assign,
    finalize: finalize,
    walkinEnroll: walkinEnroll
  };
})();
