const SCHEDULE_URL = "/EnrollmentMS/app/Schedules/Controller/schedule_controllers.php";
const PAGE_SIZE = 10;

const DAYS = {
    'Monday': 'Mon',
    'Tuesday': 'Tue',
    'Wednesday': 'Wed',
    'Thursday': 'Thu',
    'Friday': 'Fri',
    'Saturday': 'Sat',
    'Sunday': 'Sun'
};

// Calendar View Elements
const tableViewBtn = document.getElementById("tableViewBtn");
const calendarViewBtn = document.getElementById("calendarViewBtn");
const tableView = document.querySelector(".table-wrap");
const calendarView = document.getElementById("calendarView");
const calendarGrid = document.getElementById("calendarGrid");
const calendarEmpty = document.getElementById("calendarEmpty");
const calendarSectionInfo = document.getElementById("calendarSectionInfo");
const prevWeekBtn = document.getElementById("prevWeekBtn");
const nextWeekBtn = document.getElementById("nextWeekBtn");
const todayBtn = document.getElementById("todayBtn");
const weekRange = document.getElementById("weekRange");
const calendarSectionFilter = document.getElementById("calendarSectionFilter");
const calendarTermFilter = document.getElementById("calendarTermFilter");

// DOM Elements
const searchInput = document.getElementById("searchInput");
const termFilter = document.getElementById("termFilter");
const sectionFilter = document.getElementById("sectionFilter");
const addSchedBtn = document.getElementById("addSchedBtn");
const printPreviewBtn = document.getElementById("printPreviewBtn");
const schedRows = document.getElementById("schedRows");
const emptyState = document.getElementById("emptyState");

const pagination = document.getElementById("pagination");
const pageInfo = document.getElementById("pageInfo");
const pageControls = document.getElementById("pageControls");

const schedModal = document.getElementById("schedModal");
const schedForm = document.getElementById("schedForm");
const schedMsg = document.getElementById("schedMsg");
const modalTitle = document.getElementById("modalTitle");
const closeSchedModal = document.getElementById("closeSchedModal");
const cancelSchedBtn = document.getElementById("cancelSchedBtn");

const deleteModal = document.getElementById("deleteModal");
const deleteName = document.getElementById("deleteName");
const closeDeleteModal = document.getElementById("closeDeleteModal");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

const printModal = document.getElementById("printModal");
const closePrintModal = document.getElementById("closePrintModal");
const printSection = document.getElementById("printSection");
const printTerm = document.getElementById("printTerm");
const printBtn = document.getElementById("printBtn");
const printSheet = document.getElementById("printSheet");

// Bulk Schedule Elements
const bulkSchedBtn = document.getElementById("bulkSchedBtn");
const bulkModal = document.getElementById("bulkSchedModal");
const closeBulkModal = document.getElementById("closeBulkModal");
const cancelBulkBtn = document.getElementById("cancelBulkBtn");
const bulkForm = document.getElementById("bulkSchedForm");
const bulkSectionSelect = document.getElementById("bulkSectionSelect");
const bulkTermSelect = document.getElementById("bulkTermSelect");
const bulkDaySelect = document.getElementById("bulkDaySelect");
const bulkRoomSelect = document.getElementById("bulkRoomSelect");
const bulkStartTime = document.getElementById("bulkStartTime");
const bulkEndTime = document.getElementById("bulkEndTime");
const bulkSubjectCheckboxes = document.getElementById("bulkSubjectCheckboxes");
const saveBulkBtn = document.getElementById("saveBulkBtn");
const bulkFormError = document.getElementById("bulkFormError");
const bulkConflictWarning = document.getElementById("bulkConflictWarning");
const bulkConflictMsg = document.getElementById("bulkConflictMsg");

// State
let schedules = [];
let subjects = [];
let sections = [];
let rooms = [];
let teachers = [];
let editingId = null;
let deletingId = null;
let currentPage = 1;

// Bulk Schedule State
let bulkSubjects = [];
let currentSectionId = null;

// Calendar State
let currentWeekStart = getStartOfWeek(new Date());
let currentView = 'table';
let calendarSectionId = null;
let calendarTerm = '1st Semester';

// Helper Functions
function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[c]));
}

// Helper: Get start of week (Monday)
function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

// Helper: Format date
function formatDateShort(date) {
    return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

// Helper: Get week range string
function getWeekRange(startDate) {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    return `${formatDateShort(startDate)} - ${formatDateShort(endDate)}`;
}

// Helper: Get day name short
function getDayNameShort(date) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
}

// Helper: Create schedule block HTML
function createScheduleBlock(s) {
    const subjectTypeClass = (s.subject_type || 'core').toLowerCase();
    const teacherName = s.teacher_first_name ? getFullName(s.teacher_first_name, s.teacher_last_name) : "—";
    const startTime = formatTime(s.start_time);
    const endTime = formatTime(s.end_time);
    
    return `
        <div class="schedule-block ${subjectTypeClass}" 
             data-schedule-id="${s.schedule_id}"
             title="${s.subject_code} - ${s.subject_name}\n${teacherName}\n${s.room_name}\n${startTime} - ${endTime}">
            <span class="subject-code">${esc(s.subject_code)}</span>
            <span class="subject-name">${esc(s.subject_name)}</span>
            <span class="teacher-name">${esc(teacherName)}</span>
            <span class="room-name">${esc(s.room_name)}</span>
            <span class="time-label">${esc(startTime)} - ${esc(endTime)}</span>
        </div>
    `;
}

// Populate calendar section filter
function populateCalendarSectionFilter() {
    if (!calendarSectionFilter) return;
    
    let html = '<option value="">Select Section</option>';
    sections.forEach(s => {
        html += `<option value="${s.section_id}">${esc(s.section_name)} (Grade ${s.grade_level})</option>`;
    });
    calendarSectionFilter.innerHTML = html;
}

