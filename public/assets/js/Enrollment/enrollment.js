const ENROLLMENT_URL = "/EnrollmentMS/app/Enrollment/Controller/enrollment_controllers.php";

const searchInput = document.getElementById("searchInput");
const printBtn = document.getElementById("printBtn");
const enrollBtn = document.getElementById("enrollBtn");
const masterRows = document.getElementById("masterRows");
const emptyState = document.getElementById("emptyState");

const enrollModal = document.getElementById("enrollModal");
const closeEnrollModal = document.getElementById("closeEnrollModal");
const cancelEnrollBtn = document.getElementById("cancelEnrollBtn");
const confirmEnrollBtn = document.getElementById("confirmEnrollBtn");
const studentSearch = document.getElementById("studentSearch");
const studentResults = document.getElementById("studentResults");
const selectedStudentChip = document.getElementById("selectedStudentChip");
const chipInitials = document.getElementById("chipInitials");
const chipName = document.getElementById("chipName");
const chipMeta = document.getElementById("chipMeta");
const clearStudentBtn = document.getElementById("clearStudentBtn");
const schoolYearSel = document.getElementById("schoolYear");
const termSel = document.getElementById("term");
const strandSel = document.getElementById("strand");
const gradeSel = document.getElementById("gradeLevel");
const sectionsTable = document.getElementById("sectionsTable");
const sectionRows = document.getElementById("sectionRows");
const sectionHint = document.getElementById("sectionHint");
const enrollMsg = document.getElementById("enrollMsg");

const confirmModal = document.getElementById("confirmModal");
const confirmTitle = document.getElementById("confirmTitle");
const confirmName = document.getElementById("confirmName");
const confirmNote = document.getElementById("confirmNote");
const confirmActionBtn = document.getElementById("confirmActionBtn");
const closeConfirmModal = document.getElementById("closeConfirmModal");
const cancelConfirmBtn = document.getElementById("cancelConfirmBtn");

const scheduleModal = document.getElementById("scheduleModal");
const closeScheduleModal = document.getElementById("closeScheduleModal");
const closeScheduleModalBtn = document.getElementById("closeScheduleModalBtn");
const printScheduleBtn = document.getElementById("printScheduleBtn");
const scheduleRows = document.getElementById("scheduleRows");
const scheduleStudentInfo = document.getElementById("scheduleStudentInfo");
const scheduleSummary = document.getElementById("scheduleSummary");

let masterlist = [];
let selectedStudent = null;
let selectedSectionId = null;
let pendingAction = null;
let schoolYears = [];
let currentFilters = {
    keyword: '',
    status: 'Enrolled',
    school_year_id: '',
    semester: '',
    strand: '',
    show_enrolled: 'false'
};
let unenrolledList = [];

// ============ API Helpers ============

async function apiGet(params) {
    const url = `${ENROLLMENT_URL}?${new URLSearchParams(params).toString()}`;
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
}

async function apiPost(params) {
    const res = await fetch(ENROLLMENT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(params).toString()
    });
    return res.text();
}

// ============ UI Helpers ============

function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[c]));
}

function fullName(s) {
    return `${s.last_name}, ${s.first_name}${s.middle_name ? " " + s.middle_name : ""}`;
}

