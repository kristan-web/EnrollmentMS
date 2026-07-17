// alerts.js — thin wrapper around SweetAlert2 for the registrar console, so the
// dialogs share one look and every page calls the same helpers.
//
// SweetAlert2 is vendored (registrar/assets/vendor/sweetalert2/) rather than
// pulled from a CDN, so the alerts still work on an offline XAMPP box.
//
//   RegAlert.toast(icon, title)   -> small auto-dismissing corner toast
//   RegAlert.confirm(opts)        -> Promise<boolean> for a yes/no dialog
//   RegAlert.confirmLogout()      -> the logout confirmation, resolves to bool
(function () {
  "use strict";

  // Brand colours, matching the console's blue buttons and red danger actions.
  var BLUE = "#2f5fd0";
  var RED = "#c22a3a";

  // Guard: if the SweetAlert2 script failed to load, fall back to the native
  // dialogs so the flows still work rather than throwing.
  var hasSwal = typeof window.Swal !== "undefined";

  function toast(icon, title) {
    if (!hasSwal) return;
    window.Swal.fire({
      toast: true,
      position: "top-end",
      icon: icon,                 // "success" | "error" | "warning" | "info"
      title: title,
      showConfirmButton: false,
      timer: icon === "error" ? 4000 : 2600,
      timerProgressBar: true
    });
  }

  // Generic confirm. Returns a promise that resolves true if confirmed.
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
      text: "You'll need to sign in again to return to the console.",
      confirmText: "Log out",
      cancelText: "Stay",
      danger: true
    });
  }

  window.RegAlert = {
    toast: toast,
    confirm: confirm,
    confirmLogout: confirmLogout
  };
})();
