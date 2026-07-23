const ENROLLMENT_URL = "/EnrollmentMS/app/Enrollment/Controller/enrollment_controllers.php";

const searchInput = document.getElementById("searchInput");
const printBtn = document.getElementById("printBtn");
const enrollBtn = document.getElementById("enrollBtn");
const masterRows = document.getElementById("masterRows");
const emptyState = document.getElementById("emptyState");

// Filter elements
const viewFilter = document.getElementById("viewFilter");
const statusFilter = document.getElementById("statusFilter");
const schoolYearFilter = document.getElementById("schoolYearFilter");
const semesterFilter = document.getElementById("semesterFilter");
const strandFilter = document.getElementById("strandFilter");

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
let currentView = 'enrolled';
let currentFilters = {
    keyword: '',
    status: 'all',
    school_year_id: '',
    semester: '',
    strand: ''
};

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
    return function(...args) {
        const context = this;
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(context, args), delay);
    };
}

function setMsg(text, type) {
    if (!enrollMsg) return;
    enrollMsg.textContent = text;
    enrollMsg.classList.remove("is-error", "is-success");
    if (type) enrollMsg.classList.add(type);
}

function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 24px;
        border-radius: 8px;
        color: #fff;
        font-weight: 500;
        z-index: 9999;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
    `;
    
    const colors = {
        success: "#28a745",
        error: "#dc3545",
        info: "#17a2b8",
        warning: "#ffc107"
    };
    
    toast.style.background = colors[type] || colors.info;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transition = "opacity 0.3s";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============ Load Filter Options ============

function loadFilterSchoolYears() {
    fetch(`${ENROLLMENT_URL}?action=school_years`)
        .then(response => response.json())
        .then(data => {
            if (schoolYearFilter) {
                schoolYearFilter.innerHTML = '<option value="">All School Years</option>';
                data.forEach(sy => {
                    const option = document.createElement('option');
                    option.value = sy.school_year_id;
                    option.textContent = sy.year;
                    if (sy.status === 'active') {
                        option.textContent += ' (Active)';
                    }
                    schoolYearFilter.appendChild(option);
                });
            }
            loadSchoolYears();
            loadEnrollments();
        })
        .catch(error => console.error('Error loading school years:', error));
}

function loadFilterStrands() {
    fetch(`${ENROLLMENT_URL}?action=strands`)
        .then(response => response.json())
        .then(data => {
            if (strandFilter) {
                strandFilter.innerHTML = '<option value="">All Strands</option>';
                data.forEach(strand => {
                    const option = document.createElement('option');
                    option.value = strand.strand_code;
                    option.textContent = `${strand.strand_code} - ${strand.strand_name}`;
                    strandFilter.appendChild(option);
                });
            }
        })
        .catch(error => console.error('Error loading strands:', error));
}

// ============ Load Enrollments with Filters ============

async function loadEnrollments() {
    if (!viewFilter) return;
    
    const view = viewFilter.value;
    currentView = view;
    const params = new URLSearchParams();
    
    if (view === 'unenrolled' || view === 'inactive') {
        params.append('action', view === 'inactive' ? 'inactive_students' : 'unenrolled');
        
        const schoolYearId = schoolYearFilter ? schoolYearFilter.value : '';
        const semester = semesterFilter ? semesterFilter.value : '';
        const strand = strandFilter ? strandFilter.value : '';
        const keyword = searchInput ? searchInput.value.trim() : '';

        if (keyword) params.append('keyword', keyword);
        if (schoolYearId) params.append('school_year_id', schoolYearId);
        if (semester) params.append('semester', semester);
        if (strand) params.append('strand', strand);
        
        // For unenrolled view, show only unenrolled
        if (view === 'unenrolled') {
            params.append('show_enrolled', 'false');
        }
    } else {
        params.append('action', 'list');
        
        const status = statusFilter ? statusFilter.value : 'all';
        const schoolYearId = schoolYearFilter ? schoolYearFilter.value : '';
        const semester = semesterFilter ? semesterFilter.value : '';
        const strand = strandFilter ? strandFilter.value : '';
        const keyword = searchInput ? searchInput.value.trim() : '';

        if (keyword) params.append('keyword', keyword);
        if (status && status !== 'all') params.append('status', status);
        if (schoolYearId) params.append('school_year_id', schoolYearId);
        if (semester) params.append('semester', semester);
        if (strand) params.append('strand', strand);
    }

    console.log('Loading enrollments with params:', params.toString());

    try {
        const response = await fetch(`${ENROLLMENT_URL}?${params.toString()}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (Array.isArray(data)) {
            renderEnrollments(data, view);
        } else {
            console.error('Response is not an array:', data);
            if (data && data.error) {
                console.error('Error from server:', data.error);
            }
            renderEnrollments([]);
        }
    } catch (error) {
        console.error('Error loading enrollments:', error);
        renderEnrollments([]);
    }
}

