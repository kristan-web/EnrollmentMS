<?php 
  $projectFilePath =  "C:/xampp/htdocs/EnrollmentMS";
  include_once "$projectFilePath/config/session.php";

  safeStartSession();
  redirectToLoginPage();
  // echo htmlspecialchars($_SESSION['role'] ?? '');
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" type="image/png" href="/EnrollmentMS/public/assets/images/logo.png" />
  <title>User Settings &middot; Enrollment Management System</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../../../public/assets/css/shared/dashboard.css" />
</head>
<body>
  <aside class="sidebar" id="sidebar">
    <div class="sidebar__brand">
      <div class="sidebar__logo">
        <img src="../../../public/assets/images/logo.png" alt="Enrollment Management System crest" />
      </div>
      <p class="sidebar__title">Admission</p>
    </div>

    <nav class="sidebar__nav">
      <button class="nav__group-toggle" id="dashToggle" aria-expanded="true" aria-controls="dashMenu">
        <span class="nav__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
        </span>
        <span class="nav__label">Dashboard</span>
        <span class="nav__chevron" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </span>
      </button>

      <ul class="nav__submenu is-open" id="dashMenu">
        <!-- Dashboard Menu Goes Here -->
      </ul>
    </nav>

    <a class="sidebar__logout" onclick="window.location.href='/EnrollmentMS/config/destroysession.php'">
      <span class="nav__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>
      </span>
      <span>Logout</span>
    </a>
  </aside>

  <div class="main">
    <button class="hamburger" id="hamburger" aria-label="Toggle navigation" aria-expanded="true">
      <span class="hamburger__box" aria-hidden="true">
        <span class="hamburger__bar"></span>
        <span class="hamburger__bar"></span>
        <span class="hamburger__bar"></span>
      </span>
    </button>

    <section class="content content--settings">
      <header class="page-head">
        <nav class="page-head__crumbs" aria-label="Breadcrumb">
          <a href="../../Dashboards/Views/AdminSide/settings.php">Settings</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">User settings</span>
        </nav>
        <h1 class="page-head__title">User Settings</h1>
        <p class="page-head__desc">Create administrator accounts and keep credentials up to date. Accounts are stored locally in this browser.</p>
      </header>

      <!-- Alert Component -->
      <div class="alert" id="alert" role="alert" hidden>
        <span class="alert__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m6 6 12 12"/></svg>
        </span>
        <div class="alert__body">
          <p class="alert__title" id="alertTitle">Something Went Wrong</p>
          <p class="alert__text" id="alertText">A server error occurred. Please try again later.</p>
        </div>
      </div>

      <div class="settings-grid">
        <div class="settings-card">
          <div class="settings-card__banner">
            <div class="settings-card__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
            </div>
            <div>
              <h2>Account Creation</h2>
              <p>Register a new system account</p>
            </div>
          </div>
          <div class="settings-card__body">
            <form id="accountCreation" class="settings-form" novalidate>
              <input type="hidden" name="form_type" value="creation">
              <div class="form-row">
                <label class="field">
                  <span>Name</span>
                  <div class="input-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <input type="text" name="fullnameCreation" id="fullnameCreation" placeholder="Full name" required />
                  </div>
                </label>
                <label class="field">
                  <span>Email</span>
                  <div class="input-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/></svg>
                    <input type="text" name="emailCreation" id="emailCreation" placeholder="Email" autocomplete="off" required />
                  </div>
                </label>
              </div>
              <div class="form-row">
                <label class="field">
                  <span>Password</span>
                  <div class="input-wrap input-wrap--pw">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <input type="password" name="passwordCreation" id="passwordCreation" placeholder="At least 8 characters" autocomplete="new-password" required />
                    <button type="button" class="pw-toggle" aria-label="Show password"></button>
                  </div>
                </label>
                <label class="field">
                  <span>Confirm Password</span>
                  <div class="input-wrap input-wrap--pw">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
                    <input type="password" name="confpassCreation" id="confpassCreation" placeholder="Re-enter password" autocomplete="new-password" required />
                    <button type="button" class="pw-toggle" aria-label="Show password"></button>
                  </div>
                </label>
              </div>
              <div class="input-wrap">
                <select name="accountRole" id="accountRole" style="width: 100%; height: 40px; outline: none; border: 1.5px solid rgba(22, 36, 79, 0.12); font-family: inherit;">
                  <option value="" selected disabled>Select account role</option>
                  <option value="Admin">Admin</option>
                  <option value="Registrar">Registrar</option>
                  <option value="Accounting">Accounting</option>
                </select>
              </div>
              <p class="form-msg" id="createMsg" role="status"></p>
              <button type="submit" class="btn btn--primary btn--block btn--tall">
                Create Account
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </button>
            </form>
          </div>
        </div>

        <div class="settings-card">
          <div class="settings-card__banner">
            <div class="settings-card__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>
            </div>
            <div>
              <h2>Change Password</h2>
              <p>Update an existing account password</p>
            </div>
          </div>
          <div class="settings-card__body">
            <form id="changePassword" class="settings-form" novalidate>
              <input type="hidden" name="form_type" value="reset">
              <div class="form-row">
                <label class="field">
                  <span>Email</span>
                  <div class="input-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/></svg>
                    <input type="email" name="emailReset" id="emailReset" placeholder="Account Email" autocomplete="off" required />
                  </div>
                </label>
                <label class="field">
                  <span>Old Password</span>
                  <div class="input-wrap input-wrap--pw">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                    <input type="password" name="passwordReset" id="passwordReset" placeholder="Current password" autocomplete="current-password" required />
                    <button type="button" class="pw-toggle" aria-label="Show password"></button>
                  </div>
                </label>
              </div>
              <div class="form-row">
                <label class="field">
                  <span>New Password</span>
                  <div class="input-wrap input-wrap--pw">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <input type="password" name="newpassReset" id="newpassReset" placeholder="At least 8 characters" autocomplete="new-password" required />
                    <button type="button" class="pw-toggle" aria-label="Show password"></button>
                  </div>
                </label>
                <label class="field">
                  <span>Confirm Password</span>
                  <div class="input-wrap input-wrap--pw">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
                    <input type="password" name="confpassReset" id="confpassReset" placeholder="Re-enter new password" autocomplete="new-password" required />
                    <button type="button" class="pw-toggle" aria-label="Show password"></button>
                  </div>
                </label>
              </div>
              <div class="strength" id="changeStrength" data-level="0">
                <div class="strength__bars"><i></i><i></i><i></i><i></i></div>
                <span class="strength__label">&nbsp;</span>
              </div>
              <p class="form-msg" id="changeMsg" role="status"></p>
              <button type="submit" class="btn btn--primary btn--block btn--tall">
                Update Password
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>

    <footer class="main__footer">&copy; 2026 Enrollment Management System</footer>
  </div>

  <script>
    const sessionRole = <?php echo json_encode($_SESSION['role']); ?>
  </script>
  <script src="/EnrollmentMS/public/assets/js/shared/sidebar.js"></script>
  <script src="../../../public/assets/js/shared/dashboard.js"></script>
  <script src="../../../public/assets/js/Accounts/Users.js"></script>
</body>
</html>