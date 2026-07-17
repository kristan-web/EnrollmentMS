// home.js — Landing page. Pulls the active school year, the requirements
// checklist, and the strand list from the PHP backend (via PortalAPI).
const syChip = document.getElementById("syChip");
const reqList = document.getElementById("reqList");

const ICON_FILE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>';
const ICON_SHIELD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-3.6 8-10V5l-8-3-8 3v7c0 6.4 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>';
const ICON_PHOTO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/></svg>';
const ICON_TRANSFER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 15h8"/><path d="m13 12 3 3-3 3"/></svg>';

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function docIcon(name) {
  if (/photo/i.test(name)) return ICON_PHOTO;
  if (/moral/i.test(name)) return ICON_SHIELD;
  if (/transfer|dismissal/i.test(name)) return ICON_TRANSFER;
  return ICON_FILE;
}

/* ---- Hero strand carousel meta ---- */
const ICON_STEM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><path d="M20.2 20.2c2-2 .1-7.3-4.5-11.9C11.1 3.7 5.8 1.8 3.8 3.8s-.1 7.3 4.5 11.9c4.6 4.6 9.9 6.5 11.9 4.5Z"/><path d="M15.7 15.7c4.6-4.6 6.5-9.9 4.5-11.9s-7.3-.1-11.9 4.5c-4.6 4.6-6.5 9.9-4.5 11.9s7.3.1 11.9-4.5Z"/></svg>';
const ICON_ABM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><rect x="7" y="12" width="3" height="5" rx="0.5"/><rect x="12" y="8" width="3" height="9" rx="0.5"/><rect x="17" y="4" width="3" height="13" rx="0.5"/></svg>';
const ICON_HUMSS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>';
const ICON_GAS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>';
const ICON_TVL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>';

const STRAND_META = {
  STEM:  { accent: "stem",  tag: "Academic track",  icon: ICON_STEM,  blurb: "For future engineers, doctors, programmers, and scientists." },
  ABM:   { accent: "abm",   tag: "Academic track",  icon: ICON_ABM,   blurb: "Accounting, finance, marketing, and entrepreneurship." },
  HUMSS: { accent: "humss", tag: "Academic track",  icon: ICON_HUMSS, blurb: "Law, journalism, education, and the social sciences." },
  GAS:   { accent: "gas",   tag: "Academic track",  icon: ICON_GAS,   blurb: "A flexible path that keeps your college options open." },
  ICT:   { accent: "tvl",   tag: "Tech-Voc track",  icon: ICON_TVL,   blurb: "Computer systems servicing, programming, and animation." },
  HE:    { accent: "tvl",   tag: "Tech-Voc track",  icon: ICON_TVL,   blurb: "Cookery, food & beverage services, and tourism skills." },
  TVL:   { accent: "tvl",   tag: "Tech-Voc track",  icon: ICON_TVL,   blurb: "Hands-on, job-ready technical and livelihood skills." }
};

function renderRequirements(types) {
  reqList.innerHTML = types.map((t) => `
    <li class="need-item">
      <span class="need-item__icon" aria-hidden="true">${docIcon(t.name)}</span>
      <span class="need-item__name">${esc(t.name)}</span>
      ${t.applicant_type === "Transferee" ? '<span class="tag tag--transferee">Transferees only</span>' : ""}
    </li>`).join("");
}

function initStrandCarousel(strands) {
  const track = document.getElementById("strandTrack");
  const dotsWrap = document.getElementById("strandDots");
  const carousel = document.getElementById("strandCarousel");
  if (!track || !dotsWrap || !carousel || !strands.length) return;

  track.innerHTML = strands.map((s, i) => {
    const meta = STRAND_META[s.strand_code] || { accent: "stem", tag: "Senior High", icon: ICON_FILE, blurb: "Available for Grade 11 & 12 enrollment." };
    return `
      <li class="carousel__slide" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${strands.length}">
        <article class="strand-card strand-card--${meta.accent}">
          <div class="strand-card__top">
            <span class="strand-card__icon" aria-hidden="true">${meta.icon}</span>
            <span class="strand-card__code">${esc(s.strand_code)}</span>
          </div>
          <h3 class="strand-card__name">${esc(s.strand_name)}</h3>
          <p class="strand-card__desc">${esc(meta.blurb)}</p>
          <span class="strand-card__tag">${esc(meta.tag)}</span>
        </article>
      </li>`;
  }).join("");

  dotsWrap.innerHTML = strands.map((s, i) =>
    `<button type="button" class="carousel__dot${i === 0 ? " is-active" : ""}" role="tab" aria-label="Show ${esc(s.strand_code)}" data-i="${i}"></button>`
  ).join("");

  const count = strands.length;
  const dots = Array.from(dotsWrap.children);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let index = 0;
  let timer = null;

  function go(n) {
    index = (n + count) % count;
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle("is-active", i === index));
  }
  function play() {
    if (reduceMotion || count < 2 || timer) return;
    timer = setInterval(() => go(index + 1), 4200);
  }
  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  dots.forEach((d) => d.addEventListener("click", () => { go(Number(d.dataset.i)); stop(); play(); }));
  carousel.addEventListener("mouseenter", stop);
  carousel.addEventListener("mouseleave", play);
  carousel.addEventListener("focusin", stop);
  carousel.addEventListener("focusout", play);

  play();
}

(async function init() {
  try {
    const [sy, requirements, strands] = await Promise.all([
      PortalAPI.activeSchoolYear(),
      PortalAPI.checklist("Transferee"),
      PortalAPI.strands()
    ]);
    syChip.textContent = sy ? `Admissions open · S.Y. ${sy}` : "Admissions open";
    renderRequirements(requirements);
    initStrandCarousel(strands);
  } catch (err) {
    console.error("Failed to load landing page data:", err);
    syChip.textContent = "Admissions open";
  }
})();
