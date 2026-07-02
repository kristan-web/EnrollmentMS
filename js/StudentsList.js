const FILTERS_URL = "../Controllers/filters_controller.php";
const STUDENTS_LIST_URL = "../Controllers/students_controllers.php";

let searchDebounce = null;

$(document).ready(function () {

    loadTracks();
    loadStrands();   // all strands, since no track chosen yet
    loadSections();  // all open sections, since no strand/grade chosen yet
    loadStudents();  // initial unfiltered list

    // Track changed -> reload strands for that track, reset strand & section
    $("#track_filter").on("change", function () {

        $("#strand_filter").val("");
        $("#section_filter").val("");

        loadStrands($(this).val());
        loadSections();
        loadStudents();

    });

    // Strand changed -> reload sections for that strand + current grade level
    $("#strand_filter").on("change", function () {

        $("#section_filter").val("");

        loadSections($(this).val(), $("#grade_level_filter").val());
        loadStudents();

    });

    // Grade level changed -> reload sections for current strand + grade level
    $("#grade_level_filter").on("change", function () {

        $("#section_filter").val("");

        loadSections($("#strand_filter").val(), $(this).val());
        loadStudents();

    });

    // Section changed -> just re-run the search
    $("#section_filter").on("change", function () {

        loadStudents();

    });

    // Keyword search -> debounce so we don't hit the server on every keystroke
    $("#keyword").on("input", function () {

        clearTimeout(searchDebounce);

        searchDebounce = setTimeout(function () {
            loadStudents();
        }, 350);

    });

    // Clear all filters
    $("#clearFilters").on("click", function () {

        $("#keyword").val("");
        $("#track_filter").val("");
        $("#strand_filter").val("");
        $("#grade_level_filter").val("");
        $("#section_filter").val("");

        loadStrands();
        loadSections();
        loadStudents();

    });

});


function loadTracks() {

    $.ajax({
        url: FILTERS_URL,
        type: "GET",
        data: { type: "tracks" },
        dataType: "json",
        success: function (tracks) {

            let options = '<option value="">All Tracks</option>';

            tracks.forEach(function (track) {
                options += `<option value="${track.track_id}">${track.track_name}</option>`;
            });

            $("#track_filter").html(options);

        }
    });

}


function loadStrands(track_id) {

    $.ajax({
        url: FILTERS_URL,
        type: "GET",
        data: { type: "strands", track_id: track_id || "" },
        dataType: "json",
        success: function (strands) {

            let options = '<option value="">All Strands</option>';

            strands.forEach(function (strand) {
                options += `<option value="${strand.strand_id}">${strand.strand_name} (${strand.strand_code})</option>`;
            });

            $("#strand_filter").html(options);

        }
    });

}


function loadSections(strand_id, grade_level) {

    $.ajax({
        url: FILTERS_URL,
        type: "GET",
        data: {
            type: "sections",
            strand_id: strand_id || "",
            grade_level: grade_level || ""
        },
        dataType: "json",
        success: function (sections) {

            let options = '<option value="">All Sections</option>';

            sections.forEach(function (section) {
                options += `<option value="${section.section_id}">${section.section_name} (${section.school_year})</option>`;
            });

            $("#section_filter").html(options);

        }
    });

}


function loadStudents() {

    let params = {
        keyword: $("#keyword").val(),
        track_id: $("#track_filter").val(),
        strand_id: $("#strand_filter").val(),
        grade_level: $("#grade_level_filter").val(),
        section_id: $("#section_filter").val()
    };

    $.ajax({
        url: STUDENTS_LIST_URL,
        type: "GET",
        data: params,
        dataType: "json",
        success: function (students) {

            renderStudents(students);

        },
        error: function () {

            $("#studentsTableBody").html(
                '<tr><td colspan="9" class="text-center text-danger">Failed to load students.</td></tr>'
            );

        }
    });

}


function renderStudents(students) {

    if (!students || students.length === 0) {

        $("#studentsTableBody").html(
            '<tr><td colspan="9" class="text-center text-muted">No students found.</td></tr>'
        );

        return;

    }

    let rows = "";

    students.forEach(function (student) {

        rows += `
            <tr>
                <td>${student.lrn ?? ""}</td>
                <td>${student.student_number ?? ""}</td>
                <td>${student.last_name}, ${student.first_name} ${student.middle_name ?? ""}</td>
                <td>${student.grade_level ?? ""}</td>
                <td>${student.track_name ?? "—"}</td>
                <td>${student.strand_name ?? "—"}</td>
                <td>${student.section_name ?? "—"}</td>
                <td>${student.contact_number ?? ""}</td>
                <td>
                    <a href="student-edit.html?id=${student.student_id}" class="btn btn-sm btn-outline-primary">
                        Edit
                    </a>
                </td>
            </tr>
        `;

    });

    $("#studentsTableBody").html(rows);

}
