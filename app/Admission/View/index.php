<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" type="image/png" href="/EnrollmentMS/public/assets/images/logo.png" />
  <title>Student Portal &middot; Enrollment Management System</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/EnrollmentMS/public/assets/css/shared/portal.css" />
  <link rel="stylesheet" href="/EnrollmentMS/public/assets/css/shared/landing.css" />
</head>
<body class="lp lp-page">
  <div class="wrap">
    <header class="topbar">
      <a class="topbar__brand" href="index.php" aria-label="Student Portal home">
        <img class="topbar__logo" src="/EnrollmentMS/public/assets/images/logo.png" alt="School crest" />
        <span class="topbar__name">
          <strong>Enrollment Management System</strong>
          <span class="topbar__tag">Student Portal</span>
        </span>
      </a>
      <div class="topbar__actions">
        <div class="lang" data-no-translate>
          <button type="button" class="lang__btn" id="langBtn" aria-haspopup="listbox" aria-expanded="false" title="Language / Wika">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            <span class="lang__current" id="langCurrent">English</span>
            <svg class="lang__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          <ul class="lang__menu" id="langMenu" role="listbox" aria-label="Language">
            <li class="lang__opt" role="option" data-lang="en">English</li>
            <li class="lang__opt" role="option" data-lang="tl">Tagalog</li>
            <li class="lang__opt" role="option" data-lang="ceb">Bisaya</li>
            <li class="lang__opt" role="option" data-lang="tgl">Taglish</li>
          </ul>
        </div>
        <a class="topbar__login" href="/EnrollmentMS/public/index.php">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
          <span>Staff Login</span>
        </a>
        <a class="topbar__cta" href="/EnrollmentMS/app/Admission/View/get-started.php">
          <span>Get Started</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </a>
        <a class="topbar__cta" href="/EnrollmentMS/app/Accounting/View/pay.php">
          <span>Pay Now</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </a>
      </div>
    </header>

    <!-- ================================================================= hero -->
    <section class="lp-hero">
      <div class="lp-hero__copy">
        <span class="hero__eyebrow"><i aria-hidden="true"></i><span id="syChip">Admissions Open</span></span>

        <h1 class="lp-hero__title">Start Your <em>Senior High</em> Journey Here</h1>

        <p class="lp-hero__lede">Apply for Grade 11 or 12 online — fill out the form, choose your strand, and upload your requirements. No account needed, and you can track everything with a single reference number.</p>

        <div class="lp-trust">
          <span class="lp-trust__faces" aria-hidden="true">
            <img data-person="student" src="/EnrollmentMS/public/assets/images/landing/voice-1.jpg" alt="" />
            <img data-person="student" src="/EnrollmentMS/public/assets/images/landing/voice-2.jpg" alt="" />
            <img data-person="student" src="/EnrollmentMS/public/assets/images/landing/voice-3.jpg" alt="" />
            <img data-person="student" src="/EnrollmentMS/public/assets/images/landing/voice-4.jpg" alt="" />
          </span>
          <span class="lp-trust__text">
            Grade 11 &amp; 12 &middot; All strands
            <small>Incoming and transferee students welcome</small>
          </span>
        </div>
      </div>

      <div class="lp-hero__media">
        <span class="lp-hero__panel" aria-hidden="true"></span>
        <img class="lp-hero__photo" data-pool="hero" src="/EnrollmentMS/public/assets/images/landing/hero-1.jpg" alt="A senior high school student" />

        <span class="lp-float lp-float--tracks">
          <i aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg>
          </i>
          <span class="lp-float__t">
            <span class="lp-float__k">5 strands</span>
            <span class="lp-float__s">Academic &amp; TVL tracks</span>
          </span>
        </span>

        <span class="lp-float lp-float--online">
          <i aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3.2 9h17.6"/><path d="M3.2 15h17.6"/><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z"/></svg>
          </i>
          <span class="lp-float__t">
            <span class="lp-float__k">Fully online</span>
            <span class="lp-float__s">No walk-in needed to apply</span>
          </span>
        </span>
      </div>
    </section>

    <!-- ============================================================== strands -->
    <section class="lp-section" id="strands">
      <div class="lp-head lp-head--center">
        <span class="lp-eyebrow">Senior High Tracks</span>
        <h2 class="lp-title">Explore our <em>Strands</em></h2>
        <p class="lp-lede">Pick the track that matches where you're headed. You choose your strand inside the application form, and the registrar confirms it once your documents are verified.</p>
      </div>

      <div class="lp-strands">
        <article class="lp-strand lp-strand--lead">
          <span class="lp-strand__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2v6.5L4.2 17A2 2 0 0 0 6 20h12a2 2 0 0 0 1.8-3L15 8.5V2"/><path d="M8 2h8"/><path d="M7.5 14h9"/></svg>
          </span>
          <h3>STEM</h3>
          <p>Science, Technology, Engineering, and Mathematics</p>
        </article>

        <article class="lp-strand">
          <span class="lp-strand__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M7 14h4"/><path d="M14 12v5"/><path d="M17 11v6"/></svg>
          </span>
          <h3>ABM</h3>
          <p>Accountancy, Business, and Management</p>
        </article>

        <article class="lp-strand">
          <span class="lp-strand__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </span>
          <h3>HUMSS</h3>
          <p>Humanities and Social Sciences</p>
        </article>

        <article class="lp-strand">
          <span class="lp-strand__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5.5-5.5 2 2-5.5Z"/></svg>
          </span>
          <h3>GAS</h3>
          <p>General Academic Strand</p>
        </article>

        <article class="lp-strand">
          <span class="lp-strand__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 0 5.3 5.3l-8 8a2.8 2.8 0 0 1-4-4l8-8Z"/></svg>
          </span>
          <h3>TVL</h3>
          <p>Technical-Vocational-Livelihood</p>
        </article>
      </div>
    </section>

    <!-- ================================================================ about -->
    <section class="lp-section lp-about" id="about">
      <div class="lp-collage">
        <img class="lp-collage__main" data-pool="about-main" loading="lazy" src="/EnrollmentMS/public/assets/images/landing/about-main-1.jpg" alt="Students working together" />
        <img class="lp-collage__inset" data-pool="about-detail" loading="lazy" src="/EnrollmentMS/public/assets/images/landing/about-detail-1.jpg" alt="Students reviewing their work" />
        <span class="lp-collage__chip">
          <b>10 min</b>
          <span>Average time to apply</span>
        </span>
      </div>

      <div class="lp-about__body">
        <span class="lp-eyebrow">About the Portal</span>
        <h2 class="lp-title">One portal for your <em>whole enrollment</em></h2>
        <p class="lp-lede">Everything you submit here — your personal details, your strand preference, and your scanned requirements — goes straight to the registrar's queue for review. No account to create, no forms to print.</p>

        <ul class="lp-checks">
          <li><i aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></i>No account required</li>
          <li><i aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></i>Guided five-step form</li>
          <li><i aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></i>Upload documents online</li>
          <li><i aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></i>Track status anytime</li>
          <li><i aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></i>Read registrar remarks</li>
          <li><i aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></i>Pay tuition online</li>
        </ul>
      </div>
    </section>

    <!-- ================================================================ steps -->
    <section class="lp-section" id="how">
      <div class="lp-head lp-head--center">
        <span class="lp-eyebrow">The Process</span>
        <h2 class="lp-title">How it works</h2>
        <p class="lp-lede">Three simple steps from application to enrollment.</p>
      </div>

      <div class="lp-steps">
        <article class="lp-step">
          <span class="lp-step__n" aria-hidden="true"></span>
          <h3>Fill out the form</h3>
          <p>Enter your personal details, family contacts, and pick your grade level and strand in a guided five-step form.</p>
        </article>
        <article class="lp-step">
          <span class="lp-step__n" aria-hidden="true"></span>
          <h3>Upload your documents</h3>
          <p>Attach clear photos or scans of each requirement — JPG or PNG, up to 500 KB per file.</p>
        </article>
        <article class="lp-step">
          <span class="lp-step__n" aria-hidden="true"></span>
          <h3>Track your application</h3>
          <p>Save the reference number you get after submitting, then check back anytime for the registrar's decision and remarks.</p>
        </article>
      </div>
    </section>

    <!-- ========================================================= requirements -->
    <section class="lp-section lp-reqs" id="requirements">
      <div class="lp-reqs__aside">
        <h2>What you'll need</h2>
        <p>Prepare these documents before you start. Take clear, well-lit photos where all text is readable — blurry uploads may be returned with remarks.</p>
        <span class="lp-reqs__note">JPG or PNG &middot; up to 500 KB per file</span>
      </div>
      <ul class="lp-reqs__list" id="reqList"></ul>
    </section>

    <!-- =============================================================== voices -->
    <!-- Placeholder testimonials: the names and quotes below are sample copy and
         the portraits are free-licence stock photos. Replace both with real,
         permitted student feedback before this page goes public. -->
    <section class="lp-section" id="voices">
      <div class="lp-head lp-head--center">
        <span class="lp-eyebrow">Student Voices</span>
        <h2 class="lp-title">What students say about the <em>portal</em></h2>
        <p class="lp-lede">Sample feedback from senior high applicants who enrolled through this portal.</p>
      </div>

      <div class="lp-voices">
        <figure class="lp-voice" data-person="student">
          <img loading="lazy" src="/EnrollmentMS/public/assets/images/landing/voice-5.jpg" alt="Portrait of a student" />
          <figcaption>
            <b data-name>Andrea Salcedo</b>
            <span>Grade 11 &middot; STEM</span>
          </figcaption>
        </figure>
        <figure class="lp-voice" data-person="student">
          <img loading="lazy" src="/EnrollmentMS/public/assets/images/landing/voice-6.jpg" alt="Portrait of a student" />
          <figcaption>
            <b data-name>Miguel Ramos</b>
            <span>Grade 12 &middot; TVL</span>
          </figcaption>
        </figure>
        <figure class="lp-voice" data-person="student">
          <img loading="lazy" src="/EnrollmentMS/public/assets/images/landing/voice-7.jpg" alt="Portrait of a student" />
          <figcaption>
            <b data-name>Kyla Bautista</b>
            <span>Grade 11 &middot; ABM</span>
          </figcaption>
        </figure>
        <figure class="lp-voice" data-person="student">
          <img loading="lazy" src="/EnrollmentMS/public/assets/images/landing/voice-8.jpg" alt="Portrait of a student" />
          <figcaption>
            <b data-name>Josh Delacruz</b>
            <span>Grade 12 &middot; HUMSS</span>
          </figcaption>
        </figure>
      </div>

      <div class="lp-quotes">
        <article class="lp-quote" data-person="student">
          <img loading="lazy" src="/EnrollmentMS/public/assets/images/landing/voice-9.jpg" alt="Portrait of a student" />
          <div class="lp-quote__body">
            <div class="lp-stars" aria-label="Rated 5 out of 5">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2 3 6.5 7 .9-5 4.8 1.2 7-6.2-3.4L5.8 21 7 14.2 2 9.4l7-.9Z"/></svg>
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2 3 6.5 7 .9-5 4.8 1.2 7-6.2-3.4L5.8 21 7 14.2 2 9.4l7-.9Z"/></svg>
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2 3 6.5 7 .9-5 4.8 1.2 7-6.2-3.4L5.8 21 7 14.2 2 9.4l7-.9Z"/></svg>
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2 3 6.5 7 .9-5 4.8 1.2 7-6.2-3.4L5.8 21 7 14.2 2 9.4l7-.9Z"/></svg>
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2 3 6.5 7 .9-5 4.8 1.2 7-6.2-3.4L5.8 21 7 14.2 2 9.4l7-.9Z"/></svg>
            </div>
            <p>"I finished the whole form on my phone during lunch break. Uploading the report card was the only part that took a while, and the portal told me right away that my photo was too big."</p>
            <b data-name>Trisha Mendoza</b>
            <small>Incoming Grade 11 &middot; GAS</small>
          </div>
        </article>

        <article class="lp-quote" data-person="student">
          <img loading="lazy" src="/EnrollmentMS/public/assets/images/landing/voice-10.jpg" alt="Portrait of a student" />
          <div class="lp-quote__body">
            <div class="lp-stars" aria-label="Rated 5 out of 5">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2 3 6.5 7 .9-5 4.8 1.2 7-6.2-3.4L5.8 21 7 14.2 2 9.4l7-.9Z"/></svg>
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2 3 6.5 7 .9-5 4.8 1.2 7-6.2-3.4L5.8 21 7 14.2 2 9.4l7-.9Z"/></svg>
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2 3 6.5 7 .9-5 4.8 1.2 7-6.2-3.4L5.8 21 7 14.2 2 9.4l7-.9Z"/></svg>
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2 3 6.5 7 .9-5 4.8 1.2 7-6.2-3.4L5.8 21 7 14.2 2 9.4l7-.9Z"/></svg>
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2 3 6.5 7 .9-5 4.8 1.2 7-6.2-3.4L5.8 21 7 14.2 2 9.4l7-.9Z"/></svg>
            </div>
            <p>"As a transferee I was worried about the extra document. The requirements list showed exactly which one applied to me, so I only had to visit my old school once."</p>
            <b data-name>Paolo Villanueva</b>
            <small>Transferee &middot; Grade 12 &middot; STEM</small>
          </div>
        </article>
      </div>
    </section>

    <!-- ================================================================ stats -->
    <section class="lp-section">
      <div class="lp-stats">
        <div class="lp-stat"><b>5</b><span>Strands to choose from</span></div>
        <div class="lp-stat"><b>2</b><span>Grade levels accepted</span></div>
        <div class="lp-stat"><b>10 min</b><span>Average time to apply</span></div>
        <div class="lp-stat"><b>24/7</b><span>Portal access, any device</span></div>
      </div>
    </section>

    <!-- ================================================================= team -->
    <!-- Placeholder staff: names are sample copy and the portraits are
         free-licence stock photos. Swap in the real registrar and admissions
         team, with their permission, before publishing. -->
    <section class="lp-section" id="team">
      <div class="lp-head lp-head--center">
        <span class="lp-eyebrow">Who Reviews Your Application</span>
        <h2 class="lp-title">Meet the <em>Admissions</em> Office</h2>
        <p class="lp-lede">Real people read every submission. If something is missing or unclear, they leave remarks you can see from the status page.</p>
      </div>

      <div class="lp-team">
        <figure class="lp-member" data-person="staff">
          <img loading="lazy" src="/EnrollmentMS/public/assets/images/landing/staff-1.jpg" alt="Portrait of a staff member" />
          <b data-name>Ma. Elena Reyes</b>
          <span>School Registrar</span>
        </figure>
        <figure class="lp-member" data-person="staff">
          <img loading="lazy" src="/EnrollmentMS/public/assets/images/landing/staff-2.jpg" alt="Portrait of a staff member" />
          <b data-name>Jasmine Cruz</b>
          <span>Admissions Officer</span>
        </figure>
        <figure class="lp-member" data-person="staff">
          <img loading="lazy" src="/EnrollmentMS/public/assets/images/landing/staff-3.jpg" alt="Portrait of a staff member" />
          <b data-name>Daniel Ocampo</b>
          <span>Records Assistant</span>
        </figure>
        <figure class="lp-member" data-person="staff">
          <img loading="lazy" src="/EnrollmentMS/public/assets/images/landing/staff-4.jpg" alt="Portrait of a staff member" />
          <b data-name>Grace Fernandez</b>
          <span>Cashier</span>
        </figure>
      </div>
    </section>

    <!-- ============================================================== message -->
    <section class="lp-section">
      <div class="lp-band">
        <h2>Apply anytime, anywhere, on any device</h2>
        <p>Your progress stays on the device you're using, so you can gather a missing document and come back to finish later.</p>
      </div>
    </section>

    <!-- ============================================================= bulletin -->
    <!-- Placeholder announcements — replace with the school's real bulletin posts. -->
    <section class="lp-section" id="bulletin">
      <div class="lp-head lp-head--center">
        <span class="lp-eyebrow">Announcements</span>
        <h2 class="lp-title">The Latest from the <em>Bulletin</em></h2>
        <p class="lp-lede">Reminders from the registrar's office about enrollment, strands, and requirements.</p>
      </div>

      <div class="lp-posts">
        <article class="lp-post">
          <div class="lp-post__img">
            <img data-pool="news" loading="lazy" src="/EnrollmentMS/public/assets/images/landing/news-1.jpg" alt="Students reading among library shelves" />
            <span class="lp-post__tag">Enrollment</span>
          </div>
          <div class="lp-post__body">
            <h3>Enrollment schedule for the incoming school year</h3>
            <p>Applications are accepted online throughout the enrollment period. Slots per strand are confirmed once your documents are verified.</p>
          </div>
        </article>

        <article class="lp-post">
          <div class="lp-post__img">
            <img data-pool="news" loading="lazy" src="/EnrollmentMS/public/assets/images/landing/news-2.jpg" alt="Students collaborating over a laptop" />
            <span class="lp-post__tag">Strands</span>
          </div>
          <div class="lp-post__body">
            <h3>Choosing between an academic track and TVL</h3>
            <p>Not sure which strand fits you? Read through the strand descriptions before Step 3 of the form — that's where you'll be asked to pick one.</p>
          </div>
        </article>

        <article class="lp-post">
          <div class="lp-post__img">
            <img data-pool="news" loading="lazy" src="/EnrollmentMS/public/assets/images/landing/news-3.jpg" alt="Reviewing printed documents on a desk" />
            <span class="lp-post__tag">Requirements</span>
          </div>
          <div class="lp-post__body">
            <h3>Getting your documents photo-ready</h3>
            <p>Lay each document flat under good lighting and keep the file under 500 KB. Clear uploads are verified faster and avoid a return with remarks.</p>
          </div>
        </article>
      </div>
    </section>

    <!-- =============================================================== footer -->
    <section class="lp-foot">
      <div>
        <div class="lp-foot__brand">
          <img src="/EnrollmentMS/public/assets/images/logo.png" alt="School crest" />
          <strong>Enrollment Management<br />System</strong>
        </div>
        <p>The student-facing portal for senior high school admission, enrollment, and payments.</p>
      </div>

      <div>
        <h4>Apply</h4>
        <ul>
          <li><a href="get-started.php">Get started</a></li>
          <li><a href="apply.php">Application form</a></li>
          <li><a href="check-status.php">Check status</a></li>
          <li><a href="#requirements">Requirements</a></li>
        </ul>
      </div>

      <div>
        <h4>Explore</h4>
        <ul>
          <li><a href="#strands">Strands</a></li>
          <li><a href="#how">How it works</a></li>
          <li><a href="#bulletin">Bulletin</a></li>
          <li><a href="/EnrollmentMS/app/Accounting/View/pay.php">Pay tuition</a></li>
        </ul>
      </div>

      <div>
        <h4>Office hours</h4>
        <ul>
          <li>Monday to Friday, 8:00 AM &ndash; 5:00 PM</li>
          <li>Registrar's Office, Administration Building</li>
          <li><a href="/EnrollmentMS/public/index.php">Staff login</a></li>
        </ul>
      </div>
    </section>
  </div>

  <script>
    /* Landing page only. Rotates the stock photography so a different set shows
       on each visit. Purely presentational: it swaps <img src> (and, for the
       portraits, the matching display name) and touches nothing the
       application relies on. */
    (function () {
      var BASE = "/EnrollmentMS/public/assets/images/landing/";

      /* Scenery — no person is named, so any photo suits any slot. */
      var POOLS = { hero: 5, "about-main": 4, "about-detail": 4, news: 6 };

      /* Portraits. Each photo is bound to one name so a shuffle can never show
         a face under somebody else's name — only which pair lands in which slot
         changes. The slot keeps its own label (role, grade level, strand). */
      var PEOPLE = {
        student: [
          ["voice-1.jpg",  "Andrea Salcedo"],
          ["voice-2.jpg",  "Miguel Ramos"],
          ["voice-3.jpg",  "Kyla Bautista"],
          ["voice-4.jpg",  "Josh Delacruz"],
          ["voice-5.jpg",  "Paolo Villanueva"],
          ["voice-6.jpg",  "Nadine Gutierrez"],
          ["voice-7.jpg",  "Enzo Navarro"],
          ["voice-8.jpg",  "Trisha Mendoza"],
          ["voice-9.jpg",  "Rio Alcantara"],
          ["voice-10.jpg", "Carlo Aquino"]
        ],
        staff: [
          ["staff-1.jpg", "Ma. Elena Reyes"],
          ["staff-2.jpg", "Jasmine Cruz"],
          ["staff-3.jpg", "Daniel Ocampo"],
          ["staff-4.jpg", "Grace Fernandez"],
          ["staff-5.jpg", "Arnel Bautista"],
          ["staff-6.jpg", "Rowena Lim"]
        ]
      };

      function shuffle(list) {
        for (var i = list.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var tmp = list[i];
          list[i] = list[j];
          list[j] = tmp;
        }
        return list;
      }

      Object.keys(POOLS).forEach(function (pool) {
        var nodes = document.querySelectorAll('img[data-pool="' + pool + '"]');
        if (!nodes.length) return;
        var files = [];
        for (var i = 1; i <= POOLS[pool]; i++) files.push(pool + "-" + i + ".jpg");
        shuffle(files);
        Array.prototype.forEach.call(nodes, function (img, i) {
          img.src = BASE + files[i % files.length];
        });
      });

      Object.keys(PEOPLE).forEach(function (kind) {
        var nodes = document.querySelectorAll('[data-person="' + kind + '"]');
        if (!nodes.length) return;
        var picks = shuffle(PEOPLE[kind].slice());
        Array.prototype.forEach.call(nodes, function (el, i) {
          var pair = picks[i % picks.length];
          var img = el.tagName === "IMG" ? el : el.querySelector("img");
          if (img) img.src = BASE + pair[0];
          var label = el.querySelector("[data-name]");
          if (label) label.textContent = pair[1];
        });
      });
    })();
  </script>

  <footer class="footer">&copy; 2026 Enrollment Management System</footer>

  <script src="../../../public/assets/js/Admission/applicant-model.js"></script>
  <script src="../../../public/assets/js/Admission/translator.js"></script>
  <script src="../../../public/assets/js/Admission/home.js"></script>
</body>
</html>