// Render Calendar View for specific section - Clean Version
function renderCalendar() {
    if (currentView !== 'calendar') return;
    
    // Get section info
    const section = sections.find(s => s.section_id == calendarSectionId);
    const sectionName = section?.section_name || 'Select a Section';
    const gradeLevel = section?.grade_level || '';
    
    // Check if section is selected
    if (!calendarSectionId) {
        calendarGrid.innerHTML = '';
        calendarEmpty.style.display = 'block';
        calendarEmpty.innerHTML = `
            <div class="empty-icon">📅</div>
            <div class="empty-title">No Section Selected</div>
            <div class="empty-desc">Please select a section from the dropdown above to view its schedule.</div>
        `;
        
        // Update section info with placeholder
        document.getElementById('sectionNameDisplay').textContent = 'No Section Selected';
        document.getElementById('sectionGradeDisplay').textContent = '';
        document.getElementById('subjectCountDisplay').innerHTML = '📚 0 subjects';
        document.getElementById('termDisplay').innerHTML = '📅 ' + calendarTerm;
        
        weekRange.textContent = '';
        return;
    }
    
    // Get schedules for this section and term
    const sectionSchedules = schedules.filter(s => 
        s.section_id == calendarSectionId && 
        s.semester === calendarTerm
    );
    
    // Update section info bar
    document.getElementById('sectionNameDisplay').textContent = sectionName;
    document.getElementById('sectionGradeDisplay').textContent = gradeLevel ? `Grade ${gradeLevel}` : '';
    document.getElementById('subjectCountDisplay').innerHTML = `📚 <span>${sectionSchedules.length}</span> subjects`;
    document.getElementById('termDisplay').innerHTML = `📅 ${calendarTerm}`;
    
    if (sectionSchedules.length === 0) {
        calendarGrid.innerHTML = '';
        calendarEmpty.style.display = 'block';
        calendarEmpty.innerHTML = `
            <div class="empty-icon">📋</div>
            <div class="empty-title">No Schedules Found</div>
            <div class="empty-desc">No schedules found for <strong>${esc(sectionName)}</strong> - ${esc(calendarTerm)}.</div>
            <button class="btn btn--primary btn--sm" onclick="document.getElementById('addSchedBtn').click()" style="margin-top:1rem;">
                + Add Schedule
            </button>
        `;
        weekRange.textContent = getWeekRange(currentWeekStart);
        return;
    }
    
    calendarEmpty.style.display = 'none';
    
    const weekStart = new Date(currentWeekStart);
    const days = [];
    const timeSlots = [];
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.toDateString();
    
    // Generate days of the week
    for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        days.push(d);
    }
    
    // Generate time slots (9:00 AM to 5:00 PM, 1-hour intervals)
    for (let hour = 9; hour < 17; hour++) {
        timeSlots.push(`${String(hour).padStart(2, '0')}:00`);
    }
    
    // Build the grid
    let html = '<table>';
    
    // Header row with day names and dates
    html += '<thead><tr><th style="min-width:70px;background:transparent;border-bottom:none;">Time</th>';
    days.forEach(day => {
        const isToday = currentDay === day.toDateString();
        const dayName = getDayNameShort(day);
        const dayDate = formatDateShort(day);
        html += `<th class="${isToday ? 'is-today' : ''}">${dayName}<span class="day-date">${dayDate}</span></th>`;
    });
    html += '</tr></thead><tbody>';
    
    // Each time slot row
    timeSlots.forEach((time) => {
        const slotHour = parseInt(time.split(':')[0]);
        const isCurrentTimeSlot = (slotHour === currentHour && currentDay === days[0].toDateString());
        
        html += `<tr>`;
        
        // Time label column with AM/PM
        const hour = slotHour % 12 || 12;
        const ampm = slotHour >= 12 ? 'PM' : 'AM';
        html += `<td class="time-slot">
            <span class="time-label">${hour}:00</span>
            <span class="time-ampm">${ampm}</span>
        </td>`;
        
        days.forEach((day) => {
            const dayName = day.toLocaleDateString('en-US', { weekday: 'long' });
            
            // Check if any schedule overlaps this slot for this section
            const overlapping = sectionSchedules.filter(s => {
                if (s.day_of_week !== dayName) return false;
                const sStart = new Date(`2000-01-01T${s.start_time}`);
                const sEnd = new Date(`2000-01-01T${s.end_time}`);
                const slotStart = new Date(`2000-01-01T${time}:00`);
                const slotEnd = new Date(slotStart);
                slotEnd.setHours(slotEnd.getHours() + 1);
                return (sStart < slotEnd && sEnd > slotStart);
            });
            
            const hasSchedule = overlapping.length > 0;
            const isCurrent = currentDay === day.toDateString() && isCurrentTimeSlot;
            
            let cellClass = 'time-cell';
            if (hasSchedule) cellClass += ' has-schedule';
            if (isCurrent) cellClass += ' is-current-time';
            
            html += `<td class="${cellClass}" data-day="${dayName}" data-time="${time}">`;
            
            if (overlapping.length > 0) {
                overlapping.sort((a, b) => a.start_time.localeCompare(b.start_time));
                
                // Show count badge if more than 3
                if (overlapping.length > 3) {
                    html += `<div class="schedule-count-badge">${overlapping.length} subjects</div>`;
                }
                
                // Show first 3 items
                const maxVisible = 3;
                const visibleItems = overlapping.slice(0, maxVisible);
                const hiddenItems = overlapping.slice(maxVisible);
                
                visibleItems.forEach(s => {
                    html += createScheduleBlock(s);
                });
                
                // Show more button if needed
                if (hiddenItems.length > 0) {
                    html += `
                        <div class="show-more-btn" data-day="${dayName}" data-time="${time}">
                            <span>+${hiddenItems.length} more...</span>
                        </div>
                        <div class="hidden-schedules" data-day="${dayName}" data-time="${time}" style="display:none;">
                            ${hiddenItems.map(s => createScheduleBlock(s)).join('')}
                        </div>
                    `;
                }
            } else {
                html += `<div class="empty-slot">—</div>`;
            }
            
            html += `</td>`;
        });
        
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    calendarGrid.innerHTML = html;
    weekRange.textContent = getWeekRange(weekStart);
    
    // Attach event handlers
    attachCalendarEvents();
}

// Enhanced createScheduleBlock function
function createScheduleBlock(s) {
    const subjectTypeClass = (s.subject_type || 'core').toLowerCase();
    const teacherName = s.teacher_first_name ? getFullName(s.teacher_first_name, s.teacher_last_name) : "—";
    const startTime = formatTime(s.start_time);
    const endTime = formatTime(s.end_time);
    
    // Get subject type badge
    const typeBadge = s.subject_type ? s.subject_type.charAt(0) : '';
    const typeColors = {
        'Core': '#4a90d9',
        'Applied': '#28a745',
        'Specialized': '#e53e3e'
    };
    const dotColor = typeColors[s.subject_type] || 'var(--primary)';
    
    return `
        <div class="schedule-block ${subjectTypeClass}" 
             data-schedule-id="${s.schedule_id}"
             title="${s.subject_code} - ${s.subject_name}\n👨‍🏫 ${teacherName}\n🏫 ${s.room_name}\n⏰ ${startTime} - ${endTime}">
            <span class="subject-code">${esc(s.subject_code)}</span>
            <span class="subject-name">${esc(s.subject_name)}</span>
            <span class="teacher-name">👨‍🏫 ${esc(teacherName)}</span>
            <span class="room-name">🏫 ${esc(s.room_name)}</span>
            <span class="time-label">⏰ ${esc(startTime)} - ${esc(endTime)}</span>
        </div>
    `;
}

// Attach calendar event handlers
function attachCalendarEvents() {
    // Click events to schedule blocks for editing
    calendarGrid.querySelectorAll('.schedule-block:not(.show-more-btn)').forEach(block => {
        block.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = block.dataset.scheduleId;
            const s = schedules.find(x => String(x.schedule_id) === id);
            if (s) {
                openSchedModal(s);
            }
        });
        
        // Hover effect for tooltip
        block.addEventListener('mouseenter', (e) => {
            block.style.transform = 'translateX(2px) scale(1.02)';
        });
        
        block.addEventListener('mouseleave', (e) => {
            block.style.transform = 'translateX(0) scale(1)';
        });
    });
    
    // Click events to "Show More" buttons
    calendarGrid.querySelectorAll('.show-more-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const day = btn.dataset.day;
            const time = btn.dataset.time;
            const hiddenContainer = calendarGrid.querySelector(`.hidden-schedules[data-day="${day}"][data-time="${time}"]`);
            if (hiddenContainer) {
                if (hiddenContainer.style.display === 'none') {
                    hiddenContainer.style.display = 'block';
                    btn.style.display = 'none';
                } else {
                    hiddenContainer.style.display = 'none';
                    btn.style.display = 'block';
                }
            }
        });
    });
    
    // Click events to empty cells for adding
    calendarGrid.querySelectorAll('.time-cell .empty-slot').forEach(cell => {
        const td = cell.closest('.time-cell');
        if (td) {
            td.addEventListener('click', (e) => {
                // Don't trigger if clicking on a schedule block
                if (e.target.closest('.schedule-block')) return;
                
                const day = td.dataset.day;
                const time = td.dataset.time;
                // Pre-fill the add schedule form
                document.getElementById("daySelect").value = day;
                document.getElementById("startTime").value = time;
                const endHour = parseInt(time.split(':')[0]) + 1;
                document.getElementById("endTime").value = `${String(endHour).padStart(2, '0')}:00`;
                // Auto-select the section if not already
                if (calendarSectionId) {
                    document.getElementById("sectionSelect").value = calendarSectionId;
                    populateSubjects(null);
                }
                openSchedModal();
            });
        }
    });
}

