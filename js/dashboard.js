const hamburger = document.getElementById("hamburger");
const dashToggle = document.getElementById("dashToggle");
const dashMenu = document.getElementById("dashMenu");

hamburger.addEventListener("click", () => {
  const collapsed = document.body.classList.toggle("nav-collapsed");
  hamburger.setAttribute("aria-expanded", String(!collapsed));
});

const onDashboard = /(?:^|\/)dashboard\.html$/.test(window.location.pathname);

dashToggle.addEventListener("click", (e) => {
  if (onDashboard || e.target.closest(".nav__chevron")) {
    const open = dashMenu.classList.toggle("is-open");
    dashToggle.setAttribute("aria-expanded", String(open));
  } else {
    window.location.href = "../dashboard.html";
  }
});

const navScrim = document.createElement("div");
navScrim.className = "nav-scrim";
document.body.appendChild(navScrim);

navScrim.addEventListener("click", () => {
  document.body.classList.add("nav-collapsed");
  hamburger.setAttribute("aria-expanded", "false");
});

const narrowNav = window.matchMedia("(max-width: 1024px)");

function syncNav() {
  document.body.classList.toggle("nav-collapsed", narrowNav.matches);
  hamburger.setAttribute("aria-expanded", String(!narrowNav.matches));
}

syncNav();
if (narrowNav.addEventListener) {
  narrowNav.addEventListener("change", syncNav);
} else {
  narrowNav.addListener(syncNav);
}

document.querySelectorAll(".search-box").forEach((box) => {
  const input = box.querySelector("input");
  const clear = box.querySelector(".search-clear");
  if (!input || !clear) return;
  const sync = () => { clear.hidden = input.value.length === 0; };
  input.addEventListener("input", sync);
  clear.addEventListener("click", () => {
    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
  });
  sync();
});

document.querySelectorAll(".data-table").forEach((table) => {
  const labels = Array.from(table.querySelectorAll("thead th")).map((th) => th.textContent.trim());
  if (!labels.length) return;
  const stamp = () => {
    table.querySelectorAll("tbody tr").forEach((row) => {
      Array.from(row.cells).forEach((cell, i) => {
        if (labels[i]) cell.setAttribute("data-label", labels[i]);
      });
    });
  };
  stamp();
  Array.from(table.tBodies).forEach((body) => {
    new MutationObserver(stamp).observe(body, { childList: true });
  });
});