function debounce(fn, delay) {
    let timer = null;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

function setMsg(text, type) {
    enrollMsg.textContent = text;
    enrollMsg.classList.remove("is-error", "is-success");
    if (type) enrollMsg.classList.add(type);
}

// ============ Initialize Filters ============

function initFilters() {
    const toolbar = document.querySelector('.toolbar');
    if (!toolbar) return;

    // Create filter container
    const filterContainer = document.createElement('div');
    filterContainer.className = 'filter-container';
    filterContainer.style.cssText = 'display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-left: auto;';

    // Status filter
    const statusFilter = document.createElement('select');
    statusFilter.className = 'filter-select';
    statusFilter.style.cssText = 'padding: 6px 12px; border-radius: 6px; border: 1px solid #d1d5db; font-size: 13px; background: white; min-width: 120px;';
    statusFilter.innerHTML = `
        <option value="Enrolled">Enrolled</option>
        <option value="Dropped">Dropped</option>
        <option value="Pending">Pending</option>
        <option value="all">All Status</option>
    `;
    statusFilter.id = 'statusFilter';

    // School Year filter
    const schoolYearFilter = document.createElement('select');
    schoolYearFilter.className = 'filter-select';
    schoolYearFilter.style.cssText = 'padding: 6px 12px; border-radius: 6px; border: 1px solid #d1d5db; font-size: 13px; background: white; min-width: 150px;';
    schoolYearFilter.id = 'schoolYearFilter';

    // Semester filter
    const semesterFilter = document.createElement('select');
    semesterFilter.className = 'filter-select';
    semesterFilter.style.cssText = 'padding: 6px 12px; border-radius: 6px; border: 1px solid #d1d5db; font-size: 13px; background: white; min-width: 130px;';
    semesterFilter.id = 'semesterFilter';
    semesterFilter.innerHTML = `
        <option value="">All Semesters</option>
        <option value="1st Semester">1st Semester</option>
        <option value="2nd Semester">2nd Semester</option>
    `;

    // Strand filter
    const strandFilter = document.createElement('select');
    strandFilter.className = 'filter-select';
    strandFilter.style.cssText = 'padding: 6px 12px; border-radius: 6px; border: 1px solid #d1d5db; font-size: 13px; background: white; min-width: 150px;';
    strandFilter.id = 'strandFilter';

    // Show enrolled checkbox
    const checkboxContainer = document.createElement('label');
    checkboxContainer.style.cssText = 'display: flex; align-items: center; gap: 4px; font-size: 13px; cursor: pointer;';
    const showEnrolledCheckbox = document.createElement('input');
    showEnrolledCheckbox.type = 'checkbox';
    showEnrolledCheckbox.id = 'showEnrolledFilter';
    checkboxContainer.appendChild(showEnrolledCheckbox);
    checkboxContainer.appendChild(document.createTextNode('Show Enrolled'));

    // Append all filters
    filterContainer.appendChild(statusFilter);
    filterContainer.appendChild(schoolYearFilter);
    filterContainer.appendChild(semesterFilter);
    filterContainer.appendChild(strandFilter);
    filterContainer.appendChild(checkboxContainer);

    // Insert filters before the search box
    const searchBox = toolbar.querySelector('.search-box');
    if (searchBox) {
        toolbar.insertBefore(filterContainer, searchBox);
    } else {
        toolbar.appendChild(filterContainer);
    }

    // Load filter options
    loadSchoolYearFilter(schoolYearFilter);
    loadStrandFilter(strandFilter);

    // Set up event listeners
    statusFilter.addEventListener('change', function() {
        currentFilters.status = this.value;
        loadUnenrolled();
    });

    schoolYearFilter.addEventListener('change', function() {
        currentFilters.school_year_id = this.value;
        loadUnenrolled();
    });

    semesterFilter.addEventListener('change', function() {
        currentFilters.semester = this.value;
        loadUnenrolled();
    });

    strandFilter.addEventListener('change', function() {
        currentFilters.strand = this.value;
        loadUnenrolled();
    });

    showEnrolledCheckbox.addEventListener('change', function() {
        currentFilters.show_enrolled = this.checked ? 'true' : 'false';
        loadUnenrolled();
    });

    return { statusFilter, schoolYearFilter, semesterFilter, strandFilter, showEnrolledCheckbox };
}

// Add this function to view the schedule
async function viewSchedule(studentId, studentName) {
    // Show loading state
    scheduleRows.innerHTML = `<tr><td colspan="6" class="text-center">Loading schedule...</td></tr>`;
    scheduleStudentInfo.innerHTML = `<h3>${esc(studentName)}</h3><p>Loading student information...</p>`;
    scheduleSummary.innerHTML = '';
    scheduleModal.hidden = false;

    try {
        // Get student info
        const studentResponse = await fetch(`${ENROLLMENT_URL}?action=student&id=${studentId}`);
        const student = await studentResponse.json();
        
        if (!student || student.error) {
            scheduleRows.innerHTML = `<tr><td colspan="6" class="text-center" style="color: red;">Failed to load student information.</td></tr>`;
            return;
        }

        // Get student enrollments
        const enrollmentsResponse = await fetch(`${ENROLLMENT_URL}?action=student_enrollments&id=${studentId}`);
        const enrollments = await enrollmentsResponse.json();
        
        if (!enrollments || enrollments.length === 0) {
            scheduleRows.innerHTML = `<tr><td colspan="6" class="text-center">No enrollment records found for this student.</td></tr>`;
            scheduleStudentInfo.innerHTML = `
                <h3>${esc(studentName)}</h3>
                <p><strong>Student No:</strong> ${esc(student.student_number || 'N/A')}</p>
                <p><strong>Status:</strong> ${esc(student.status || 'N/A')}</p>
                <p style="color: #e74c3c;">No enrollments found.</p>
            `;
            return;
        }

        // Display student info
        scheduleStudentInfo.innerHTML = `
            <h3>${esc(studentName)}</h3>
            <div class="schedule-info-grid">
                <p><strong>Student No:</strong> ${esc(student.student_number || 'N/A')}</p>
                <p><strong>Gender:</strong> ${esc(student.gender || 'N/A')}</p>
                <p><strong>Status:</strong> ${esc(student.status || 'N/A')}</p>
            </div>
        `;

        // Display enrollment summary
        let summaryHtml = '<div class="schedule-summary-grid">';
        let totalSubjects = 0;
        enrollments.forEach((enrollment, index) => {
            summaryHtml += `
                <div class="enrollment-summary-item">
                    <strong>${enrollment.school_year}</strong> - ${enrollment.semester}
                    <br>
                    <span class="badge badge--${enrollment.status === 'Enrolled' ? 'active' : 'archived'}">${enrollment.status}</span>
                    <br>
                    <small>Section: ${enrollment.section_name || 'N/A'} | Grade: ${enrollment.grade_level || 'N/A'} | Strand: ${enrollment.strand_code || 'N/A'}</small>
                </div>
            `;
            totalSubjects++;
        });
        summaryHtml += '</div>';
        scheduleSummary.innerHTML = summaryHtml;

        // Load schedule for the first enrollment (or all combined)
        // For now, we'll show the schedule for the first active enrollment
        const activeEnrollment = enrollments.find(e => e.status === 'Enrolled');
        if (activeEnrollment) {
            await loadSchedule(studentId, activeEnrollment.section_id);
        } else if (enrollments.length > 0) {
            await loadSchedule(studentId, enrollments[0].section_id);
        } else {
            scheduleRows.innerHTML = `<tr><td colspan="6" class="text-center">No active enrollments found.</td></tr>`;
        }

    } catch (error) {
        console.error('Error loading schedule:', error);
        scheduleRows.innerHTML = `<tr><td colspan="6" class="text-center" style="color: red;">Error loading schedule. Please try again.</td></tr>`;
    }
}

// Load the schedule for a student
async function loadSchedule(studentId, sectionId) {
    try {
        // Fetch section schedule - you'll need to implement this endpoint
        // For now, we'll use a mock/placeholder
        const response = await fetch(`${ENROLLMENT_URL}?action=section_schedule&section_id=${sectionId}`);
        const data = await response.json();
        
        if (data && data.error) {
            // If the endpoint doesn't exist yet, show a message
            scheduleRows.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center" style="color: #f39c12;">
                        Schedule feature is being developed. 
                        <br><small>Section ID: ${sectionId}</small>
                    </td>
                </tr>
            `;
            return;
        }

        if (!data || data.length === 0) {
            scheduleRows.innerHTML = `<tr><td colspan="6" class="text-center">No schedule found for this section.</td></tr>`;
            return;
        }

        // Render schedule rows
        scheduleRows.innerHTML = data.map(item => `
            <tr>
                <td>${esc(item.subject_code || '-')}</td>
                <td>${esc(item.subject_name || '-')}</td>
                <td>${esc(item.day || '-')}</td>
                <td>${esc(item.time_start || '-')} - ${esc(item.time_end || '-')}</td>
                <td>${esc(item.room || '-')}</td>
                <td>${esc(item.teacher || '-')}</td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error loading section schedule:', error);
        scheduleRows.innerHTML = `
            <tr>
                <td colspan="6" class="text-center" style="color: #f39c12;">
                    Unable to load schedule. Please check if the schedule is configured for this section.
                    <br><small>Section ID: ${sectionId}</small>
                </td>
            </tr>
        `;
    }
}

// Print schedule
function printSchedule() {
    // Store the current modal state
    const modal = document.getElementById('scheduleModal');
    const wasHidden = modal.hidden;
    
    // Show the modal for printing
    modal.hidden = false;
    
    // Trigger print
    window.print();
    
    // Restore modal state after print
    setTimeout(() => {
        if (wasHidden) {
            modal.hidden = true;
        }
    }, 1000);
}

function loadSchoolYearFilter(filterElement) {
    fetch(`${ENROLLMENT_URL}?action=school_years`)
        .then(response => response.json())
        .then(data => {
            filterElement.innerHTML = '<option value="">All School Years</option>';
            data.forEach(sy => {
                const option = document.createElement('option');
                option.value = sy.school_year_id;
                option.textContent = sy.year;
                if (sy.status === 'active') {
                    option.textContent += ' (Active)';
                    option.selected = true;
                    currentFilters.school_year_id = sy.school_year_id;
                }
                filterElement.appendChild(option);
            });
            loadUnenrolled();
        })
        .catch(error => console.error('Error loading school years:', error));
}

function loadStrandFilter(filterElement) {
    fetch(`${ENROLLMENT_URL}?action=strands`)
        .then(response => response.json())
        .then(data => {
            filterElement.innerHTML = '<option value="">All Strands</option>';
            data.forEach(strand => {
                const option = document.createElement('option');
                option.value = strand.strand_code;
                option.textContent = `${strand.strand_code} - ${strand.strand_name}`;
                filterElement.appendChild(option);
            });
        })
        .catch(error => console.error('Error loading strands:', error));
}

// ============ Load Unenrolled Students ============

async function loadUnenrolled() {
    const params = new URLSearchParams();
    params.append('action', 'unenrolled');
    
    if (currentFilters.keyword) params.append('keyword', currentFilters.keyword);
    if (currentFilters.school_year_id) params.append('school_year_id', currentFilters.school_year_id);
    if (currentFilters.semester) params.append('semester', currentFilters.semester);
    if (currentFilters.strand) params.append('strand', currentFilters.strand);
    params.append('show_enrolled', currentFilters.show_enrolled);

    console.log('Loading unenrolled with params:', params.toString());

    try {
        const response = await fetch(`${ENROLLMENT_URL}?${params.toString()}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        console.log('Response length:', text.length);
        
        if (text.length === 0) {
            console.warn('Empty response received');
            unenrolledList = [];
            renderUnenrolledTable();
            return;
        }
        
        try {
            const data = JSON.parse(text);
            if (Array.isArray(data)) {
                unenrolledList = data;
                console.log('Loaded', data.length, 'records');
                renderUnenrolledTable();
            } else {
                console.error('Response is not an array:', data);
                if (data && data.error) {
                    console.error('Error from server:', data.error);
                }
                unenrolledList = [];
                renderUnenrolledTable();
            }
        } catch (e) {
            console.error('Failed to parse JSON:', e.message);
            console.error('Response preview:', text.substring(0, 500));
            unenrolledList = [];
            renderUnenrolledTable();
        }
    } catch (error) {
        console.error('Error loading unenrolled students:', error);
        unenrolledList = [];
        renderUnenrolledTable();
    }
}

function renderUnenrolledTable() {
    console.log('Rendering table with', unenrolledList.length, 'records');
    
    masterRows.innerHTML = '';
    
    if (!unenrolledList || unenrolledList.length === 0) {
        emptyState.hidden = false;
        emptyState.textContent = currentFilters.keyword 
            ? 'No students match your search criteria.' 
            : currentFilters.show_enrolled === 'true' 
                ? 'No enrolled students found.' 
                : 'No students found. All students may already be enrolled.';
        return;
    }
    emptyState.hidden = true;

    unenrolledList.forEach(row => {
        const tr = document.createElement('tr');
        
        // Determine status badge
        let statusClass = 'badge--pending';
        let statusText = 'Not Enrolled';
        
        if (row.enrollment_status === 'Enrolled') {
            statusClass = 'badge--active';
            statusText = 'Enrolled';
        } else if (row.enrollment_status === 'Dropped') {
            statusClass = 'badge--archived';
            statusText = 'Dropped';
        }

        const name = fullName(row);
        const dateEnrolled = row.date_enrolled ? new Date(row.date_enrolled).toLocaleDateString() : '-';

        // Build action buttons based on enrollment status
        let actionButtons = '';
        if (row.enrollment_id) {
            // Student is enrolled - show Drop, Delete, and View Schedule
            actionButtons = `
                <button class="btn btn--warning btn--sm" data-action="drop" data-id="${row.enrollment_id}" data-name="${esc(name)}">Drop</button>
                <button class="btn btn--danger btn--sm" data-action="delete" data-id="${row.enrollment_id}" data-name="${esc(name)}">Delete</button>
                <button class="btn btn--info btn--sm" data-action="schedule" data-id="${row.student_id}" data-name="${esc(name)}">Schedule</button>
            `;
        } else {
            // Student is not enrolled - show Enroll and View History
            actionButtons = `
                <button class="btn btn--primary btn--sm" data-action="enroll" data-id="${row.student_id}" data-name="${esc(name)}">Enroll</button>
                <button class="btn btn--ghost btn--sm" data-action="view" data-id="${row.student_id}" data-name="${esc(name)}">History</button>
                <button class="btn btn--info btn--sm" data-action="schedule" data-id="${row.student_id}" data-name="${esc(name)}">Schedule</button>
            `;
        }

        tr.innerHTML = `
            <td><span class="student-no">${esc(row.student_number || 'N/A')}</span></td>
            <td><span class="cell-name">${esc(name)}</span></td>
            <td>${esc(row.school_year || '-')}</td>
            <td>${esc(row.semester || '-')}</td>
            <td>${esc(row.strand_code || '-')}</td>
            <td>${row.grade_level ? 'Grade ' + esc(row.grade_level) : '-'}</td>
            <td>${esc(row.section_name || '-')}</td>
            <td>${dateEnrolled}</td>
            <td><span class="badge ${statusClass}">${statusText}</span></td>
            <td class="no-print"><div class="row-actions">${actionButtons}</div></td>
        `;

        masterRows.appendChild(tr);
    });

    // Attach event listeners to action buttons
    attachActionListeners();
}

function attachActionListeners() {
    // Drop buttons
    document.querySelectorAll('[data-action="drop"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            const name = this.dataset.name;
            openConfirm(
                'Drop Enrollment',
                name,
                'This student will be marked as Dropped. The slot in their section will be freed.',
                'Drop',
                'drop',
                id
            );
        });
    });

    // Delete buttons
    document.querySelectorAll('[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            const name = this.dataset.name;
            openConfirm(
                'Delete Enrollment',
                name,
                'This will permanently delete the enrollment record. This action cannot be undone.',
                'Delete',
                'delete',
                id
            );
        });
    });

    // Enroll buttons
    document.querySelectorAll('[data-action="enroll"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const studentId = this.dataset.id;
            const studentName = this.dataset.name;
            // Find the student data
            const student = unenrolledList.find(s => String(s.student_id) === studentId);
            if (student) {
                openEnrollModal(student);
            }
        });
    });

    // View History buttons
    document.querySelectorAll('[data-action="view"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const studentId = this.dataset.id;
            viewStudentHistory(studentId);
        });
    });

    // Schedule buttons - NEW
    document.querySelectorAll('[data-action="schedule"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const studentId = this.dataset.id;
            const studentName = this.dataset.name;
            viewSchedule(studentId, studentName);
        });
    });
}

// ============ View Student History ============

async function viewStudentHistory(studentId) {
    try {
        const data = await apiGet({ action: 'student_enrollments', id: studentId });
        if (!data || data.length === 0) {
            alert('This student has no enrollment history.');
            return;
        }

        let message = '=== Enrollment History ===\n\n';
        data.forEach((enrollment, index) => {
            message += `${index + 1}. ${enrollment.school_year} - ${enrollment.semester}\n`;
            message += `   Section: ${enrollment.section_name}\n`;
            message += `   Grade: ${enrollment.grade_level}\n`;
            message += `   Strand: ${enrollment.strand_code}\n`;
            message += `   Status: ${enrollment.status}\n`;
            message += `   Date: ${new Date(enrollment.date_enrolled).toLocaleDateString()}\n\n`;
        });

        alert(message);
    } catch (error) {
        console.error('Error loading student history:', error);
        alert('Failed to load student history.');
    }
}

// ============ Masterlist (Original - kept for backward compatibility) ============

async function loadMasterlist() {
    // Use the new unenrolled method instead
    loadUnenrolled();
}

// ============ Step 1: Find Student ============

let lastStudentMatches = [];

async function renderStudentResults() {
    const q = studentSearch.value.trim();
    if (!q) {
        studentResults.hidden = true;
        studentResults.innerHTML = "";
        return;
    }

    let matches = [];
    try {
        matches = await apiGet({ action: "search_students", keyword: q });
    } catch {
        matches = [];
    }
    lastStudentMatches = matches;

    studentResults.innerHTML = matches.length
        ? matches.map((s) => `
            <button type="button" class="result-item" data-id="${s.student_id}">
                <strong>${esc(fullName(s))}</strong>
                <em>${esc(s.gender || "—")}${s.student_number ? " &middot; " + esc(s.student_number) : ""}</em>
            </button>`).join("")
        : '<p class="result-empty">No matching student. Add them in Data Entry &rsaquo; Student first.</p>';
    studentResults.hidden = false;
}

const onStudentSearchInput = debounce(renderStudentResults, 250);

function selectStudent(s) {
    selectedStudent = s;
    studentSearch.value = "";
    studentResults.hidden = true;
    studentResults.innerHTML = "";
    chipInitials.textContent = `${(s.first_name || "?")[0]}${(s.last_name || "?")[0]}`.toUpperCase();
    chipName.textContent = fullName(s);
    chipMeta.textContent = `${s.gender || "—"}${s.student_number ? " · " + s.student_number : ""}`;
    selectedStudentChip.hidden = false;
    updateEnrollButton();
}

function clearStudent() {
    selectedStudent = null;
    selectedStudentChip.hidden = true;
    updateEnrollButton();
}

// ============ Step 2: Load School Years ============

async function loadSchoolYears() {
    try {
        schoolYears = await apiGet({ action: "school_years" });
    } catch {
        schoolYears = [];
    }
    
    schoolYearSel.innerHTML = '<option value="" disabled selected>Select school year</option>';
    schoolYears.forEach(sy => {
        const option = document.createElement('option');
        option.value = sy.school_year_id;
        option.textContent = sy.year;
        if (sy.status === 'active') {
            option.textContent += ' (Active)';
            option.selected = true;
        }
        schoolYearSel.appendChild(option);
    });
}

// Schedule Modal Event Listeners
closeScheduleModal.addEventListener("click", () => {
    scheduleModal.hidden = true;
});

closeScheduleModalBtn.addEventListener("click", () => {
    scheduleModal.hidden = true;
});

printScheduleBtn.addEventListener("click", printSchedule);

// Close schedule modal on overlay click
scheduleModal.addEventListener("click", (e) => {
    if (e.target === scheduleModal) {
        scheduleModal.hidden = true;
    }
});

// Close schedule modal with Escape key
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !scheduleModal.hidden) {
        scheduleModal.hidden = true;
    }
});


// ============ Open Enroll Modal with Student ============

function openEnrollModal(student) {
    // Load student data if only ID was passed
    if (typeof student === 'string' || typeof student === 'number') {
        fetch(`${ENROLLMENT_URL}?action=student&id=${student}`)
            .then(response => response.json())
            .then(data => {
                if (data) {
                    openEnrollModalWithStudent(data);
                }
            })
            .catch(error => console.error('Error loading student:', error));
        return;
    }
    openEnrollModalWithStudent(student);
}

function openEnrollModalWithStudent(student) {
    selectedStudent = student;
    chipInitials.textContent = `${(student.first_name || "?")[0]}${(student.last_name || "?")[0]}`.toUpperCase();
    chipName.textContent = fullName(student);
    chipMeta.textContent = `${student.gender || "—"}${student.student_number ? " · " + student.student_number : ""}`;
    selectedStudentChip.hidden = false;
    studentResults.hidden = true;
    studentSearch.value = '';
    
    // Reset form
    sectionRows.innerHTML = '';
    sectionsTable.hidden = true;
    sectionHint.hidden = false;
    sectionHint.textContent = "Select a school year, strand, and grade level to view available sections.";
    setMsg('');
    selectedSectionId = null;
    updateEnrollButton();
    
    enrollModal.hidden = false;
    
    // Load school years and strands
    loadSchoolYears();
    loadStrands();
}

// ============ Step 3: Sections ============

async function renderSections() {
    const strand = strandSel.value;
    const grade = gradeSel.value;
    const schoolYearId = schoolYearSel.value;
    selectedSectionId = null;
    updateEnrollButton();

    if (!strand || !grade || !schoolYearId) {
        sectionsTable.hidden = true;
        sectionHint.hidden = false;
        sectionHint.textContent = "Select a school year, strand, and grade level to view available sections.";
        return;
    }

    sectionHint.hidden = false;
    sectionHint.textContent = "Loading sections...";
    sectionsTable.hidden = true;

    let list = [];
    try {
        list = await apiGet({ action: "sections", strand, grade, school_year_id: schoolYearId });
        if (list && list.error) list = [];
    } catch {
        list = [];
    }

    if (!list.length) {
        sectionsTable.hidden = true;
        sectionHint.hidden = false;
        sectionHint.textContent = "No open sections for this school year, strand, and grade level yet.";
        return;
    }

    sectionRows.innerHTML = list.map((s) => {
        const count = Number(s.enrolled_count);
        const slots = s.max_slots - count;
        const full = slots <= 0;
        return `<tr class="sec-row${full ? " is-full" : ""}" data-id="${s.section_id}" title="${full ? "Section is full" : "Click to select this section"}">
            <td><span class="cell-name">${esc(s.section_name)}</span></td>
            <td>${count}</td>
            <td>${s.max_slots}</td>
            <td><span class="badge ${full ? "badge--archived" : "badge--active"}">${full ? "Full" : slots + " slots"}</span></td>
        </tr>`;
    }).join("");

    sectionsTable.hidden = false;
    sectionHint.hidden = true;
}

// ============ Load Strands ============

let strandsList = [];

async function loadStrands() {
    try {
        strandsList = await apiGet({ action: "strands" });
    } catch {
        strandsList = [];
    }
    strandSel.innerHTML =
        '<option value="" disabled selected>Select strand</option>' +
        strandsList.map((s) => `<option value="${esc(s.strand_code)}">${esc(s.strand_name)} (${esc(s.strand_code)})</option>`).join("");
}

// ============ Modal Functions ============

function updateEnrollButton() {
    confirmEnrollBtn.disabled = !(selectedStudent && selectedSectionId);
}

function resetEnrollModal() {
    clearStudent();
    studentSearch.value = "";
    studentResults.hidden = true;
    strandSel.selectedIndex = 0;
    gradeSel.selectedIndex = 0;
    termSel.selectedIndex = 0;
    schoolYearSel.selectedIndex = 0;
    setMsg("");
    sectionsTable.hidden = true;
    sectionHint.hidden = false;
    sectionHint.textContent = "Select a school year, strand, and grade level to view available sections.";
}

function openConfirm(title, name, note, actionLabel, action, id) {
    confirmTitle.textContent = title;
    confirmName.textContent = name;
    confirmNote.textContent = note;
    confirmActionBtn.textContent = actionLabel;
    confirmActionBtn.className = `btn btn--${action === 'drop' ? 'warning' : 'danger'}`;
    pendingAction = { action, id };
    confirmModal.hidden = false;
}

function hideModals() {
    enrollModal.hidden = true;
    confirmModal.hidden = true;
    pendingAction = null;
}

// ============ Event Wiring ============

// Initialize filters on page load
let filterElements = null;
document.addEventListener('DOMContentLoaded', function() {
    filterElements = initFilters();
    // Set up search input listener
    searchInput.addEventListener("input", debounce(function() {
        currentFilters.keyword = this.value.trim();
        loadUnenrolled();
    }, 250));
});

printBtn.addEventListener("click", () => window.print());

enrollBtn.addEventListener("click", async () => {
    await Promise.all([loadSchoolYears(), loadStrands()]);
    resetEnrollModal();
    enrollModal.hidden = false;
    studentSearch.focus();
});

closeEnrollModal.addEventListener("click", hideModals);
cancelEnrollBtn.addEventListener("click", hideModals);
closeConfirmModal.addEventListener("click", hideModals);
cancelConfirmBtn.addEventListener("click", hideModals);

[enrollModal, confirmModal].forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) hideModals();
    });
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideModals();
});

studentSearch.addEventListener("input", onStudentSearchInput);

studentResults.addEventListener("click", (e) => {
    const item = e.target.closest(".result-item");
    if (!item) return;
    const s = lastStudentMatches.find((x) => String(x.student_id) === item.dataset.id);
    if (s) selectStudent(s);
});

clearStudentBtn.addEventListener("click", clearStudent);

schoolYearSel.addEventListener("change", renderSections);
strandSel.addEventListener("change", renderSections);
gradeSel.addEventListener("change", renderSections);

sectionRows.addEventListener("click", (e) => {
    const row = e.target.closest(".sec-row");
    if (!row || row.classList.contains("is-full")) return;
    selectedSectionId = row.dataset.id;
    sectionRows.querySelectorAll(".sec-row").forEach((r) => r.classList.toggle("is-selected", r === row));
    setMsg("");
    updateEnrollButton();
});

// ============ Confirm Enrollment ============

confirmEnrollBtn.addEventListener("click", async () => {
    if (!selectedStudent || !selectedSectionId) return;

    confirmEnrollBtn.disabled = true;

    const response = await apiPost({
        action: "create",
        student_id: selectedStudent.student_id,
        section_id: selectedSectionId,
        school_year_id: schoolYearSel.value,
        semester: termSel.value
    });

    if (response.indexOf("SUCCESS") !== -1) {
        hideModals();
        loadUnenrolled();
    } else {
        confirmEnrollBtn.disabled = false;
        setMsg(response.replace(/^INSERT FAILED:\s*/, ""), "is-error");
    }
});

// ============ Confirm Action (Drop/Delete) ============

confirmActionBtn.addEventListener("click", async () => {
    if (!pendingAction) return;
    
    const { action, id } = pendingAction;
    let response = '';
    
    if (action === 'drop') {
        response = await apiPost({ action: "drop", enrollment_id: id });
        if (response.indexOf("SUCCESS") !== -1) {
            hideModals();
            loadUnenrolled();
        } else {
            alert('Failed to drop enrollment: ' + response);
            hideModals();
        }
    } else if (action === 'delete') {
        response = await apiPost({ action: "delete", enrollment_id: id });
        if (response.indexOf("SUCCESS") !== -1) {
            hideModals();
            loadUnenrolled();
        } else {
            alert('Failed to delete enrollment: ' + response);
            hideModals();
        }
    }
});

// ============ Init ============
// Initial load will be triggered by the filter initialization