// Navigation functions
function goToPrevWeek() {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    currentWeekStart = newDate;
    renderCalendar();
}

function goToNextWeek() {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    currentWeekStart = newDate;
    renderCalendar();
}

function goToToday() {
    currentWeekStart = getStartOfWeek(new Date());
    renderCalendar();
}

// View toggle
if (tableViewBtn && calendarViewBtn) {
    tableViewBtn.addEventListener('click', () => {
        currentView = 'table';
        tableView.style.display = 'block';
        calendarView.style.display = 'none';
        tableViewBtn.classList.add('is-active');
        calendarViewBtn.classList.remove('is-active');
    });
    
    calendarViewBtn.addEventListener('click', () => {
        currentView = 'calendar';
        tableView.style.display = 'none';
        calendarView.style.display = 'block';
        calendarViewBtn.classList.add('is-active');
        tableViewBtn.classList.remove('is-active');
        
        // Populate section filter if empty
        if (calendarSectionFilter && calendarSectionFilter.options.length <= 1) {
            populateCalendarSectionFilter();
        }
        
        // Auto-select first section if available and none selected
        if (!calendarSectionId && sections.length > 0) {
            calendarSectionFilter.value = sections[0].section_id;
            calendarSectionId = sections[0].section_id;
        }
        
        renderCalendar();
    });
}

// Calendar filter events
if (calendarSectionFilter) {
    calendarSectionFilter.addEventListener('change', () => {
        calendarSectionId = calendarSectionFilter.value;
        renderCalendar();
    });
}

if (calendarTermFilter) {
    calendarTermFilter.addEventListener('change', () => {
        calendarTerm = calendarTermFilter.value;
        renderCalendar();
    });
}

// Calendar navigation
if (prevWeekBtn) prevWeekBtn.addEventListener('click', goToPrevWeek);
if (nextWeekBtn) nextWeekBtn.addEventListener('click', goToNextWeek);
if (todayBtn) todayBtn.addEventListener('click', goToToday);

// Open Bulk Schedule Modal
function openBulkModal() {
    // Reset form
    bulkForm.reset();
    bulkFormError.style.display = "none";
    bulkConflictWarning.hidden = true;
    
    // Populate sections
    let html = '<option value="" disabled selected>Select section</option>';
    sections.forEach(s => {
        html += `<option value="${s.section_id}">${esc(s.section_name)} (Grade ${s.grade_level})</option>`;
    });
    bulkSectionSelect.innerHTML = html;

    // Populate rooms
    let roomHtml = '<option value="" disabled selected>Select room</option>';
    rooms.forEach(r => {
        roomHtml += `<option value="${r.room_id}">${esc(r.room_name)} (${esc(r.building)}) - Capacity: ${r.capacity}</option>`;
    });
    bulkRoomSelect.innerHTML = roomHtml;

    // Set default times
    bulkStartTime.value = "09:00";
    bulkEndTime.value = "10:00";

    // Reset subject checkboxes
    bulkSubjectCheckboxes.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;">Select a section and term first to load subjects</p>';

    bulkModal.hidden = false;
}

