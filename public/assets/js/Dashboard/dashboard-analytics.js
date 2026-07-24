// C:/xampp/htdocs/EnrollmentMS/public/assets/js/Dashboard/dashboard-analytics.js

const DASHBOARD_API_URL = "/EnrollmentMS/app/Dashboards/Controller/dashboard_controllers.php";

// Color palette for charts
const COLORS = {
    blue: '#2563eb',
    green: '#16a34a',
    yellow: '#d97706',
    red: '#dc2626',
    purple: '#7c3aed',
    teal: '#0891b2',
    pink: '#db2777',
    orange: '#ea580c',
    indigo: '#4f46e5',
    gray: '#6b7280'
};

const CHART_COLORS = [
    COLORS.blue, COLORS.green, COLORS.yellow, COLORS.red, 
    COLORS.purple, COLORS.teal, COLORS.pink, COLORS.orange,
    COLORS.indigo, COLORS.gray
];

// ============ Dashboard Loading ============

async function loadDashboard() {
    const container = document.querySelector('.dashboard-content');
    if (!container) return;

    // Show loading state
    const loadingEl = document.getElementById('dashboardLoading');
    if (loadingEl) {
        loadingEl.style.display = 'flex';
    }

    try {
        const response = await fetch(`${DASHBOARD_API_URL}?action=dashboard`);
        if (!response.ok) throw new Error('Failed to load dashboard data');
        
        const data = await response.json();
        
        // Hide loading
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
        
        renderDashboard(container, data);
    } catch (error) {
        console.error('Error loading dashboard:', error);
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
        container.innerHTML = `
            <div class="error-state">
                <p>⚠️ Failed to load dashboard data</p>
                <p class="error-sub">Please refresh the page or try again later.</p>
                <button class="retry-btn" onclick="loadDashboard()">Retry</button>
            </div>
        `;
    }
}

// ============ Render Dashboard ============

