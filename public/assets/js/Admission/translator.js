(function () {
  const LANG_KEY = "ems_portal_lang";
  const CACHE_PREFIX = "ems_portal_tr_";
  const INSTANCES = [
    "https://lingva.ml",
    "https://lingva.lunar.icu",
    "https://translate.plausibility.cloud"
  ];
  const CHUNK_LIMIT = 1200;

  const TAGLISH = {
    "Start Your": "Simulan Mo Na Ang",
    "Journey Here": "Journey Dito",
    "Apply for Grade 11 or 12 online — fill out the form, choose your strand, and upload your requirements. No account needed, and you can track everything with a single reference number.": "Mag-apply para sa Grade 11 o 12 online — sagutan lang ang form, piliin ang strand mo, at i-upload ang mga requirements. Hindi na kailangan ng account, at pwede mong i-track lahat gamit ang isang reference number.",
    "Takes about 10 minutes": "Mga 10 minutes lang",
    "Your info goes straight to the registrar": "Diretso sa registrar ang info mo",
    "Grade 11 & 12 · All strands": "Grade 11 & 12 · Lahat ng strands",
    "Apply for Enrollment": "Mag-apply para sa Enrollment",
    "Complete the five-step application form and upload your admission requirements online.": "Kumpletuhin ang five-step application form at i-upload ang mga admission requirements mo online.",
    "Start application": "Simulan ang application",
    "Check Application Status": "I-check ang Application Status",
    "Enter your reference number and email to see where your application is and any registrar remarks.": "Ilagay ang reference number at email mo para makita kung nasaan na ang application mo at ang remarks ng registrar.",
    "Check status": "I-check ang status",
    "Apply": "Mag-apply",
    "Check Status": "I-check ang Status",
    "Get Started": "Simulan Na",
    "Student Login": "Student Login",
    "Welcome back — log in to check your enrollment and records.": "Welcome back — mag-log in para ma-check ang enrollment at records mo.",
    "Student ID or Email": "Student ID o Email",
    "Forgot?": "Nakalimutan?",
    "Remember me": "Tandaan ako",
    "Log In": "Mag-log In",
    "New student": "Bagong student",
    "Apply for enrollment": "Mag-apply para sa enrollment",
    "Please enter your Student ID or email and your password.": "Pakilagay ang Student ID o email mo at ang password mo.",
    "Signing in…": "Nagsa-sign in…",
    "Signed in successfully. Redirecting…": "Matagumpay na naka-sign in. Nire-redirect…",
    "We couldn't sign you in. Please check your details and try again.": "Hindi ka namin ma-sign in. Paki-check ang details mo at subukan ulit.",
    "We couldn't reach the server. Please check your connection and try again.": "Hindi namin ma-reach ang server. Paki-check ang connection mo at subukan ulit.",
    "What would you like to do?": "Ano ang gusto mong gawin?",
    "Start a new application, or check one you already submitted.": "Magsimula ng bagong application, o i-check ang naipasa mo na.",
    "First time enrolling?": "First time mag-enroll?",
    "See what documents you'll need": "Tingnan kung anong documents ang kailangan mo",
    "before you start.": "bago ka magsimula.",
    "How it works": "Paano ito gumagana",
    "Three simple steps from application to enrollment.": "Tatlong simpleng steps mula application hanggang enrollment.",
    "Fill out the form": "Sagutan ang form",
    "Enter your personal details, family contacts, and pick your grade level and strand in a guided five-step form.": "Ilagay ang personal details mo, contacts ng pamilya, at piliin ang grade level at strand sa guided na five-step form.",
    "Upload your documents": "I-upload ang mga documents mo",
    "Attach clear photos or scans of each requirement — JPG or PNG, up to 500 KB per file.": "Mag-attach ng malinaw na photos o scans ng bawat requirement — JPG o PNG, hanggang 500 KB bawat file.",
    "Track your application": "I-track ang application mo",
    "Save the reference number you get after submitting, then check back anytime for the registrar's decision and remarks.": "I-save ang reference number na makukuha mo pagka-submit, tapos balikan anytime para sa decision at remarks ng registrar.",
    "What you'll need": "Ano ang kakailanganin mo",
    "Prepare these documents before you start. Take clear, well-lit photos where all text is readable — blurry uploads may be returned with remarks.": "Ihanda ang mga documents na ito bago magsimula. Kumuha ng malinaw at maliwanag na photos na kitang-kita lahat ng text — baka ibalik ang malabong uploads na may remarks.",
    "Start your application": "Simulan mo na ang application",
    "Transferees only": "Para sa transferees lang",
    "Application for Enrollment": "Application para sa Enrollment",
    "Portal Home": "Balik sa Portal",
    "Application Progress": "Progress ng Application",
    "Family": "Pamilya",
    "Who is applying": "Sino ang nag-a-apply",
    "Parents & emergency contact": "Magulang at emergency contact",
    "Upload requirements": "I-upload ang requirements",
    "Confirm & submit": "I-confirm at i-submit",
    "Before you submit": "Bago ka mag-submit",
    "Use an email you check often — it's your key to tracking this application.": "Gumamit ng email na madalas mong che-check — ito ang susi mo para ma-track ang application na ito.",
    "Photograph documents on a flat surface with good lighting. JPG or PNG, max 500 KB each.": "Picture-an ang documents sa patag na surface na may magandang ilaw. JPG o PNG, max 500 KB bawat isa.",
    "Transferees also need their Certificate of Transfer / Honorable Dismissal.": "Kailangan din ng mga transferees ang kanilang Certificate of Transfer / Honorable Dismissal.",
    "Step 1 of 5": "Step 1 ng 5",
    "Step 2 of 5": "Step 2 ng 5",
    "Step 3 of 5": "Step 3 ng 5",
    "Step 4 of 5": "Step 4 ng 5",
    "Step 5 of 5": "Step 5 ng 5",
    "Personal Information": "Personal na Impormasyon",
    "Tell us about the student applying for enrollment.": "Ikwento mo sa amin ang estudyanteng mag-e-enroll.",
    "Select type": "Piliin ang type",
    "Select gender": "Piliin ang gender",
    "Found on your report card. Required for transferees.": "Makikita sa report card mo. Required para sa mga transferees.",
    "Used together with your reference number to check your status.": "Kasama ng reference number mo para ma-check ang status.",
    "Complete Address": "Kumpletong Address",
    "Family & Emergency Contact": "Pamilya at Emergency Contact",
    "Parent or guardian details, plus who we should contact in an emergency.": "Details ng magulang o guardian, at kung sino ang dapat i-contact sa emergency.",
    "Parents": "Mga Magulang",
    "Father's Name": "Pangalan ng Tatay",
    "Father's Contact No.": "Contact No. ng Tatay",
    "Mother's Name": "Pangalan ng Nanay",
    "Mother's Contact No.": "Contact No. ng Nanay",
    "Guardian (if not a parent)": "Guardian (kung hindi magulang)",
    "Guardian's Name": "Pangalan ng Guardian",
    "Relationship": "Relasyon",
    "Guardian's Contact No.": "Contact No. ng Guardian",
    "e.g. Aunt, Grandfather": "hal. Tita, Lolo",
    "Choose the grade level and strand you are applying for.": "Piliin ang grade level at strand na ina-apply-an mo.",
    "Select grade level": "Piliin ang grade level",
    "Select strand": "Piliin ang strand",
    "Upload a clear photo or scan of each document, or drag and drop a file onto its slot. JPG or PNG only, up to 500 KB each.": "Mag-upload ng malinaw na photo o scan ng bawat document, o i-drag and drop ang file sa slot nito. JPG o PNG lang, hanggang 500 KB bawat isa.",
    "Grade 10 report card from your previous school.": "Grade 10 report card galing sa dati mong school.",
    "Issued by your previous school.": "Galing sa dati mong school.",
    "Clear photo or scan of the photocopy.": "Malinaw na photo o scan ng photocopy.",
    "Recent photo with a white background.": "Bagong photo na may white background.",
    "Clearance from your previous school.": "Clearance galing sa dati mong school.",
    "Choose File": "Pumili ng File",
    "Replace": "Palitan",
    "Remove": "Tanggalin",
    "Review & Submit": "I-review at I-submit",
    "Double-check everything before submitting. Use Edit to go back to a step.": "I-double check lahat bago i-submit. Gamitin ang Edit para bumalik sa isang step.",
    "I certify that the information given above is true and correct, and I understand that false information may void this application.": "Pinapatunayan kong totoo at tama ang lahat ng impormasyon sa itaas, at nauunawaan kong maaaring mapawalang-bisa ang application na ito kapag may maling impormasyon.",
    "Uploaded Documents": "Mga Na-upload na Documents",
    "Back": "Bumalik",
    "Back to Home": "Bumalik sa Home",
    "Submit Application": "I-submit ang Application",
    "Application Submitted!": "Na-submit na ang Application!",
    "This is your reference number. Keep it somewhere safe — you'll need it, together with your email address, to track this application.": "Ito ang reference number mo. Itago mo ito nang maayos — kakailanganin mo ito, kasama ang email address mo, para i-track ang application na ito.",
    "Copied!": "Na-copy!",
    "The registrar will review your information and verify each document you uploaded.": "Ire-review ng registrar ang information mo at ive-verify ang bawat document na in-upload mo.",
    "Check your status anytime with your reference number and email.": "I-check ang status mo anytime gamit ang reference number at email mo.",
    "Once approved, you'll be officially registered as a student — watch for the \"Approved\" status.": "Kapag na-approve na, officially registered ka na bilang student — abangan ang \"Approved\" status.",
    "Back to Portal": "Balik sa Portal",
    "Application Status": "Status ng Application",
    "Enter the reference number you received when you applied, together with the email address you used.": "Ilagay ang reference number na natanggap mo noong nag-apply ka, kasama ang email address na ginamit mo.",
    "View Status": "Tingnan ang Status",
    "Submitted Documents": "Mga Naipasang Documents",
    "Submitted": "Naipasa",
    "Under Review": "Nirereview pa",
    "Approved": "Approved na",
    "Rejected": "Hindi Na-approve",
    "Enrolled": "Enrolled na",
    "Pending": "Pending pa",
    "Verified": "Verified na",
    "Your application has been received and is waiting for review by the registrar.": "Natanggap na ang application mo at hinihintay na lang ma-review ng registrar.",
    "The registrar is currently reviewing your application and documents.": "Nirereview pa ng registrar ang application at documents mo.",
    "Congratulations! Your application has been approved. Please wait for the school's instructions on sectioning and payment, or visit the registrar's office.": "Congrats! Approved na ang application mo. Hintayin ang instructions ng school tungkol sa sectioning at payment, o pumunta sa registrar's office.",
    "Unfortunately, your application was not approved. See the reason below. You may submit a new application once the issue is resolved.": "Sorry, hindi na-approve ang application mo. Tingnan ang dahilan sa baba. Pwede kang mag-submit ulit ng bagong application kapag naayos na ang issue.",
    "You are officially enrolled. Welcome! Coordinate with the registrar's office for your class schedule.": "Officially enrolled ka na. Welcome! Makipag-coordinate sa registrar's office para sa class schedule mo.",
    "Both reference number and email address are required.": "Kailangan pareho ang reference number at email address.",
    "No application found for that reference number and email combination. Please double-check both and try again.": "Walang nakitang application para sa reference number at email na 'yan. Paki-double check pareho at subukan ulit.",
    "Please complete the highlighted fields correctly before continuing.": "Paki-kumpleto muna nang tama ang mga naka-highlight na fields bago mag-continue.",
    "Please tick the declaration checkbox to confirm your information.": "Paki-check ang declaration checkbox para i-confirm ang information mo."
  };

  const originals = new WeakMap();
  let currentLang = localStorage.getItem(LANG_KEY) || "en";
  let instanceIndex = 0;
  let lingvaDown = false;
  let session = 0;
  let pending = null;

  function normalize(text) {
    return text.replace(/\s+/g, " ").trim();
  }

  function loadCache(lang) {
    try {
      return JSON.parse(localStorage.getItem(CACHE_PREFIX + lang)) || {};
    } catch {
      return {};
    }
  }

  function saveCache(lang, cache) {
    try {
      localStorage.setItem(CACHE_PREFIX + lang, JSON.stringify(cache));
    } catch {}
  }

  function isSkipped(el) {
    for (let n = el; n; n = n.parentElement) {
      const tag = n.tagName;
      if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT" || tag === "TEXTAREA") return true;
      if (n.hasAttribute("data-no-translate")) return true;
    }
    return false;
  }

  function collectTextNodes(root) {
    const nodes = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (!/[A-Za-z]/.test(node.data)) continue;
      if (!node.parentElement || isSkipped(node.parentElement)) continue;
      nodes.push(node);
    }
    return nodes;
  }

  function collectPlaceholders(root) {
    if (!root.querySelectorAll) return [];
    const els = [];
    for (const el of root.querySelectorAll("[placeholder]")) {
      const ph = el.dataset.i18nOrig || el.getAttribute("placeholder");
      if (!ph || !/[A-Za-z]/.test(ph) || /[@0-9]/.test(ph)) continue;
      if (isSkipped(el)) continue;
      els.push(el);
    }
    return els;
  }

  function fetchTimeout(url, ms) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
  }

  async function callGoogle(lang, text) {
    try {
      const res = await fetchTimeout(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`, 8000);
      if (!res.ok) return null;
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        return data[0].map((seg) => seg[0]).join("");
      }
    } catch {}
    return null;
  }

  async function callApi(lang, text) {
    if (!lingvaDown) {
      for (let i = 0; i < INSTANCES.length; i++) {
        const base = INSTANCES[(instanceIndex + i) % INSTANCES.length];
        try {
          const res = await fetchTimeout(`${base}/api/v1/en/${lang}/${encodeURIComponent(text)}`, 4000);
          if (!res.ok) continue;
          const data = await res.json();
          if (data && typeof data.translation === "string") {
            instanceIndex = (instanceIndex + i) % INSTANCES.length;
            return data.translation;
          }
        } catch {}
      }
      lingvaDown = true;
      console.warn("Lingva instances unreachable, falling back to translate.googleapis.com");
    }
    return callGoogle(lang, text);
  }

  async function fetchTranslations(lang, keys, cache) {
    const chunks = [];
    let current = [];
    let length = 0;
    for (const key of keys) {
      if (current.length && length + key.length + 1 > CHUNK_LIMIT) {
        chunks.push(current);
        current = [];
        length = 0;
      }
      current.push(key);
      length += key.length + 1;
    }
    if (current.length) chunks.push(current);

    for (const chunk of chunks) {
      const result = await callApi(lang, chunk.join("\n"));
      if (result === null) return;
      const parts = result.split("\n");
      if (parts.length === chunk.length) {
        chunk.forEach((key, i) => { cache[key] = normalize(parts[i]); });
      } else {
        for (const key of chunk) {
          const single = await callApi(lang, key);
          if (single !== null) cache[key] = normalize(single);
        }
      }
    }
  }

  async function applyLang(root) {
    const my = session;
    const nodes = collectTextNodes(root);
    const placeholders = collectPlaceholders(root);

    if (currentLang === "en") {
      for (const n of nodes) {
        if (originals.has(n)) n.data = originals.get(n);
      }
      for (const el of placeholders) {
        if (el.dataset.i18nOrig) el.setAttribute("placeholder", el.dataset.i18nOrig);
      }
      return;
    }

    const entries = [];
    for (const n of nodes) {
      if (!originals.has(n)) originals.set(n, n.data);
      const orig = originals.get(n);
      const key = normalize(orig);
      if (key) entries.push({ node: n, orig, key });
    }
    const phEntries = placeholders.map((el) => {
      if (!el.dataset.i18nOrig) el.dataset.i18nOrig = el.getAttribute("placeholder");
      return { el, key: normalize(el.dataset.i18nOrig) };
    });

    let lookup;
    if (currentLang === "tgl") {
      lookup = (key) => TAGLISH[key];
    } else {
      const cache = loadCache(currentLang);
      const wanted = [...new Set(entries.map((e) => e.key).concat(phEntries.map((e) => e.key)))];
      const missing = wanted.filter((key) => !(key in cache));
      if (missing.length) {
        await fetchTranslations(currentLang, missing, cache);
        if (my !== session) return;
        saveCache(currentLang, cache);
      }
      lookup = (key) => cache[key];
    }

    for (const e of entries) {
      const translated = lookup(e.key);
      if (translated && translated !== e.key) {
        const lead = e.orig.match(/^\s*/)[0];
        const trail = e.orig.match(/\s*$/)[0];
        e.node.data = lead + translated + trail;
      } else {
        e.node.data = e.orig;
      }
    }
    for (const p of phEntries) {
      const translated = lookup(p.key);
      p.el.setAttribute("placeholder", translated || p.el.dataset.i18nOrig);
    }
  }

  const LANG_NAMES = { en: "English", tl: "Tagalog", ceb: "Bisaya", tgl: "Taglish" };

  function reflectLang() {
    const current = document.getElementById("langCurrent");
    if (current) current.textContent = LANG_NAMES[currentLang] || "English";
    document.querySelectorAll("#langMenu [data-lang]").forEach((opt) => {
      const on = opt.dataset.lang === currentLang;
      opt.classList.toggle("is-selected", on);
      opt.setAttribute("aria-selected", on ? "true" : "false");
    });
  }

  function setLang(lang) {
    currentLang = lang;
    session++;
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang === "ceb" ? "ceb" : lang === "en" ? "en" : "fil";
    reflectLang();
    const pill = document.querySelector(".lang");
    if (pill) pill.classList.add("is-loading");
    Promise.resolve(applyLang(document.body)).finally(() => {
      if (pill) pill.classList.remove("is-loading");
    });
  }

  function init() {
    const wrap = document.querySelector(".lang");
    const btn = document.getElementById("langBtn");
    const menu = document.getElementById("langMenu");
    if (wrap && btn && menu) {
      const close = () => {
        wrap.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
      };
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const open = wrap.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
      menu.addEventListener("click", (e) => {
        const opt = e.target.closest("[data-lang]");
        if (!opt) return;
        close();
        if (opt.dataset.lang !== currentLang) setLang(opt.dataset.lang);
      });
      document.addEventListener("click", (e) => {
        if (!wrap.contains(e.target)) close();
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") close();
      });
    }
    reflectLang();
    const observer = new MutationObserver(() => {
      if (currentLang === "en") return;
      clearTimeout(pending);
      pending = setTimeout(() => applyLang(document.body), 120);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    if (currentLang !== "en") setLang(currentLang);
  }

  window.PortalLang = { setLang };
  init();
})();