function renderEnrollments(enrollments, view = 'enrolled') {
    if (!masterRows) return;
    masterRows.innerHTML = '';
    
    if (!enrollments || enrollments.length === 0) {
        if (emptyState) {
            emptyState.hidden = false;
            if (view === 'inactive') {
                emptyState.textContent = 'No inactive students found.';
            } else if (view === 'unenrolled') {
                emptyState.textContent = 'No unenrolled students found. All students are enrolled for the selected filters.';
            } else {
                emptyState.textContent = 'No enrollments found matching your filters.';
            }
        }
        return;
    }
    if (emptyState) emptyState.hidden = true;

    enrollments.forEach(row => {
        const tr = document.createElement('tr');
        
        // Determine if this is an inactive student or enrollment record
        const isInactive = row.student_status === 'Inactive' || view === 'inactive';
        const isUnenrolled = view === 'unenrolled' || row.enrollment_status === 'Not Enrolled';
        
        let statusText = 'Enrolled';
        let statusClass = 'badge--active';
        
        if (isInactive) {
            statusText = 'Inactive';
            statusClass = 'badge--archived';
        } else if (isUnenrolled) {
            statusText = 'Not Enrolled';
            statusClass = 'badge--archived';
        } else if (row.status) {
            statusText = row.status;
            if (row.status === 'Dropped') {
                statusClass = 'badge--archived';
            } else if (row.status === 'Pending') {
                statusClass = 'badge--pending';
            } else {
                statusClass = 'badge--active';
            }
        }

        const name = fullName(row);
        const dateEnrolled = row.date_enrolled ? new Date(row.date_enrolled).toLocaleDateString() : '-';

        let actionButtons = '';
        
        if (isInactive) {
            // For inactive students: ONLY show Enroll button, no Schedule
            actionButtons = `
                <button class="btn btn--primary btn--sm" data-action="enroll-inactive" data-student-id="${row.student_id}" data-name="${esc(name)}">Enroll</button>
            `;
        } else if (isUnenrolled) {
            // For not enrolled students: Show Enroll button only (opens modal with pre-populated student)
            actionButtons = `
                <button class="btn btn--primary btn--sm" data-action="enroll-student" data-student-id="${row.student_id}" data-name="${esc(name)}">Enroll</button>
            `;
        } else if (statusText === 'Enrolled') {
            actionButtons = `
                <button class="btn btn--warning btn--sm" data-action="drop" data-id="${row.enrollment_id}" data-name="${esc(name)}">Drop</button>
                <button class="btn btn--danger btn--sm" data-action="delete" data-id="${row.enrollment_id}" data-name="${esc(name)}">Delete</button>
                <button class="btn btn--info btn--sm" data-action="schedule" data-student-id="${row.student_id}" data-name="${esc(name)}">Schedule</button>
            `;
        } else if (statusText === 'Dropped') {
            actionButtons = `
                <button class="btn btn--primary btn--sm" data-action="reactivate" data-id="${row.enrollment_id}" data-name="${esc(name)}">Reactivate</button>
                <button class="btn btn--danger btn--sm" data-action="delete" data-id="${row.enrollment_id}" data-name="${esc(name)}">Delete</button>
                <button class="btn btn--info btn--sm" data-action="schedule" data-student-id="${row.student_id}" data-name="${esc(name)}">Schedule</button>
            `;
        } else {
            actionButtons = `
                <button class="btn btn--danger btn--sm" data-action="delete" data-id="${row.enrollment_id}" data-name="${esc(name)}">Delete</button>
                <button class="btn btn--info btn--sm" data-action="schedule" data-student-id="${row.student_id}" data-name="${esc(name)}">Schedule</button>
            `;
        }

        tr.innerHTML = `
            <td><span class="student-no">${esc(row.student_number || 'N/A')}</span></td>
            <td><span class="cell-name">${esc(name)}</span></td>
            <td>${esc(row.school_year || row.school_year_display || '-')}</td>
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

    attachActionListeners();
}

function attachActionListeners() {
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

    document.querySelectorAll('[data-action="reactivate"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            const name = this.dataset.name;
            openConfirm(
                'Reactivate Enrollment',
                name,
                'This student will be marked as Enrolled again.',
                'Reactivate',
                'reactivate',
                id
            );
        });
    });

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

    // Handle enroll for not enrolled students (opens modal with pre-populated student)
    document.querySelectorAll('[data-action="enroll-student"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const studentId = this.dataset.studentId;
            const studentName = this.dataset.name;
            openEnrollFromList(studentId, studentName);
        });
    });

    // Handle enroll for inactive students (opens modal with pre-populated student)
    document.querySelectorAll('[data-action="enroll-inactive"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const studentId = this.dataset.studentId;
            const studentName = this.dataset.name;
            openEnrollFromList(studentId, studentName);
        });
    });

    document.querySelectorAll('[data-action="schedule"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const studentId = this.dataset.studentId;
            const studentName = this.dataset.name;
            viewSchedule(studentId, studentName);
        });
    });
}

// ============ Open Enroll Modal with Pre-selected Student ============

async function openEnrollFromList(studentId, studentName) {
    try {
        // Fetch student details
        const response = await fetch(`${ENROLLMENT_URL}?action=student&id=${studentId}`);
        const student = await response.json();
        
        if (student && student.student_id) {
            // Reset and open modal
            resetEnrollModal();
            await loadSchoolYears();
            await loadStrands();
            if (enrollModal) enrollModal.hidden = false;
            
            // Pre-select the student
            selectStudent(student);
            
            // Show a message that the student is pre-selected
            setMsg(`Ready to enroll: ${fullName(student)}. Please select section details below.`, "is-success");
            
            // Focus on the modal
            const enrollTitle = document.getElementById('enrollTitle');
            if (enrollTitle) enrollTitle.focus();
            
            // Auto-select the first school year if available
            if (schoolYearSel && schoolYearSel.options.length > 1) {
                // Find and select the active school year
                let activeFound = false;
                for (let i = 0; i < schoolYearSel.options.length; i++) {
                    if (schoolYearSel.options[i].text.includes('(Active)')) {
                        schoolYearSel.selectedIndex = i;
                        activeFound = true;
                        break;
                    }
                }
                // If no active found, select the first option
                if (!activeFound && schoolYearSel.options.length > 1) {
                    schoolYearSel.selectedIndex = 1;
                }
                // Trigger change event to load sections
                schoolYearSel.dispatchEvent(new Event('change'));
            }
        } else {
            showToast('Error loading student details. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error loading student for enrollment:', error);
        showToast('Error loading student details. Please try again.', 'error');
    }
}

// ============ View Schedule ============

async function viewSchedule(studentId, studentName) {
    if (scheduleRows) {
        scheduleRows.innerHTML = `<tr><td colspan="6" class="text-center">Loading schedule...</td></tr>`;
    }
    if (scheduleStudentInfo) {
        scheduleStudentInfo.innerHTML = `<h3>${esc(studentName)}</h3><p>Loading student information...</p>`;
    }
    if (scheduleSummary) scheduleSummary.innerHTML = '';
    if (scheduleModal) scheduleModal.hidden = false;

    try {
        const studentResponse = await fetch(`${ENROLLMENT_URL}?action=student&id=${studentId}`);
        const student = await studentResponse.json();
        
        if (!student || student.error) {
            if (scheduleRows) {
                scheduleRows.innerHTML = `<tr><td colspan="6" class="text-center" style="color: red;">Failed to load student information.</td></tr>`;
            }
            return;
        }

        const enrollmentsResponse = await fetch(`${ENROLLMENT_URL}?action=student_enrollments&id=${studentId}`);
        const enrollments = await enrollmentsResponse.json();
        
        if (!enrollments || enrollments.length === 0) {
            if (scheduleRows) {
                scheduleRows.innerHTML = `<tr><td colspan="6" class="text-center">No enrollment records found for this student.</td></tr>`;
            }
            if (scheduleStudentInfo) {
                scheduleStudentInfo.innerHTML = `
                    <h3>${esc(studentName)}</h3>
                    <div class="schedule-info-grid">
                        <p><strong>Student No:</strong> ${esc(student.student_number || 'N/A')}</p>
                        <p><strong>Gender:</strong> ${esc(student.gender || 'N/A')}</p>
                        <p><strong>Status:</strong> ${esc(student.status || 'N/A')}</p>
                    </div>
                    <p style="color: #e74c3c;">No enrollments found.</p>
                `;
            }
            return;
        }

        if (scheduleStudentInfo) {
            scheduleStudentInfo.innerHTML = `
                <h3>${esc(studentName)}</h3>
                <div class="schedule-info-grid">
                    <p><strong>Student No:</strong> ${esc(student.student_number || 'N/A')}</p>
                    <p><strong>Gender:</strong> ${esc(student.gender || 'N/A')}</p>
                    <p><strong>Status:</strong> ${esc(student.status || 'N/A')}</p>
                </div>
            `;
        }

        let summaryHtml = '<div class="schedule-summary-grid">';
        enrollments.forEach((enrollment) => {
            let statusClass = enrollment.status === 'Enrolled' ? 'badge--active' : 'badge--archived';
            summaryHtml += `
                <div class="enrollment-summary-item">
                    <strong>${enrollment.school_year}</strong> - ${enrollment.semester}
                    <br>
                    <span class="badge ${statusClass}">${enrollment.status}</span>
                    <br>
                    <small>Section: ${enrollment.section_name || 'N/A'} | Grade: ${enrollment.grade_level || 'N/A'} | Strand: ${enrollment.strand_code || 'N/A'}</small>
                </div>
            `;
        });
        summaryHtml += '</div>';
        if (scheduleSummary) scheduleSummary.innerHTML = summaryHtml;

        const activeEnrollment = enrollments.find(e => e.status === 'Enrolled');
        if (activeEnrollment) {
            await loadSchedule(studentId, activeEnrollment.section_id);
        } else if (enrollments.length > 0) {
            await loadSchedule(studentId, enrollments[0].section_id);
        } else {
            if (scheduleRows) {
                scheduleRows.innerHTML = `<tr><td colspan="6" class="text-center">No active enrollments found.</td></tr>`;
            }
        }

    } catch (error) {
        console.error('Error loading schedule:', error);
        if (scheduleRows) {
            scheduleRows.innerHTML = `<tr><td colspan="6" class="text-center" style="color: red;">Error loading schedule. Please try again.</td></tr>`;
        }
    }
}

async function loadSchedule(studentId, sectionId) {
    try {
        const response = await fetch(`${ENROLLMENT_URL}?action=section_schedule&section_id=${sectionId}`);
        const data = await response.json();
        
        if (data && data.error) {
            if (scheduleRows) {
                scheduleRows.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center" style="color: #f39c12;">
                            Schedule feature is being developed. 
                            <br><small>Section ID: ${sectionId}</small>
                        </td>
                    </tr>
                `;
            }
            return;
        }

        if (!data || data.length === 0) {
            if (scheduleRows) {
                scheduleRows.innerHTML = `<tr><td colspan="6" class="text-center">No schedule found for this section.</td></tr>`;
            }
            return;
        }

        if (scheduleRows) {
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
        }

    } catch (error) {
        console.error('Error loading section schedule:', error);
        if (scheduleRows) {
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
}

function printSchedule() {
    const modal = document.getElementById('scheduleModal');
    const wasHidden = modal ? modal.hidden : true;
    if (modal) modal.hidden = false;
    window.print();
    setTimeout(() => {
        if (modal && wasHidden) {
            modal.hidden = true;
        }
    }, 1000);
}

// ============ Student Selection Functions ============

function resetSelectedStudent() {
    selectedStudent = null;
    selectedSectionId = null;
    if (selectedStudentChip) {
        selectedStudentChip.hidden = true;
        selectedStudentChip.style.display = 'none';
    }
    updateEnrollButton();
    setMsg("");
}

function selectStudent(student) {
    selectedStudent = student;
    if (studentSearch) studentSearch.value = "";
    if (studentResults) {
        studentResults.hidden = true;
        studentResults.innerHTML = "";
    }
    if (chipInitials) {
        chipInitials.textContent = `${(student.first_name || "?")[0]}${(student.last_name || "?")[0]}`.toUpperCase();
    }
    if (chipName) chipName.textContent = fullName(student);
    if (chipMeta) {
        chipMeta.textContent = `${student.gender || "—"}${student.student_number ? " · " + student.student_number : ""}`;
    }
    if (selectedStudentChip) {
        selectedStudentChip.hidden = false;
        selectedStudentChip.style.display = 'flex';
    }
    updateEnrollButton();
}

// ============ Modal Functions ============

function loadSchoolYears() {
    return new Promise((resolve) => {
        fetch(`${ENROLLMENT_URL}?action=school_years`)
            .then(response => response.json())
            .then(data => {
                schoolYears = data;
                if (schoolYearSel) {
                    schoolYearSel.innerHTML = '<option value="" disabled selected>Select school year</option>';
                    data.forEach(sy => {
                        const option = document.createElement('option');
                        option.value = sy.school_year_id;
                        option.textContent = sy.year;
                        if (sy.status === 'active') {
                            option.textContent += ' (Active)';
                        }
                        schoolYearSel.appendChild(option);
                    });
                }
                resolve();
            })
            .catch(error => {
                console.error('Error loading school years:', error);
                resolve();
            });
    });
}

function loadStrands() {
    return new Promise((resolve) => {
        fetch(`${ENROLLMENT_URL}?action=strands`)
            .then(response => response.json())
            .then(data => {
                if (strandSel) {
                    strandSel.innerHTML = '<option value="" disabled selected>Select strand</option>';
                    data.forEach(strand => {
                        const option = document.createElement('option');
                        option.value = strand.strand_code;
                        option.textContent = `${strand.strand_name} (${strand.strand_code})`;
                        strandSel.appendChild(option);
                    });
                }
                resolve();
            })
            .catch(error => {
                console.error('Error loading strands:', error);
                resolve();
            });
    });
}

async function renderSections() {
    const strand = strandSel ? strandSel.value : '';
    const grade = gradeSel ? gradeSel.value : '';
    const schoolYearId = schoolYearSel ? schoolYearSel.value : '';
    selectedSectionId = null;
    updateEnrollButton();

    if (!strand || !grade || !schoolYearId) {
        if (sectionsTable) sectionsTable.hidden = true;
        if (sectionHint) {
            sectionHint.hidden = false;
            sectionHint.textContent = "Select a school year, strand, and grade level to view available sections.";
        }
        return;
    }

    if (sectionHint) {
        sectionHint.hidden = false;
        sectionHint.textContent = "Loading sections...";
    }
    if (sectionsTable) sectionsTable.hidden = true;

    let list = [];
    try {
        list = await apiGet({ action: "sections", strand, grade, school_year_id: schoolYearId });
        if (list && list.error) list = [];
    } catch {
        list = [];
    }

    if (!list.length) {
        if (sectionsTable) sectionsTable.hidden = true;
        if (sectionHint) {
            sectionHint.hidden = false;
            sectionHint.textContent = "No open sections for this school year, strand, and grade level yet.";
        }
        return;
    }

    if (sectionRows) {
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
    }

    if (sectionsTable) sectionsTable.hidden = false;
    if (sectionHint) sectionHint.hidden = true;
}

function updateEnrollButton() {
    if (confirmEnrollBtn) {
        confirmEnrollBtn.disabled = !(selectedStudent && selectedSectionId);
    }
}

function resetEnrollModal() {
    selectedStudent = null;
    selectedSectionId = null;
    if (selectedStudentChip) {
        selectedStudentChip.hidden = true;
        selectedStudentChip.style.display = 'none';
    }
    if (studentSearch) studentSearch.value = "";
    if (studentResults) {
        studentResults.hidden = true;
        studentResults.innerHTML = "";
    }
    if (strandSel) strandSel.selectedIndex = 0;
    if (gradeSel) gradeSel.selectedIndex = 0;
    if (termSel) termSel.selectedIndex = 0;
    if (schoolYearSel) schoolYearSel.selectedIndex = 0;
    setMsg("");
    if (sectionsTable) sectionsTable.hidden = true;
    if (sectionHint) {
        sectionHint.hidden = false;
        sectionHint.textContent = "Select a school year, strand, and grade level to view available sections.";
    }
    updateEnrollButton();
}

function openConfirm(title, name, note, actionLabel, action, id) {
    if (confirmTitle) confirmTitle.textContent = title;
    if (confirmName) confirmName.textContent = name;
    if (confirmNote) confirmNote.textContent = note;
    if (confirmActionBtn) {
        confirmActionBtn.textContent = actionLabel;
        confirmActionBtn.className = `btn btn--${action === 'drop' ? 'warning' : action === 'reactivate' ? 'primary' : 'danger'}`;
    }
    pendingAction = { action, id };
    if (confirmModal) confirmModal.hidden = false;
}

function hideModals() {
    if (enrollModal) enrollModal.hidden = true;
    if (confirmModal) confirmModal.hidden = true;
    pendingAction = null;
}

// ============ Event Listeners ============

// View filter change
if (viewFilter) {
    viewFilter.addEventListener('change', function() {
        // Show/hide status filter based on view
        if (statusFilter) {
            if (this.value === 'enrolled') {
                statusFilter.style.display = 'inline-block';
            } else {
                statusFilter.style.display = 'none';
                statusFilter.value = 'all';
            }
        }
        loadEnrollments();
    });
}

// Filter event listeners
if (statusFilter) statusFilter.addEventListener('change', loadEnrollments);
if (schoolYearFilter) schoolYearFilter.addEventListener('change', loadEnrollments);
if (semesterFilter) semesterFilter.addEventListener('change', loadEnrollments);
if (strandFilter) strandFilter.addEventListener('change', loadEnrollments);

// Search
if (searchInput) {
    searchInput.addEventListener("input", debounce(function() {
        loadEnrollments();
    }, 250));
}

// Search clear button
const searchClear = document.querySelector('.search-clear');
if (searchClear) {
    searchClear.addEventListener('click', function() {
        if (searchInput) {
            searchInput.value = '';
        }
        this.hidden = true;
        loadEnrollments();
    });
}

// Print
if (printBtn) printBtn.addEventListener("click", () => window.print());

// Enroll button
if (enrollBtn) {
    enrollBtn.addEventListener("click", async () => {
        resetEnrollModal();
        await loadSchoolYears();
        await loadStrands();
        if (enrollModal) enrollModal.hidden = false;
        if (studentSearch) studentSearch.focus();
    });
}

// Modal close buttons
if (closeEnrollModal) closeEnrollModal.addEventListener("click", hideModals);
if (cancelEnrollBtn) cancelEnrollBtn.addEventListener("click", hideModals);
if (closeConfirmModal) closeConfirmModal.addEventListener("click", hideModals);
if (cancelConfirmBtn) cancelConfirmBtn.addEventListener("click", hideModals);

// Schedule modal close buttons
if (closeScheduleModal) {
    closeScheduleModal.addEventListener("click", () => {
        if (scheduleModal) scheduleModal.hidden = true;
    });
}
if (closeScheduleModalBtn) {
    closeScheduleModalBtn.addEventListener("click", () => {
        if (scheduleModal) scheduleModal.hidden = true;
    });
}
if (printScheduleBtn) printScheduleBtn.addEventListener("click", printSchedule);

// Close modals on overlay click
[enrollModal, confirmModal, scheduleModal].forEach((overlay) => {
    if (overlay) {
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
                if (overlay === scheduleModal) {
                    scheduleModal.hidden = true;
                } else {
                    hideModals();
                }
            }
        });
    }
});

