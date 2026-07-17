// alerts.js — thin wrapper around SweetAlert2 for the cashier console, so the
// logout confirmation matches the registrar console's look.
//
// SweetAlert2 is vendored (accounting/assets/vendor/sweetalert2/) rather than
// pulled from a CDN, so the dialog still works on an offline XAMPP box.
//
//   AcctAlert.confirmLogout()  -> Promise<boolean>, true if the cashier confirms
(function () {
  "use strict";

  var BLUE = "#2f5fd0";
  var RED = "#c22a3a";

  // If the SweetAlert2 script didn't load, fall back to the native confirm so
  // logout still works rather than throwing.
  var hasSwal = typeof window.Swal !== "undefined";

  function confirm(opts) {
    opts = opts || {};
    if (!hasSwal) {
      return Promise.resolve(window.confirm(opts.text || opts.title || "Are you sure?"));
    }
    return window.Swal.fire({
      icon: opts.icon || "warning",
      title: opts.title || "Are you sure?",
      text: opts.text || "",
      showCancelButton: true,
      confirmButtonText: opts.confirmText || "Confirm",
      cancelButtonText: opts.cancelText || "Cancel",
      confirmButtonColor: opts.danger ? RED : BLUE,
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
      focusCancel: true
    }).then(function (result) {
      return !!result.isConfirmed;
    });
  }

  function confirmLogout() {
    return confirm({
      icon: "question",
      title: "Log out?",
      text: "You'll need to sign in again to return to the cashier console.",
      confirmText: "Log out",
      cancelText: "Stay",
      danger: true
    });
  }

  window.AcctAlert = {
    confirm: confirm,
    confirmLogout: confirmLogout
  };
})();