// Load subjects for bulk scheduling
async function loadBulkSubjects() {
    const sectionId = bulkSectionSelect.value;
    const term = bulkTermSelect.value;

    if (!sectionId || !term) {
        bulkSubjectCheckboxes.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;">Select a section and term first to load subjects</p>';
        bulkSubjects = [];
        return;
    }

    currentSectionId = sectionId;

    bulkSubjectCheckboxes.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;">Loading subjects...</p>';

    try {
        const data = await apiGet({ 
            action: "lookup", 
            section_id: sectionId, 
            term: term 
        });
        
        const subjects = data.subjects || [];
        bulkSubjects = subjects;

        if (!subjects.length) {
            bulkSubjectCheckboxes.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;">No subjects found for this section and term.</p>';
            return;
        }

        // Get existing schedules for this section to pre-check conflicts
        let existingSchedules = [];
        try {
            const existing = await apiGet({ 
                action: "section_schedule", 
                section_id: sectionId,
                term: term
            });
            existingSchedules = Array.isArray(existing) ? existing : [];
        } catch (e) {
            console.error("Error fetching existing schedules:", e);
        }

        let html = '';
        subjects.forEach(sub => {
            // Check if this subject already has a schedule for the selected day
            const day = bulkDaySelect.value;
            const hasExisting = existingSchedules.some(s => 
                s.subject_id == sub.subject_id && 
                s.day_of_week === day
            );
            
            const disabled = hasExisting ? 'disabled' : '';
            const checked = hasExisting ? '' : 'checked';
            const label = hasExisting ? ' (Already scheduled)' : '';
            
            html += `
                <label style="display:flex;align-items:center;gap:0.5rem;padding:0.25rem;border-radius:4px;cursor:pointer;${hasExisting ? 'opacity:0.5;' : ''}">
                    <input type="checkbox" name="bulkSubjects[]" value="${sub.subject_id}" ${checked} ${disabled} />
                    <span>${esc(sub.subject_code)} - ${esc(sub.subject_name)}</span>
                    ${hasExisting ? `<span style="color:#c00;font-size:0.7rem;">(Already scheduled)</span>` : ''}
                </label>
            `;
        });
        bulkSubjectCheckboxes.innerHTML = html;

        // Check for conflicts after subjects load
        await checkBulkConflicts();

    } catch (e) {
        console.error("Failed to load bulk subjects:", e);
        bulkSubjectCheckboxes.innerHTML = '<p style="color:#c00;grid-column:1/-1;">Failed to load subjects. Please try again.</p>';
    }
}

// Check conflicts for bulk scheduling
async function checkBulkConflicts() {
    const sectionId = bulkSectionSelect.value;
    const roomId = bulkRoomSelect.value;
    const dayOfWeek = bulkDaySelect.value;
    const startTime = bulkStartTime.value;
    const endTime = bulkEndTime.value;

    bulkConflictWarning.hidden = true;

    if (!sectionId || !roomId || !dayOfWeek || !startTime || !endTime) {
        return;
    }

    // Validate time
    if (startTime >= endTime) {
        bulkConflictWarning.hidden = false;
        bulkConflictMsg.textContent = "End time must be after start time.";
        return false;
    }

    // Check if any subjects are selected
    const selectedSubjects = bulkForm.querySelectorAll('input[name="bulkSubjects[]"]:checked');
    if (selectedSubjects.length === 0) {
        return true;
    }

    // Calculate total time needed
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    const durationMinutes = (end - start) / (1000 * 60);
    const totalMinutesNeeded = durationMinutes * selectedSubjects.length;

    // Check if there's enough time in the day
    const schoolEnd = new Date(`2000-01-01T17:00:00`);
    const lastPossibleEnd = new Date(start.getTime() + totalMinutesNeeded * 60000);
    
    if (lastPossibleEnd > schoolEnd) {
        const hoursNeeded = Math.floor(totalMinutesNeeded / 60);
        const minsNeeded = totalMinutesNeeded % 60;
        bulkConflictWarning.hidden = false;
        bulkConflictMsg.textContent = `Not enough time in the day. You need ${hoursNeeded}h ${minsNeeded}m for ${selectedSubjects.length} subjects. School ends at 5:00 PM.`;
        return false;
    }

    // Check section conflicts
    const params = {
        action: "check_conflicts",
        section_id: sectionId,
        room_id: roomId,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime
    };

    try {
        const conflicts = await apiGet(params);
        let conflictMessages = [];

        if (conflicts.section) {
            conflictMessages.push("This section already has a class at this time.");
        }
        if (conflicts.room) {
            conflictMessages.push("This room is already occupied at this time.");
        }

        if (conflictMessages.length > 0) {
            bulkConflictWarning.hidden = false;
            bulkConflictMsg.textContent = conflictMessages.join(" ");
            return false;
        } else {
            bulkConflictWarning.hidden = true;
            return true;
        }
    } catch (e) {
        console.error("Error checking bulk conflicts:", e);
        return true;
    }
}

// Save bulk schedules
async function saveBulkSchedules() {
    const sectionId = bulkSectionSelect.value;
    const roomId = bulkRoomSelect.value;
    const dayOfWeek = bulkDaySelect.value;
    const startTime = bulkStartTime.value;
    const endTime = bulkEndTime.value;
    const term = bulkTermSelect.value;

    const selectedSubjects = bulkForm.querySelectorAll('input[name="bulkSubjects[]"]:checked');
    
    // Validate
    if (!sectionId) {
        showBulkError("Please select a section.");
        return;
    }
    if (!term) {
        showBulkError("Please select a term.");
        return;
    }
    if (!roomId) {
        showBulkError("Please select a room.");
        return;
    }
    if (!dayOfWeek) {
        showBulkError("Please select a day.");
        return;
    }
    if (!startTime || !endTime) {
        showBulkError("Please set both start and end times.");
        return;
    }
    if (startTime >= endTime) {
        showBulkError("End time must be after start time.");
        return;
    }
    if (selectedSubjects.length === 0) {
        showBulkError("Please select at least one subject.");
        return;
    }

    // Check if any selected subjects are disabled (already scheduled)
    let hasDisabled = false;
    selectedSubjects.forEach(sub => {
        if (sub.disabled) {
            hasDisabled = true;
        }
    });
    if (hasDisabled) {
        showBulkError("Some selected subjects are already scheduled on this day. Please deselect them.");
        return;
    }

    // Check school hours
    if (startTime < "09:00") {
        showBulkError("School hours start at 9:00 AM.");
        return;
    }
    if (endTime > "17:00") {
        showBulkError("School hours end at 5:00 PM.");
        return;
    }

    // Calculate if all subjects fit
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    const durationMinutes = (end - start) / (1000 * 60);
    const totalMinutesNeeded = durationMinutes * selectedSubjects.length;
    const lastPossibleEnd = new Date(start.getTime() + totalMinutesNeeded * 60000);
    const schoolEnd = new Date(`2000-01-01T17:00:00`);

    if (lastPossibleEnd > schoolEnd) {
        const hoursNeeded = Math.floor(totalMinutesNeeded / 60);
        const minsNeeded = totalMinutesNeeded % 60;
        showBulkError(`Not enough time in the day. You need ${hoursNeeded}h ${minsNeeded}m for ${selectedSubjects.length} subjects. School ends at 5:00 PM.`);
        return;
    }

    // Check conflicts first
    const conflictCheck = await checkBulkConflicts();
    if (!conflictCheck) {
        showBulkError("Please resolve conflicts before saving.");
        return;
    }

    // Confirm with user
    const subjectNames = Array.from(selectedSubjects).map(sub => {
        const label = sub.closest('label');
        return label ? label.textContent.trim() : sub.value;
    });

    if (!confirm(`Create ${selectedSubjects.length} schedules for ${dayOfWeek} at ${formatTime(startTime)} - ${formatTime(endTime)} each?\n\nSubjects: ${subjectNames.join(', ')}`)) {
        return;
    }

    saveBulkBtn.disabled = true;
    saveBulkBtn.textContent = "Creating...";

    let successCount = 0;
    let failCount = 0;
    let errors = [];
    let currentTime = startTime;

    try {
        // Create each schedule sequentially with time adjustments
        for (let i = 0; i < selectedSubjects.length; i++) {
            const subjectId = selectedSubjects[i].value;
            
            // Calculate time slot for this subject
            const slotStart = currentTime;
            const slotEnd = calculateEndTime(currentTime, durationMinutes);
            
            const payload = {
                action: "create",
                section_id: sectionId,
                subject_id: subjectId,
                teacher_id: "1",
                room_id: roomId,
                day_of_week: dayOfWeek,
                start_time: slotStart,
                end_time: slotEnd
            };

            const response = await apiPost(payload);
            
            if (response.success) {
                successCount++;
            } else {
                failCount++;
                errors.push(response.message || `Failed to create schedule for subject ${subjectId}`);
            }
            
            // Move to next time slot
            currentTime = slotEnd;
        }

        // Show result
        if (successCount > 0 && failCount === 0) {
            hideBulkModals();
            await loadSchedules();
            showToast(`Successfully created ${successCount} schedules!`, "success");
        } else if (successCount > 0 && failCount > 0) {
            hideBulkModals();
            await loadSchedules();
            showToast(`Created ${successCount} schedules, ${failCount} failed.`, "warning");
            console.error("Bulk schedule errors:", errors);
        } else {
            showBulkError(`Failed to create schedules: ${errors.join(', ')}`);
        }
    } catch (e) {
        showBulkError("Network error: " + e.message);
    } finally {
        saveBulkBtn.disabled = false;
        saveBulkBtn.textContent = "Create Schedules";
    }
}

