// Elements
const menuDash = document.getElementById('dashMenu');

// Functions
// Read the role the page declared. Never redeclare `sessionRole` here: the
// pages define it with `const`, so a `var` of the same name is a SyntaxError
// that stops this whole file from running.
const dashRole = (typeof sessionRole === 'undefined' || !sessionRole) ? 'guest' : sessionRole;

function showDashMenu(role){
    // If role is 'guest' or undefined, show default menu
    if (role === 'guest' || !role) {
        return `
        <li>
            <a href="/EnrollmentMS/app/Dashboards/Views/RegistrarSide/transaction.php">
                <span class="submenu__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 6h18"/><path d="m7 22-4-4 4-4"/><path d="M21 18H3"/></svg>
                </span>
                <span>Transaction</span>
            </a>
        </li>
        `;
    }
    
    if(role === 'Registrar'){
        return `
        <li>
            <a href="/EnrollmentMS/app/Dashboards/Views/RegistrarSide/data-entry.php">
                <span class="submenu__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                </span>
                <span>Data entry</span>
            </a>
        </li>

        <li>
            <a href="/EnrollmentMS/app/Dashboards/Views/RegistrarSide/transaction.php">
                <span class="submenu__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 6h18"/><path d="m7 22-4-4 4-4"/><path d="M21 18H3"/></svg>
                </span>
            <span>Transaction</span>
            </a>
        </li>

         <li>
            <a href="/EnrollmentMS/app/Dashboards/Views/RegistrarSide/records.php">
                <span class="submenu__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
                </span>
                <span>Records &amp; reports</span>
            </a>
        </li>
        `;
    }

    if(role === 'Admin'){
        return `

        <li>
            <a href="/EnrollmentMS/app/Dashboards/Views/RegistrarSide/data-entry.php">
                <span class="submenu__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                </span>
                <span>Data entry</span>
            </a>
        </li>

        <li>
            <a href="/EnrollmentMS/app/Dashboards/Views/RegistrarSide/transaction.php">
                <span class="submenu__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 6h18"/><path d="m7 22-4-4 4-4"/><path d="M21 18H3"/></svg>
                </span>
                <span>Transaction</span>
            </a>
        </li>

        <li>
            <a href="/EnrollmentMS/app/Dashboards/Views/AdminSide/settings.php">
                <span class="submenu__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>
                </span>
                <span>Settings</span>
            </a>
        </li>

        <li>
            <a href="/EnrollmentMS/app/Dashboards/Views/AdminSide/maintenance.php">
                <span class="submenu__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z"/></svg>
                </span>
                <span>Maintenance</span>
            </a>                    
        </li>

        <li>
            <a href="/EnrollmentMS/app/Dashboards/Views/RegistrarSide/records.php">
                <span class="submenu__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
                </span>
                <span>Records &amp; Reports</span>
            </a>
        </li>   

        <li><a href="/EnrollmentMS/app/Registrar/View/reports.php">
          <span class="submenu__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
          </span>
          <span>Enrollment Reports</span>
        </a></li>
        `;
    }

    if(role === 'Accounting'){
        return `
        <li><a href="/EnrollmentMS/app/Accounting/View/cashier.php">
            <span class="submenu__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M6 15h4"/></svg>
            </span>
            <span>Payment console</span>
        </a>
        </li>
        `
    }
    
    // Default fallback
    return `
    <li>
        <a href="/EnrollmentMS/app/Dashboards/Views/RegistrarSide/transaction.php">
            <span class="submenu__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 6h18"/><path d="m7 22-4-4 4-4"/><path d="M21 18H3"/></svg>
            </span>
            <span>Transaction</span>
        </a>
    </li>
    `;
}

function currentPath() {
    return window.location.pathname.replace(/\/+$/, '').toLowerCase();
}

function setActiveLink(link) {
    menuDash.querySelectorAll('a').forEach((a) => {
        a.classList.remove('is-active');
        a.removeAttribute('aria-current');
    });
    link.classList.add('is-active');
    link.setAttribute('aria-current', 'page');
}

function markActiveFromUrl() {
    const here = currentPath();
    const match = Array.from(menuDash.querySelectorAll('a[href]')).find((a) => {
        return new URL(a.getAttribute('href'), window.location.origin)
            .pathname.replace(/\/+$/, '').toLowerCase() === here;
    });

    if (match) setActiveLink(match);

    const onDashboardPage = /\/dashboard\.(?:html|php)$/.test(here);
    if (!match && !onDashboardPage) return;

    menuDash.classList.add('is-open');
    const toggle = document.getElementById('dashToggle');
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
}

if (menuDash) {
    menuDash.innerHTML = showDashMenu(dashRole);
    markActiveFromUrl();

    menuDash.addEventListener('click', (e) => {
        const link = e.target.closest('a[href]');
        if (link) setActiveLink(link);
    });
}