// Escape key
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        if (scheduleModal && !scheduleModal.hidden) {
            scheduleModal.hidden = true;
        } else {
            hideModals();
        }
    }
});

// ============ Student Selection Event Listeners ============

// Clear student button
if (clearStudentBtn) {
    clearStudentBtn.addEventListener("click", function(e) {
        e.stopPropagation();
        resetSelectedStudent();
        setMsg("");
    });
}

// Student search results click
if (studentResults) {
    studentResults.addEventListener("click", (e) => {
        const item = e.target.closest(".result-item");
        if (!item) return;
        const studentId = item.dataset.id;
        fetch(`${ENROLLMENT_URL}?action=student&id=${studentId}`)
            .then(response => response.json())
            .then(student => {
                if (student && student.student_id) {
                    selectStudent(student);
                    setMsg("");
                }
            })
            .catch(error => console.error('Error selecting student:', error));
    });
}

// Student search input
if (studentSearch) {
    studentSearch.addEventListener("input", debounce(async function() {
        const q = this.value.trim();
        if (!q) {
            if (studentResults) {
                studentResults.hidden = true;
                studentResults.innerHTML = "";
            }
            return;
        }

        try {
            const matches = await apiGet({ action: "search_students", keyword: q });
            if (studentResults) {
                studentResults.innerHTML = matches.length
                    ? matches.map((s) => `
                        <button type="button" class="result-item" data-id="${s.student_id}">
                            <strong>${esc(fullName(s))}</strong>
                            <em>${esc(s.gender || "—")}${s.student_number ? " &middot; " + esc(s.student_number) : ""}</em>
                        </button>`).join("")
                    : '<p class="result-empty">No matching student found.</p>';
                studentResults.hidden = false;
            }
        } catch {
            if (studentResults) {
                studentResults.innerHTML = '<p class="result-empty">Error searching students.</p>';
                studentResults.hidden = false;
            }
        }
    }, 250));
}