// Calculate end time based on start time and duration in minutes
function calculateEndTime(startTime, durationMinutes) {
    const dt = new Date(`2000-01-01T${startTime}:00`);
    dt.setMinutes(dt.getMinutes() + durationMinutes);
    const hours = String(dt.getHours()).padStart(2, '0');
    const minutes = String(dt.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

function showBulkError(message) {
    bulkFormError.textContent = message;
    bulkFormError.style.display = "block";
    setTimeout(() => {
        bulkFormError.style.display = "none";
    }, 5000);
}

function hideBulkModals() {
    bulkModal.hidden = true;
}

// Bulk Modal Event Listeners
if (bulkSchedBtn) {
    bulkSchedBtn.addEventListener("click", openBulkModal);
}

if (closeBulkModal) {
    closeBulkModal.addEventListener("click", hideBulkModals);
}

if (cancelBulkBtn) {
    cancelBulkBtn.addEventListener("click", hideBulkModals);
}

// Close bulk modal on overlay click
if (bulkModal) {
    bulkModal.addEventListener("click", (e) => {
        if (e.target === bulkModal) hideBulkModals();
    });
}

// Bulk section change
if (bulkSectionSelect) {
    bulkSectionSelect.addEventListener("change", loadBulkSubjects);
}

// Bulk term change
if (bulkTermSelect) {
    bulkTermSelect.addEventListener("change", loadBulkSubjects);
}

// Bulk day change - reload subjects to check existing schedules
if (bulkDaySelect) {
    bulkDaySelect.addEventListener("change", loadBulkSubjects);
}

// Bulk room change - check conflicts
if (bulkRoomSelect) {
    bulkRoomSelect.addEventListener("change", checkBulkConflicts);
}

// Bulk time changes - check conflicts
[bulkStartTime, bulkEndTime].forEach(el => {
    if (el) {
        el.addEventListener("change", checkBulkConflicts);
        el.addEventListener("input", checkBulkConflicts);
    }
});

// Submit bulk form
if (bulkForm) {
    bulkForm.addEventListener("submit", (e) => {
        e.preventDefault();
        saveBulkSchedules();
    });
}

// Show Toast function
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

function debounce(fn, delay) {
    let timer = null;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

function setMsg(text, type) {
    schedMsg.textContent = text;
    schedMsg.classList.remove("is-error", "is-success");
    if (type) schedMsg.classList.add(type);
}

function showLoading(show) {
    const loadingModal = document.getElementById("loadingModal");
    if (loadingModal) {
        loadingModal.hidden = !show;
    }
}

function getFullName(first, last) {
    if (!first && !last) return "—";
    return `${last || ''}${last && first ? ', ' : ''}${first || ''}`.trim() || "—";
}

function formatTime(time) {
    if (!time) return "—";
    const [h, m] = time.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

// ---------- API Helpers ----------
async function apiGet(params) {
    const cleanParams = {};
    for (const [key, value] of Object.entries(params)) {
        if (value !== null && value !== undefined && value !== '' && value !== 'null') {
            cleanParams[key] = value;
        }
    }
    
    const url = `${SCHEDULE_URL}?${new URLSearchParams(cleanParams).toString()}`;
    console.log("Fetching:", url);
    
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        console.log("Response data:", data);
        return data;
    } catch (e) {
        console.error("API Error:", e);
        throw e;
    }
}

async function apiPost(params) {
    const res = await fetch(SCHEDULE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(params).toString()
    });
    const text = await res.text();
    console.log("Response:", text);
    try {
        return JSON.parse(text);
    } catch {
        if (text.includes("SUCCESS") || text.includes("success")) {
            return { success: true, message: text };
        }
        return { success: false, message: text || "Unknown error" };
    }
}

// ---------- Load Data ----------
async function loadLookupData() {
    showLoading(true);
    try {
        const data = await apiGet({ action: "lookup" });
        sections = data.sections || [];
        rooms = data.rooms || [];
        teachers = data.teachers || [];
        populateDropdowns();
        return data;
    } catch (e) {
        console.error("Failed to load lookup data:", e);
        throw e;
    } finally {
        showLoading(false);
    }
}

function populateDropdowns() {
    // Populate section filter
    if (sectionFilter) {
        let html = '<option value="">All Sections</option>';
        sections.forEach(s => {
            html += `<option value="${s.section_id}">${esc(s.section_name)} (Grade ${s.grade_level})</option>`;
        });
        sectionFilter.innerHTML = html;
    }

    // Populate section dropdown in modal
    const sectionSelect = document.getElementById("sectionSelect");
    if (sectionSelect) {
        let html = '<option value="" disabled selected>Select section</option>';
        sections.forEach(s => {
            html += `<option value="${s.section_id}">${esc(s.section_name)} (Grade ${s.grade_level})</option>`;
        });
        sectionSelect.innerHTML = html;
    }

    // Populate room dropdown in modal
    const roomSelect = document.getElementById("roomSelect");
    if (roomSelect) {
        let html = '<option value="" disabled selected>Select room</option>';
        rooms.forEach(r => {
            html += `<option value="${r.room_id}">${esc(r.room_name)} (${esc(r.building)}) - Capacity: ${r.capacity}</option>`;
        });
        roomSelect.innerHTML = html;
    }

    // Populate teacher dropdown in modal
    const teacherSelect = document.getElementById("teacherSelect");
    if (teacherSelect) {
        let html = '<option value="" disabled selected>Select teacher</option>';
        teachers.forEach(t => {
            html += `<option value="${t.teacher_id}">${esc(getFullName(t.first_name, t.last_name))}</option>`;
        });
        teacherSelect.innerHTML = html;
    }
}

async function populateSubjects(selectedSubjectId) {
    const sectionId = document.getElementById("sectionSelect")?.value;
    const term = document.getElementById("termSelect")?.value;
    const select = document.getElementById("subjectSelect");
    if (!select) return;

    if (!sectionId) {
        select.innerHTML = '<option value="" disabled selected>Select section first</option>';
        subjects = [];
        return;
    }

    select.innerHTML = '<option value="" disabled selected>Loading subjects…</option>';

    try {
        const data = await apiGet({ action: "lookup", section_id: sectionId, term: term || null });
        subjects = data.subjects || [];
    } catch (e) {
        console.error("Failed to load subjects:", e);
        subjects = [];
    }

    if (!subjects.length) {
        select.innerHTML = '<option value="" disabled selected>No subjects found for this section</option>';
        return;
    }

    let html = '<option value="" disabled selected>Select subject</option>';
    subjects.forEach(sub => {
        html += `<option value="${sub.subject_id}">${esc(sub.subject_code)} - ${esc(sub.subject_name)} (${esc(sub.subject_type)})</option>`;
    });
    select.innerHTML = html;

    if (selectedSubjectId) {
        select.value = selectedSubjectId;
    }
}

// ---------- Load Schedules ----------
async function loadSchedules() {
    const filters = {};
    
    if (searchInput && searchInput.value.trim()) {
        filters.keyword = searchInput.value.trim();
    }
    if (termFilter && termFilter.value) {
        filters.term = termFilter.value;
    }
    if (sectionFilter && sectionFilter.value) {
        filters.section_id = sectionFilter.value;
    }
    
    filters.action = "list";

    console.log("=== LOAD SCHEDULES FILTERS ===");
    console.log("filters:", filters);

    showLoading(true);
    try {
        const response = await apiGet(filters);
        console.log("Raw response from API:", response);
        
        schedules = Array.isArray(response) ? response : [];
        console.log("Schedules loaded:", schedules.length);
        
        if (schedules.length > 0) {
            console.log("First schedule:", schedules[0]);
        } else {
            console.log("No schedules returned. Response content:", response);
            
            if (response && response.error) {
                console.error("API Error:", response.error);
            }
        }
        render();
    } catch (e) {
        console.error("Failed to load schedules:", e);
        schedules = [];
        render();
    } finally {
        showLoading(false);
    }
}

// ---------- Render ----------
function pageList(current, pages) {
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
    const wanted = [...new Set([1, 2, current - 1, current, current + 1, pages - 1, pages])]
        .filter((p) => p >= 1 && p <= pages)
        .sort((a, b) => a - b);
    const out = [];
    let prev = 0;
    for (const p of wanted) {
        if (p - prev > 1) out.push("…");
        out.push(p);
        prev = p;
    }
    return out;
}

function renderPagination(total, pages, start, shown) {
    if (total <= PAGE_SIZE) {
        pagination.hidden = true;
        return;
    }
    pagination.hidden = false;
    pageInfo.textContent = `Showing ${start + 1}–${start + shown} of ${total}`;
    const parts = [
        `<button class="page-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""} aria-label="Previous page">&lsaquo;</button>`
    ];
    for (const p of pageList(currentPage, pages)) {
        parts.push(p === "…"
            ? '<span class="page-ellipsis">…</span>'
            : `<button class="page-btn${p === currentPage ? " is-current" : ""}" data-page="${p}">${p}</button>`);
    }
    parts.push(
        `<button class="page-btn" data-page="${currentPage + 1}" ${currentPage === pages ? "disabled" : ""} aria-label="Next page">&rsaquo;</button>`
    );
    pageControls.innerHTML = parts.join("");
}

function render() {
    const total = schedules.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (currentPage > pages) currentPage = pages;
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = schedules.slice(start, start + PAGE_SIZE);

    if (pageItems.length === 0) {
        schedRows.innerHTML = "";
        emptyState.hidden = false;
        const hasFilters = (searchInput && searchInput.value.trim()) || 
                          (termFilter && termFilter.value) || 
                          (sectionFilter && sectionFilter.value);
        emptyState.textContent = hasFilters
            ? "No schedules match your filters."
            : 'No schedules yet. Click "Add Schedule" to get started.';
        pagination.hidden = true;
        // Update calendar even if empty
        if (currentView === 'calendar') renderCalendar();
        return;
    }

    emptyState.hidden = true;

    schedRows.innerHTML = pageItems.map((s) => {
        const teacherName = s.teacher_first_name ? getFullName(s.teacher_first_name, s.teacher_last_name) : "—";
        const dayShort = DAYS[s.day_of_week] || s.day_of_week;
        const startTime = formatTime(s.start_time);
        const endTime = formatTime(s.end_time);

        return `<tr>
            <td><span class="cell-name">${esc(s.section_name)}</span></td>
            <td>
                <span class="chip">${esc(s.subject_code)}</span>
                <span class="cell-sub">${esc(s.subject_name)}</span>
            </td>
            <td>${esc(teacherName)}</td>
            <td><span class="chip">${esc(dayShort)}</span></td>
            <td>${esc(startTime)} – ${esc(endTime)}</td>
            <td>${esc(s.room_name)}</td>
            <td>
                <div class="row-actions">
                    <button class="btn btn--ghost btn--sm" data-action="edit" data-id="${s.schedule_id}">Edit</button>
                    <button class="btn btn--danger btn--sm" data-action="delete" data-id="${s.schedule_id}">Delete</button>
                </div>
            </td>
        </tr>`;
    }).join("");

    renderPagination(total, pages, start, pageItems.length);
    // Update calendar if in calendar view
    if (currentView === 'calendar') renderCalendar();
}

// ---------- Check Conflicts ----------
async function checkConflicts() {
    const sectionId = document.getElementById("sectionSelect")?.value;
    const teacherId = document.getElementById("teacherSelect")?.value;
    const subjectId = document.getElementById("subjectSelect")?.value;
    const dayOfWeek = document.getElementById("daySelect")?.value;
    const startTime = document.getElementById("startTime")?.value;
    const endTime = document.getElementById("endTime")?.value;
    const roomId = document.getElementById("roomSelect")?.value;

    const conflictWarning = document.getElementById("conflictWarning");
    const conflictMsg = document.getElementById("conflictMsg");

    if (!sectionId || !subjectId || !teacherId || !dayOfWeek || !startTime || !endTime || !roomId) {
        conflictWarning.hidden = true;
        return;
    }

    const params = {
        action: "check_conflicts",
        section_id: sectionId,
        teacher_id: teacherId,
        room_id: roomId,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        subject_id: subjectId
    };

    if (editingId) {
        params.exclude_id = editingId;
    }

    try {
        const conflicts = await apiGet(params);
        let conflictMessages = [];

        // Check for duplicate subject on the same day
        if (conflicts.duplicate_subject) {
            conflictMessages.push("This section already has this subject scheduled on " + dayOfWeek + ". A section cannot have the same subject twice on the same day.");
        }

        if (conflicts.section) {
            conflictMessages.push("This section already has a class at this time.");
        }
        if (conflicts.teacher) {
            conflictMessages.push("This teacher is already assigned to another class at this time.");
        }
        if (conflicts.room) {
            conflictMessages.push("This room is already occupied at this time.");
        }

        if (conflictMessages.length > 0) {
            conflictWarning.hidden = false;
            conflictMsg.textContent = conflictMessages.join(" ");
            return false;
        } else {
            conflictWarning.hidden = true;
            return true;
        }
    } catch (e) {
        console.error("Error checking conflicts:", e);
        return true;
    }
}

// ---------- Modal Functions ----------
async function openSchedModal(s) {
    await loadLookupData();
    
    editingId = s ? s.schedule_id : null;
    modalTitle.textContent = s ? "Edit Schedule" : "Add Schedule";
    schedForm.reset();
    setMsg("");
    document.getElementById("conflictWarning").hidden = true;

    // Set term
    const termSelect = document.getElementById("termSelect");
    if (s) {
        termSelect.value = s.semester || "";
    } else {
        termSelect.selectedIndex = 0;
    }

    // Set section and populate subjects for that section/term
    const sectionSelect = document.getElementById("sectionSelect");
    if (s) {
        sectionSelect.value = s.section_id;
    } else {
        sectionSelect.selectedIndex = 0;
    }
    await populateSubjects(s ? s.subject_id : null);

    // Set teacher
    const teacherSelect = document.getElementById("teacherSelect");
    if (teacherSelect) {
        teacherSelect.value = s ? (s.teacher_id || "") : "";
    }

    // Set other fields
    if (s) {
        document.getElementById("daySelect").value = s.day_of_week || "";
        document.getElementById("roomSelect").value = s.room_id || "";
        document.getElementById("startTime").value = s.start_time || "";
        document.getElementById("endTime").value = s.end_time || "";
    } else {
        document.getElementById("startTime").value = "09:00";
        document.getElementById("endTime").value = "10:00";
    }

    schedModal.hidden = false;
}

function hideModals() {
    schedModal.hidden = true;
    deleteModal.hidden = true;
    printModal.hidden = true;
    bulkModal.hidden = true;
    document.body.classList.remove("print-sheet");
}

// ---------- Print Functions ----------
function buildSheet() {
    const sectionId = printSection.value;
    const term = printTerm.value;
    
    if (!sectionId) {
        return '<p class="empty">No section selected.</p>';
    }

    const section = sections.find(s => s.section_id == sectionId);
    const sectionSchedules = schedules.filter(s => s.section_id == sectionId && s.semester === term);

    if (!sectionSchedules.length) {
        return `<p class="empty">No schedules found for ${section ? esc(section.section_name) : 'this section'} - ${esc(term)}.</p>`;
    }

    // Group by day
    const grouped = {};
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    days.forEach(d => { grouped[d] = []; });
    sectionSchedules.forEach(s => {
        if (grouped[s.day_of_week]) {
            grouped[s.day_of_week].push(s);
        }
    });

    let tableRows = '';
    days.forEach(day => {
        const items = grouped[day] || [];
        if (items.length) {
            items.sort((a, b) => a.start_time.localeCompare(b.start_time));
            items.forEach(s => {
                const teacherName = s.teacher_first_name ? getFullName(s.teacher_first_name, s.teacher_last_name) : "—";
                tableRows += `<tr>
                    <td>${esc(DAYS[day] || day)}</td>
                    <td>${esc(s.subject_code)}</td>
                    <td>${esc(s.subject_name)}</td>
                    <td>${esc(teacherName)}</td>
                    <td>${esc(formatTime(s.start_time))} – ${esc(formatTime(s.end_time))}</td>
                    <td>${esc(s.room_name)}</td>
                </tr>`;
            });
        }
    });

    if (!tableRows) {
        return `<p class="empty">No schedules found for ${section ? esc(section.section_name) : 'this section'} - ${esc(term)}.</p>`;
    }

    return `
        <div class="sheet-header">
            <h3>Class Program</h3>
            <p><strong>Section:</strong> ${esc(section?.section_name || '')} | <strong>Grade:</strong> ${esc(section?.grade_level || '')} | <strong>Term:</strong> ${esc(term)}</p>
        </div>
        <table class="sheet-table">
            <thead>
                <tr>
                    <th>Day</th>
                    <th>Subject Code</th>
                    <th>Subject Title</th>
                    <th>Teacher</th>
                    <th>Time</th>
                    <th>Room</th>
                </tr>
            </thead>
            <tbody>${tableRows}</tbody>
        </table>
    `;
}

function refreshSheet() {
    printSheet.innerHTML = buildSheet();
}

function openPrintModal() {
    // Populate section dropdown
    let html = '<option value="">Select section</option>';
    sections.forEach(s => {
        html += `<option value="${s.section_id}">${esc(s.section_name)} (Grade ${s.grade_level})</option>`;
    });
    printSection.innerHTML = html;

    // Set default term
    if (termFilter && termFilter.value) {
        printTerm.value = termFilter.value;
    }

    // Set default section
    if (sectionFilter && sectionFilter.value) {
        printSection.value = sectionFilter.value;
    }

    refreshSheet();
    printModal.hidden = false;
}

// ---------- Event Listeners ----------
// Search
if (searchInput) {
    searchInput.addEventListener("input", debounce(() => {
        currentPage = 1;
        loadSchedules();
    }, 300));
}

// Filters
[termFilter, sectionFilter].forEach(filter => {
    if (filter) {
        filter.addEventListener("change", () => {
            currentPage = 1;
            loadSchedules();
        });
    }
});

// Add Schedule Button
if (addSchedBtn) {
    addSchedBtn.addEventListener("click", () => openSchedModal());
}

// Print Preview Button
if (printPreviewBtn) {
    printPreviewBtn.addEventListener("click", openPrintModal);
}

// Modal Close Buttons
if (closeSchedModal) closeSchedModal.addEventListener("click", hideModals);
if (cancelSchedBtn) cancelSchedBtn.addEventListener("click", hideModals);
if (closeDeleteModal) closeDeleteModal.addEventListener("click", hideModals);
if (cancelDeleteBtn) cancelDeleteBtn.addEventListener("click", hideModals);
if (closePrintModal) closePrintModal.addEventListener("click", hideModals);

// Section/Subject selection in modal
const sectionSelect = document.getElementById("sectionSelect");
if (sectionSelect) {
    sectionSelect.addEventListener("change", () => {
        populateSubjects(null);
        document.getElementById("conflictWarning").hidden = true;
    });
}

const termSelect = document.getElementById("termSelect");
if (termSelect) {
    termSelect.addEventListener("change", () => {
        populateSubjects(null);
        document.getElementById("conflictWarning").hidden = true;
    });
}

// Check conflicts on change
['daySelect', 'roomSelect', 'startTime', 'endTime', 'subjectSelect', 'teacherSelect'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener("change", () => {
            checkConflicts();
        });
        if (id === 'startTime' || id === 'endTime') {
            el.addEventListener("input", () => {
                checkConflicts();
            });
        }
    }
});

