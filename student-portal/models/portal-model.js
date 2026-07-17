// portal-model.js — the student portal's single connection to the PHP/MySQL
// backend. Nothing here (or anywhere else in the portal) uses localStorage;
// every page talks to the same Controllers/ the staff app uses.
//
// Pages at student-portal/index.html sit one level under the project root,
// while pages in student-portal/views/ sit two levels under it — so the path
// back to Controllers/ depends on which page loaded this file.
(function () {
  "use strict";

  const inViews = location.pathname.indexOf("/views/") !== -1;
  const ROOT = inViews ? "../../" : "../";

  const ENDPOINTS = {
    account:    ROOT + "Controllers/student_account/student_account_controllers.php",
    applicants: ROOT + "Controllers/application/applicants_controllers.php",
    documents:  ROOT + "Controllers/application/applicant_documents_controllers.php",
    dashboard:  ROOT + "Controllers/student_portal/student_dashboard_controllers.php"
  };

  // Where the accounting (Pay Tuition) flow starts, relative to this page.
  // Points straight at the student pay page: accounting/index.html is the
  // cashier's staff login, not a student entry point.
  const PAY_ONLINE_URL = ROOT + "accounting/views/pay.html";

  // POST a plain object as an application/x-www-form-urlencoded form and parse
  // the JSON reply. Same-origin, so the PHP session cookie rides along.
  async function postForm(url, data) {
    const body = new URLSearchParams();
    Object.keys(data).forEach((k) => body.set(k, data[k]));
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "X-Requested-With": "XMLHttpRequest" },
        body
      });
      return await res.json();
    } catch {
      return { success: false, message: "We couldn't reach the server. Please check your connection and try again." };
    }
  }

  async function getJson(url) {
    try {
      const res = await fetch(url, { headers: { "X-Requested-With": "XMLHttpRequest" } });
      if (res.status === 401) return { authenticated: false };
      return await res.json();
    } catch {
      return null;
    }
  }

  // ---- Accounts / session ----
  function register(fields) {
    return postForm(ENDPOINTS.account, { form_type: "register", ...fields });
  }

  function login(email, password) {
    return postForm(ENDPOINTS.account, { form_type: "login", email, password });
  }

  async function logout() {
    const data = await postForm(ENDPOINTS.account, { form_type: "logout" });
    window.location.href = data.redirect || "login.html";
  }

  function me() {
    return getJson(ENDPOINTS.account + "?action=me");
  }

  // Guard a members-only page (dashboard / apply): bounce to login if there is
  // no active session. Resolves with the account on success.
  async function requireAuth(loginPage) {
    const data = await me();
    if (!data || !data.authenticated) {
      window.location.href = loginPage || "login.html";
      return null;
    }
    return data.account;
  }

  // For the login / register pages: skip straight to the dashboard if already
  // signed in.
  async function redirectIfAuthed(dest) {
    const data = await me();
    if (data && data.authenticated) window.location.href = dest || "dashboard.html";
  }

  // ---- Reference data (shared with the staff apply flow) ----
  async function strands() {
    const data = await getJson(ENDPOINTS.applicants + "?action=strands");
    return Array.isArray(data) ? data : [];
  }

  async function activeSchoolYear() {
    const data = await getJson(ENDPOINTS.applicants + "?action=school-year");
    return data && data.year ? data.year : "";
  }

  async function checklist(applicantType) {
    const params = new URLSearchParams({ action: "checklist", applicant_type: applicantType || "New Student" });
    const data = await getJson(ENDPOINTS.documents + "?" + params.toString());
    return Array.isArray(data) ? data : [];
  }

  async function findStatus(referenceNumber, email) {
    const params = new URLSearchParams({
      action: "status",
      reference_number: referenceNumber,
      email
    });
    return getJson(ENDPOINTS.applicants + "?" + params.toString());
  }

  async function documentsFor(applicantId) {
    const params = new URLSearchParams({ action: "list", applicant_id: applicantId });
    const data = await getJson(ENDPOINTS.documents + "?" + params.toString());
    return Array.isArray(data) ? data : [];
  }

  // ---- Dashboard ----
  function dashboardSnapshot() {
    return getJson(ENDPOINTS.dashboard + "?action=snapshot");
  }

  window.PortalAPI = {
    ENDPOINTS,
    PAY_ONLINE_URL,
    postForm,
    getJson,
    register,
    login,
    logout,
    me,
    requireAuth,
    redirectIfAuthed,
    strands,
    activeSchoolYear,
    checklist,
    findStatus,
    documentsFor,
    dashboardSnapshot
  };
})();