function renderDashboard(container, data) {
    const { 
        student_stats, 
        enrollment_stats, 
        active_school_year,
        strand_distribution,
        grade_distribution,
        gender_distribution,
        section_capacity,
        recent_enrollments,
        enrollment_trend,
        school_year_comparison
    } = data;

    const schoolYearLabel = active_school_year ? active_school_year.year : 'Current';

    // Build dashboard HTML
    let html = `
        <!-- School Year Header -->
        <div class="dashboard-header">
            <div>
                <h2>Dashboard Overview</h2>
                <p>School Year: <strong>${escapeHtml(schoolYearLabel)}</strong></p>
            </div>
            <button class="refresh-btn" onclick="loadDashboard()">↻ Refresh</button>
        </div>

        <!-- Stat Cards -->
        <div class="dashboard-grid">
            ${createStatCard('Total Students', student_stats?.total || 0, 'primary', 'All students')}
            ${createStatCard('Active Students', student_stats?.active || 0, 'success', `${student_stats?.inactive || 0} inactive`)}
            ${createStatCard('Currently Enrolled', enrollment_stats?.enrolled || 0, 'info', `${enrollment_stats?.pending || 0} pending`)}
            ${createStatCard('Dropped', enrollment_stats?.dropped || 0, 'danger', 'Total dropouts')}
        </div>

        <!-- Quick Stats -->
        <div class="quick-stats">
            ${createQuickStat('Grade 11', grade_distribution?.find(g => g.grade_level === '11')?.student_count || 0)}
            ${createQuickStat('Grade 12', grade_distribution?.find(g => g.grade_level === '12')?.student_count || 0)}
            ${createQuickStat('Sections', section_capacity?.length || 0)}
            ${createQuickStat('Open Slots', calculateTotalSlots(section_capacity))}
        </div>

        <!-- Charts Grid -->
        <div class="charts-grid">
            <!-- Strand Distribution Chart -->
            <div class="chart-card">
                <h3 class="chart-card__title">📈 Strand Distribution</h3>
                <div class="chart-container">
                    <canvas id="strandChart"></canvas>
                </div>
            </div>

            <!-- Gender Distribution Chart -->
            <div class="chart-card">
                <h3 class="chart-card__title">👤 Gender Distribution</h3>
                <div class="chart-container">
                    <canvas id="genderChart"></canvas>
                </div>
            </div>

            <!-- Enrollment Trend Chart -->
            <div class="chart-card chart-card--full">
                <h3 class="chart-card__title">📅 Enrollment Trend (Last 30 Days)</h3>
                <div class="chart-container chart-container--tall">
                    <canvas id="trendChart"></canvas>
                </div>
            </div>

            <!-- Section Capacity Chart -->
            <div class="chart-card chart-card--full">
                <h3 class="chart-card__title">📚 Section Capacity Overview</h3>
                <div class="chart-container chart-container--tall">
                    <canvas id="capacityChart"></canvas>
                </div>
            </div>

            <!-- School Year Comparison -->
            <div class="chart-card chart-card--full">
                <h3 class="chart-card__title">📊 Enrollment by School Year</h3>
                <div class="chart-container">
                    <canvas id="comparisonChart"></canvas>
                </div>
            </div>
        </div>

        <!-- Recent Enrollments -->
        <div class="chart-card" style="margin-top:24px;">
            <h3 class="chart-card__title">🕐 Recent Enrollments</h3>
            ${recent_enrollments && recent_enrollments.length > 0 ? `
                <div class="recent-table-wrap">
                    <table class="recent-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Student No.</th>
                                <th>Section</th>
                                <th>Strand</th>
                                <th>Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${recent_enrollments.map(e => `
                                <tr>
                                    <td><strong>${escapeHtml(e.student_name)}</strong></td>
                                    <td>${escapeHtml(e.student_number)}</td>
                                    <td>${escapeHtml(e.section_name)}</td>
                                    <td>${escapeHtml(e.strand_code)}</td>
                                    <td>${formatDate(e.date_enrolled)}</td>
                                    <td><span class="badge badge--${e.status === 'Enrolled' ? 'active' : e.status === 'Pending' ? 'pending' : 'archived'}">${escapeHtml(e.status)}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : `
                <p style="text-align:center;color:#6b7280;padding:30px 0;">No recent enrollments found.</p>
            `}
        </div>
    `;

    container.innerHTML = html;

    // Initialize charts after DOM update
    setTimeout(() => {
        renderCharts({
            strand_distribution,
            gender_distribution,
            enrollment_trend,
            section_capacity,
            school_year_comparison
        });
    }, 100);
}

// ============ Stat Card Helpers ============

function createStatCard(label, value, type, subtext) {
    return `
        <div class="stat-card stat-card--${type}">
            <div class="stat-card__label">${escapeHtml(label)}</div>
            <div class="stat-card__value">${formatNumber(value)}</div>
            ${subtext ? `<div class="stat-card__sub">${escapeHtml(subtext)}</div>` : ''}
        </div>
    `;
}

function createQuickStat(label, value) {
    return `
        <div class="quick-stat">
            <div class="quick-stat__number">${formatNumber(value)}</div>
            <div class="quick-stat__label">${escapeHtml(label)}</div>
        </div>
    `;
}

function calculateTotalSlots(sections) {
    if (!sections || sections.length === 0) return 0;
    return sections.reduce((sum, s) => sum + (s.available || 0), 0);
}

// ============ Chart Rendering ============

function renderCharts(data) {
    const { strand_distribution, gender_distribution, enrollment_trend, section_capacity, school_year_comparison } = data;

    // Helper to destroy existing chart
    function destroyChart(chartInstance) {
        if (chartInstance && typeof chartInstance.destroy === 'function') {
            chartInstance.destroy();
        }
        return null;
    }

    // Track chart instances to prevent duplication
    let chartInstances = {};

    // Strand Distribution (Doughnut)
    if (strand_distribution && strand_distribution.length > 0) {
        const ctx = document.getElementById('strandChart');
        if (ctx) {
            destroyChart(chartInstances.strand);
            const labels = strand_distribution.map(s => s.strand_code);
            const values = strand_distribution.map(s => s.student_count);
            const colors = generateColors(labels.length);
            
            chartInstances.strand = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels.map(l => l + ''),
                    datasets: [{
                        data: values,
                        backgroundColor: colors,
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 12,
                                usePointStyle: true,
                                pointStyle: 'circle',
                                font: { size: 12 }
                            }
                        }
                    },
                    cutout: '60%'
                }
            });
        }
    }

    // Gender Distribution (Pie)
    if (gender_distribution && gender_distribution.length > 0) {
        const ctx = document.getElementById('genderChart');
        if (ctx) {
            destroyChart(chartInstances.gender);
            const genderColors = {
                'Male': '#2563eb',
                'Female': '#db2777',
                'Other': '#6b7280'
            };
            
            chartInstances.gender = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: gender_distribution.map(g => g.gender),
                    datasets: [{
                        data: gender_distribution.map(g => g.count),
                        backgroundColor: gender_distribution.map(g => genderColors[g.gender] || '#6b7280'),
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 12,
                                usePointStyle: true,
                                pointStyle: 'circle',
                                font: { size: 12 }
                            }
                        }
                    }
                }
            });
        }
    }

    // Enrollment Trend (Line)
    if (enrollment_trend && enrollment_trend.length > 0) {
        const ctx = document.getElementById('trendChart');
        if (ctx) {
            destroyChart(chartInstances.trend);
            const filledData = fillMissingDates(enrollment_trend);
            
            chartInstances.trend = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: filledData.map(d => formatDateShort(d.date)),
                    datasets: [{
                        label: 'Enrollments',
                        data: filledData.map(d => d.count),
                        borderColor: COLORS.blue,
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 3,
                        pointBackgroundColor: COLORS.blue,
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { stepSize: 1, font: { size: 11 } }
                        },
                        x: {
                            ticks: { 
                                maxTicksLimit: 15,
                                font: { size: 10 }
                            }
                        }
                    }
                }
            });
        }
    }

    // Section Capacity (Bar)
    if (section_capacity && section_capacity.length > 0) {
        const ctx = document.getElementById('capacityChart');
        if (ctx) {
            destroyChart(chartInstances.capacity);
            const sorted = [...section_capacity].sort((a, b) => b.fill_rate - a.fill_rate);
            const labels = sorted.map(s => `${s.section_name} (${s.strand_code})`);
            
            chartInstances.capacity = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Enrolled',
                            data: sorted.map(s => s.enrolled),
                            backgroundColor: COLORS.blue,
                            borderRadius: 4,
                            barPercentage: 0.4
                        },
                        {
                            label: 'Available',
                            data: sorted.map(s => s.available),
                            backgroundColor: COLORS.green,
                            borderRadius: 4,
                            barPercentage: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: { 
                                usePointStyle: true, 
                                pointStyle: 'circle',
                                font: { size: 12 }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: { font: { size: 10 } }
                        },
                        y: {
                            beginAtZero: true,
                            stacked: false,
                            ticks: { font: { size: 11 } }
                        }
                    }
                }
            });
        }
    }

    // School Year Comparison (Bar)
    if (school_year_comparison && school_year_comparison.length > 0) {
        const ctx = document.getElementById('comparisonChart');
        if (ctx) {
            destroyChart(chartInstances.comparison);
            const labels = school_year_comparison.map(s => s.year);
            const values = school_year_comparison.map(s => s.enrollment_count);
            
            chartInstances.comparison = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Enrollments',
                        data: values,
                        backgroundColor: values.map((v, i) => 
                            i === 0 ? COLORS.blue : COLORS.gray
                        ),
                        borderRadius: 6,
                        barPercentage: 0.6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { 
                                stepSize: 1,
                                font: { size: 11 }
                            }
                        },
                        x: {
                            ticks: { font: { size: 11 } }
                        }
                    }
                }
            });
        }
    }
}

// ============ Utility Functions ============

function generateColors(count) {
    const colors = [
        '#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed',
        '#0891b2', '#db2777', '#ea580c', '#4f46e5', '#059669'
    ];
    const result = [];
    for (let i = 0; i < count; i++) {
        result.push(colors[i % colors.length]);
    }
    return result;
}

function fillMissingDates(data) {
    if (!data || data.length === 0) return [];
    
    const result = [];
    const start = new Date();
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    
    const dataMap = {};
    data.forEach(d => {
        const date = new Date(d.date);
        date.setHours(0, 0, 0, 0);
        dataMap[date.getTime()] = d.count;
    });
    
    let current = new Date(start);
    while (current <= end) {
        const time = current.getTime();
        result.push({
            date: new Date(current),
            count: dataMap[time] || 0
        });
        current.setDate(current.getDate() + 1);
    }
    
    return result;
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-PH', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDateShort(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

function formatNumber(num) {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString();
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============ Initialize ============

document.addEventListener('DOMContentLoaded', function() {
    // Load dashboard when page is ready
    loadDashboard();
});