// Pagination
if (pageControls) {
    pageControls.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-page]");
        if (!btn || btn.disabled) return;
        currentPage = Number(btn.dataset.page);
        render();
    });
}

// Click outside modal to close
[schedModal, deleteModal, printModal, bulkModal].forEach((overlay) => {
    if (overlay) {
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) hideModals();
        });
    }
});

// Escape key to close
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideModals();
});

// Print functionality
if (printBtn) {
    printBtn.addEventListener("click", () => {
        document.body.classList.add("print-sheet");
        window.print();
    });
}

window.addEventListener("afterprint", () => {
    document.body.classList.remove("print-sheet");
});

[printSection, printTerm].forEach(el => {
    if (el) {
        el.addEventListener("change", refreshSheet);
    }
});

// ---------- Form Submit ----------
if (schedForm) {
    schedForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(schedForm);
        const data = {
            section_id: formData.get("sectionId"),
            subject_id: formData.get("subjectId"),
            teacher_id: formData.get("teacherId"),
            room_id: formData.get("roomId"),
            day_of_week: formData.get("dayOfWeek"),
            start_time: formData.get("startTime"),
            end_time: formData.get("endTime"),
        };

        console.log("Submitting data:", data);

        // Validate
        if (!data.section_id) {
            return setMsg("Please select a section.", "is-error");
        }
        if (!data.subject_id) {
            return setMsg("Please select a subject.", "is-error");
        }
        if (!data.teacher_id) {
            return setMsg("Please select a teacher.", "is-error");
        }
        if (!data.room_id) {
            return setMsg("Please select a room.", "is-error");
        }
        if (!data.day_of_week) {
            return setMsg("Please select a day.", "is-error");
        }
        if (!data.start_time || !data.end_time) {
            return setMsg("Please set both start and end times.", "is-error");
        }
        if (data.start_time >= data.end_time) {
            return setMsg("End time must be after start time.", "is-error");
        }

        // Validate school hours (9:00 AM - 5:00 PM)
        const schoolStart = "09:00";
        const schoolEnd = "17:00";
        if (data.start_time < schoolStart) {
            return setMsg("School hours start at 9:00 AM. Please set a valid start time.", "is-error");
        }
        if (data.end_time > schoolEnd) {
            return setMsg("School hours end at 5:00 PM. Please set a valid end time.", "is-error");
        }

        // Check conflicts first
        const conflictCheck = await checkConflicts();
        if (!conflictCheck) {
            return setMsg("Please resolve conflicts before saving.", "is-error");
        }

        const submitBtn = schedForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        const payload = {
            action: editingId ? "update" : "create",
            ...data
        };
        if (editingId) {
            payload.schedule_id = editingId;
        }

        const response = await apiPost(payload);
        if (submitBtn) submitBtn.disabled = false;

        if (response.success) {
            hideModals();
            await loadSchedules();
        } else {
            setMsg(response.message || "Failed to save schedule.", "is-error");
        }
    });
}

