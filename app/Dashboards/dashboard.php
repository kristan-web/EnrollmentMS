<?php 
// C:/xampp/htdocs/EnrollmentMS/app/Dashboard/dashboard.php

$projectFilePath = 'C:/xampp/htdocs/EnrollmentMS';
include_once "$projectFilePath/config/session.php";

safeStartSession();
redirectToLoginPage();
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" type="image/png" href="/EnrollmentMS/public/assets/images/logo.png" />
  <title>Dashboard &middot; Enrollment Management System</title>
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet" />
  
  <!-- Styles -->
  <link rel="stylesheet" href="../../public/assets/css/shared/dashboard.css" />
  <link rel="stylesheet" href="../../public/assets/css/shared/dashboard-analytics.css" />
  
  <style>
    /* Additional styles to ensure proper integration */
    .dashboard-content {
      width: 100%;
      max-width: 100%;
      padding: 0;
    }
    
    .dashboard-content .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 12px;
    }
    
    .dashboard-content .dashboard-header h2 {
      font-size: 20px;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }
    
    .dashboard-content .dashboard-header p {
      color: #6b7280;
      font-size: 14px;
      margin: 4px 0 0 0;
    }
    
    .dashboard-content .dashboard-header .refresh-btn {
      padding: 8px 16px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      background: white;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      color: #374151;
      transition: all 0.2s ease;
    }
    
    .dashboard-content .dashboard-header .refresh-btn:hover {
      background: #f3f4f6;
      border-color: #d1d5db;
    }
    
    .dashboard-content .error-state {
      text-align: center;
      padding: 60px 20px;
      color: #6b7280;
    }
    
    .dashboard-content .error-state p {
      font-size: 18px;
      margin: 0;
    }
    
    .dashboard-content .error-state .error-sub {
      font-size: 14px;
      margin-top: 8px;
    }
    
    .dashboard-content .error-state .retry-btn {
      margin-top: 16px;
      padding: 8px 24px;
      border-radius: 8px;
      border: none;
      background: #2563eb;
      color: white;
      cursor: pointer;
      font-weight: 500;
      transition: background 0.2s ease;
    }
    
    .dashboard-content .error-state .retry-btn:hover {
      background: #1d4ed8;
    }
    
    /* Chart canvas wrapper for proper sizing */
    .chart-container canvas {
      width: 100% !important;
      height: 100% !important;
      max-width: 100%;
    }
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
      .dashboard-content .dashboard-header {
        flex-direction: column;
        align-items: flex-start;
      }
      
      .dashboard-content .dashboard-header .refresh-btn {
        align-self: flex-start;
      }
    }
    
    @media (max-width: 480px) {
      .dashboard-grid {
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      
      .stat-card {
        padding: 14px 16px;
      }
      
      .stat-card__value {
        font-size: 22px;
      }
      
      .stat-card__label {
        font-size: 11px;
      }
      
      .quick-stats {
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      
      .quick-stat {
        padding: 10px 12px;
      }
      
      .quick-stat__number {
        font-size: 20px;
      }
      
      .quick-stat__label {
        font-size: 10px;
      }
      
      .chart-card {
        padding: 12px;
      }
      
      .chart-container {
        height: 200px;
      }
      
      .chart-container--tall {
        height: 220px;
      }
    }
    
    /* Print styles for dashboard */
    @media print {
      .sidebar, .hamburger, .main__footer, .refresh-btn {
        display: none !important;
      }
      
      .main {
        padding: 20px !important;
        margin: 0 !important;
      }
      
      .dashboard-content .dashboard-header {
        margin-bottom: 16px !important;
      }
      
      .stat-card {
        box-shadow: none !important;
        border: 1px solid #e5e7eb !important;
      }
      
      .chart-card {
        box-shadow: none !important;
        border: 1px solid #e5e7eb !important;
        page-break-inside: avoid;
      }
      
      .charts-grid {
        gap: 16px !important;
      }
    }
  </style>
</head>
<body>
  <aside class="sidebar" id="sidebar">
    <div class="sidebar__brand">
      <div class="sidebar__logo">
        <img src="../../public/assets/images/logo.png" alt="Enrollment Management System crest" />
      </div>
      <p class="sidebar__title">Admission</p>
    </div>

    <nav class="sidebar__nav">
      <button class="nav__group-toggle" id="dashToggle" aria-expanded="false" aria-controls="dashMenu">
        <span class="nav__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
        </span>
        <span class="nav__label">Dashboard</span>
        <span class="nav__chevron" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </span>
      </button>

      <ul class="nav__submenu is-open" id="dashMenu">
        <!-- Dynamically populated by sidebar.js -->
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

    <div class="dashboard-content">
      <!-- Dashboard content rendered by JavaScript -->
      <div class="dashboard-loading" id="dashboardLoading">
        <div class="dashboard-loading__spinner"></div>
      </div>
    </div>

    <footer class="main__footer">&copy; 2026 Enrollment Management System</footer>
  </div>

  <script>
    const sessionRole = <?php echo json_encode($_SESSION['role'] ?? null); ?>;
  </script>
  
  <!-- Chart.js -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  
  <!-- Sidebar and Dashboard Scripts -->
  <script src="/EnrollmentMS/public/assets/js/shared/sidebar.js"></script>
  <script src="../../public/assets/js/shared/dashboard.js"></script>
  <script src="../../public/assets/js/Dashboard/dashboard-analytics.js"></script>
</body>
</html>