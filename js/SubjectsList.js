const SUBJECTS_URL = "../Controllers/subjects_controllers.php";

let searchDebounce = null;

$(document).ready(function () {

    loadMeta();
    loadSubjects();

    // Any filter changed -> re-run the search
    $("#subject_type_filter, #grade_level_filter, #semester_filter, #strand_filter, #status_filter").on("change", function () {

        loadSubjects();

    });

    // Keyword search -> debounce so we don't hit the server on every keystroke
    $("#keyword").on("input", function () {

        clearTimeout(searchDebounce);

        searchDebounce = setTimeout(function () {
            loadSubjects();
        }, 350);

    });

    // Clear all filters
    $("#clearFilters").on("click", function () {

        $("#keyword").val("");
        $("#subject_type_filter").val("");
        $("#grade_level_filter").val("");
        $("#semester_filter").val("");
        $("#strand_filter").val("");
        $("#status_filter").val("Active");

        loadSubjects();

    });

    // Deactivate a subject (soft delete), event delegated since rows are dynamic
    $("#subjectsTableBody").on("click", ".btn-deactivate", function () {

        const subjectId = $(this).data("id");

        if (!confirm("Deactivate this subject? It will no longer appear in active listings.")) {
            return;
        }

        $.ajax({
            url: SUBJECTS_URL,
            type: "POST",
            data: { id: subjectId, action: "delete" },
            success: function (response) {

                alert(response);
                loadSubjects();

            },
            error: function () {

                alert("Failed to deactivate subject.");

            }
        });

    });

    // Restore an inactive subject, event delegated since rows are dynamic
    $("#subjectsTableBody").on("click", ".btn-restore", function () {

        const subjectId = $(this).data("id");

        if (!confirm("Restore this subject to Active status?")) {
            return;
        }

        $.ajax({
            url: SUBJECTS_URL,
            type: "POST",
            data: { id: subjectId, action: "restore" },
            success: function (response) {

                alert(response);
                loadSubjects();

            },
            error: function () {

                alert("Failed to restore subject.");

            }
        });

    });

});


// Loads dropdown data: subject types, grade levels, semesters, strands

function loadMeta() {

    $.ajax({
        url: SUBJECTS_URL,
        type: "GET",
        data: { action: "meta" },
        dataType: "json",
        success: function (meta) {

            let typeOptions = '<option value="">All Types</option>';
            meta.subject_types.forEach(function (type) {
                typeOptions += `<option value="${type}">${type}</option>`;
            });
            $("#subject_type_filter").html(typeOptions);

            let gradeOptions = '<option value="">All Grade Levels</option>';
            meta.grade_levels.forEach(function (grade) {
                gradeOptions += `<option value="${grade}">Grade ${grade}</option>`;
            });
            $("#grade_level_filter").html(gradeOptions);

            let semesterOptions = '<option value="">All Semesters</option>';
            meta.semesters.forEach(function (sem) {
                semesterOptions += `<option value="${sem}">${sem}</option>`;
            });
            $("#semester_filter").html(semesterOptions);

            let strandOptions = '<option value="">All Strands</option>';
            meta.strands.forEach(function (strand) {
                strandOptions += `<option value="${strand.strand_id}">${strand.strand_code}</option>`;
            });
            $("#strand_filter").html(strandOptions);

        }
    });

}


function loadSubjects() {

    let params = {
        keyword: $("#keyword").val(),
        subject_type: $("#subject_type_filter").val(),
        grade_level: $("#grade_level_filter").val(),
        semester: $("#semester_filter").val(),
        strand_id: $("#strand_filter").val(),
        status: $("#status_filter").val() || "Active"
    };

    $.ajax({
        url: SUBJECTS_URL,
        type: "GET",
        data: params,
        dataType: "json",
        success: function (subjects) {

            renderSubjects(subjects, params.status);

        },
        error: function () {

            $("#subjectsTableBody").html(
                '<tr><td colspan="9" class="text-center text-danger">Failed to load subjects.</td></tr>'
            );

        }
    });

}


function renderSubjects(subjects, statusFilter) {

    if (!subjects || subjects.length === 0) {

        $("#subjectsTableBody").html(
            '<tr><td colspan="8" class="text-center text-muted">No subjects found.</td></tr>'
        );

        return;

    }

    let rows = "";

    subjects.forEach(function (subject) {

        const strandLabel = subject.strand_code ? subject.strand_code : "All Strands";

        const actionButton = (statusFilter === "Inactive")
            ? `<button type="button" class="btn btn-sm btn-outline-success btn-restore" data-id="${subject.subject_id}">Restore</button>`
            : `
                <a href="subject-edit.html?id=${subject.subject_id}" class="btn btn-sm btn-outline-primary">Edit</a>
                <button type="button" class="btn btn-sm btn-outline-danger btn-deactivate" data-id="${subject.subject_id}">Deactivate</button>
            `;

        rows += `
            <tr>
                <td>${subject.subject_code}</td>
                <td>${subject.subject_name}</td>
                <td>${subject.subject_type}</td>
                <td>Grade ${subject.grade_level}</td>
                <td>${subject.semester}</td>
                <td>${subject.units}</td>
                <td>${strandLabel}</td>
                <td>${subject.status ?? ""}</td>
                <td>${actionButton}</td>
            </tr>
        `;

    });

    $("#subjectsTableBody").html(rows);

}