// ---------- Row Actions ----------
if (schedRows) {
    schedRows.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-action]");
        if (!btn) return;

        const s = schedules.find((x) => String(x.schedule_id) === btn.dataset.id);
        if (!s) return;

        if (btn.dataset.action === "edit") {
            openSchedModal(s);
        } else if (btn.dataset.action === "delete") {
            deletingId = s.schedule_id;
            const teacherName = s.teacher_first_name ? getFullName(s.teacher_first_name, s.teacher_last_name) : "—";
            deleteName.textContent = `${s.subject_code} - ${s.section_name} (${DAYS[s.day_of_week] || s.day_of_week}, ${formatTime(s.start_time)} - ${formatTime(s.end_time)})`;
            deleteModal.hidden = false;
        }
    });
}

// ---------- Confirm Delete ----------
if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", async () => {
        if (!deletingId) return;

        const response = await apiPost({
            action: "delete",
            schedule_id: deletingId
        });

        hideModals();

        if (response.success) {
            await loadSchedules();
        } else {
            alert(response.message || "Failed to delete schedule.");
        }
    });
}

// ---------- Clear Search ----------
const searchClear = document.querySelector('.search-clear');
if (searchClear && searchInput) {
    searchInput.addEventListener('input', () => {
        searchClear.hidden = !searchInput.value;
    });
    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchClear.hidden = true;
        currentPage = 1;
        loadSchedules();
    });
}

// ---------- Initialize ----------
console.log("Initializing Schedule module...");
loadLookupData().then(() => {
    loadSchedules();
});