// ============ Enrollment Details Event Listeners ============

if (schoolYearSel) schoolYearSel.addEventListener("change", renderSections);
if (strandSel) strandSel.addEventListener("change", renderSections);
if (gradeSel) gradeSel.addEventListener("change", renderSections);

// Section selection
if (sectionRows) {
    sectionRows.addEventListener("click", (e) => {
        const row = e.target.closest(".sec-row");
        if (!row || row.classList.contains("is-full")) return;
        selectedSectionId = row.dataset.id;
        sectionRows.querySelectorAll(".sec-row").forEach((r) => r.classList.toggle("is-selected", r === row));
        setMsg("");
        updateEnrollButton();
    });
}

// Confirm enrollment
if (confirmEnrollBtn) {
    confirmEnrollBtn.addEventListener("click", async () => {
        if (!selectedStudent || !selectedSectionId) return;

        // Validate that all required fields are selected
        if (!schoolYearSel.value || !termSel.value || !strandSel.value || !gradeSel.value) {
            setMsg("Please select all required fields: School Year, Term, Strand, and Grade Level.", "is-error");
            return;
        }

        confirmEnrollBtn.disabled = true;
        confirmEnrollBtn.textContent = "Enrolling...";

        const response = await apiPost({
            action: "create",
            student_id: selectedStudent.student_id,
            section_id: selectedSectionId,
            school_year_id: schoolYearSel.value,
            semester: termSel.value
        });

        confirmEnrollBtn.disabled = false;
        confirmEnrollBtn.textContent = "Enroll Student";

        if (response.includes("SUCCESS")) {
            hideModals();
            loadEnrollments();
            showToast("Student enrolled successfully!", "success");
        } else {
            setMsg(response.replace(/^INSERT FAILED:\s*/, ""), "is-error");
        }
    });
}

