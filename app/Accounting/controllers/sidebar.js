// sidebar.js — shell behaviour for the cashier console's sidebar.
//
// The admin app has js/dashboard.js for this, but it can't be reused as-is:
// clicking its nav group sends you to ../dashboard.html, a page that only
// exists in the admin app. This module is standalone, so it keeps the parts
// that apply (collapse, scrim, responsive sync, search clear) and makes the
// group toggle just open/close its own submenu.
(function () {
  "use strict";

  var hamburger = document.getElementById("hamburger");
  var groupToggle = document.getElementById("dashToggle");
  var groupMenu = document.getElementById("dashMenu");

  if (hamburger) {
    hamburger.addEventListener("click", function () {
      var collapsed = document.body.classList.toggle("nav-collapsed");
      hamburger.setAttribute("aria-expanded", String(!collapsed));
    });
  }

  // Unlike the admin app, this only folds the submenu — there's nowhere else
  // in the module to navigate to.
  if (groupToggle && groupMenu) {
    groupToggle.addEventListener("click", function () {
      var open = groupMenu.classList.toggle("is-open");
      groupToggle.setAttribute("aria-expanded", String(open));
    });
  }

  // Tapping outside the sidebar closes it on narrow screens.
  var scrim = document.createElement("div");
  scrim.className = "nav-scrim";
  document.body.appendChild(scrim);
  scrim.addEventListener("click", function () {
    document.body.classList.add("nav-collapsed");
    if (hamburger) hamburger.setAttribute("aria-expanded", "false");
  });

  var narrow = window.matchMedia("(max-width: 1024px)");
  function syncNav() {
    document.body.classList.toggle("nav-collapsed", narrow.matches);
    if (hamburger) hamburger.setAttribute("aria-expanded", String(!narrow.matches));
  }
  syncNav();
  if (narrow.addEventListener) {
    narrow.addEventListener("change", syncNav);
  } else {
    narrow.addListener(syncNav);
  }

  // The clear (x) button inside the toolbar search box.
  document.querySelectorAll(".search-box").forEach(function (box) {
    var input = box.querySelector("input");
    var clear = box.querySelector(".search-clear");
    if (!input || !clear) return;

    var sync = function () { clear.hidden = input.value.length === 0; };
    input.addEventListener("input", sync);
    clear.addEventListener("click", function () {
      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.focus();
    });
    sync();
  });

  // Below 720px dashboard.css stacks each table row into a card and prints the
  // column name from `data-label` — so every cell needs one. Re-stamped on
  // every render, since the rows are replaced whenever the queue reloads.
  document.querySelectorAll(".data-table").forEach(function (table) {
    var labels = Array.prototype.map.call(table.querySelectorAll("thead th"), function (th) {
      return th.textContent.trim();
    });
    if (!labels.length) return;

    var stamp = function () {
      table.querySelectorAll("tbody tr").forEach(function (row) {
        Array.prototype.forEach.call(row.cells, function (cell, i) {
          if (labels[i]) cell.setAttribute("data-label", labels[i]);
        });
      });
    };

    stamp();
    Array.prototype.forEach.call(table.tBodies, function (body) {
      new MutationObserver(stamp).observe(body, { childList: true });
    });
  });
})();