// Confirm action (drop/delete/reactivate)
if (confirmActionBtn) {
    confirmActionBtn.addEventListener("click", async () => {
        if (!pendingAction) return;
        
        const { action, id } = pendingAction;
        let response = '';
        
        if (action === 'drop') {
            response = await apiPost({ action: "drop", enrollment_id: id });
            if (response.includes("SUCCESS")) {
                hideModals();
                loadEnrollments();
                showToast("Student dropped successfully!", "info");
            } else {
                alert('Failed to drop enrollment: ' + response);
                hideModals();
            }
        } else if (action === 'reactivate') {
            response = await apiPost({ action: "reactivate", enrollment_id: id });
            if (response.includes("SUCCESS")) {
                hideModals();
                loadEnrollments();
                showToast("Student reactivated successfully!", "success");
            } else {
                alert('Failed to reactivate enrollment: ' + response);
                hideModals();
            }
        } else if (action === 'delete') {
            response = await apiPost({ action: "delete", enrollment_id: id });
            if (response.includes("SUCCESS")) {
                hideModals();
                loadEnrollments();
                showToast("Enrollment deleted successfully!", "warning");
            } else {
                alert('Failed to delete enrollment: ' + response);
                hideModals();
            }
        }
    });
}

// ============ Init ============
document.addEventListener('DOMContentLoaded', function() {
    loadFilterSchoolYears();
    loadFilterStrands();
    
    // Hide status filter initially if not on enrolled view
    if (viewFilter && viewFilter.value !== 'enrolled' && statusFilter) {
        statusFilter.style.display = 'none';
    }
});