const FILTERS_URL = "../Controllers/teachers_filters_controller.php";
const TEACHERS_LIST_URL = "../Controllers/teachers_list_controller.php";
const TEACHERS_DELETE_URL = "../Controllers/teachers_delete_controller.php";

let searchDebounce = null;

$(document).ready(function () {

    loadSpecializations();
    loadTeachers();

    // Specialization changed -> just re-run the search
    $("#specialization_filter").on("change", function () {

        loadTeachers();

    });

    // Keyword search -> debounce so we don't hit the server on every keystroke
    $("#keyword").on("input", function () {

        clearTimeout(searchDebounce);

        searchDebounce = setTimeout(function () {
            loadTeachers();
        }, 350);

    });

    // Clear all filters
    $("#clearFilters").on("click", function () {

        $("#keyword").val("");
        $("#specialization_filter").val("");

        loadTeachers();

    });

    // Deactivate a teacher (soft delete), event delegated since rows are dynamic
    $("#teachersTableBody").on("click", ".btn-deactivate", function () {

        const teacherId = $(this).data("id");

        if (!confirm("Deactivate this teacher?")) {
            return;
        }

        $.ajax({
            url: TEACHERS_DELETE_URL,
            type: "POST",
            data: { id: teacherId },
            success: function (response) {

                alert(response);
                loadTeachers();

            },
            error: function () {

                alert("Failed to deactivate teacher.");

            }
        });

    });

});


function loadSpecializations() {

    $.ajax({
        url: FILTERS_URL,
        type: "GET",
        dataType: "json",
        success: function (specializations) {

            let options = '<option value="">All Specializations</option>';

            specializations.forEach(function (row) {
                options += `<option value="${row.specialization}">${row.specialization}</option>`;
            });

            $("#specialization_filter").html(options);

        }
    });

}


function loadTeachers() {

    let params = {
        keyword: $("#keyword").val(),
        specialization: $("#specialization_filter").val()
    };

    $.ajax({
        url: TEACHERS_LIST_URL,
        type: "GET",
        data: params,
        dataType: "json",
        success: function (teachers) {

            renderTeachers(teachers);

        },
        error: function () {

            $("#teachersTableBody").html(
                '<tr><td colspan="6" class="text-center text-danger">Failed to load teachers.</td></tr>'
            );

        }
    });

}


function renderTeachers(teachers) {

    if (!teachers || teachers.length === 0) {

        $("#teachersTableBody").html(
            '<tr><td colspan="6" class="text-center text-muted">No teachers found.</td></tr>'
        );

        return;

    }

    let rows = "";

    teachers.forEach(function (teacher) {

        rows += `
            <tr>
                <td>${teacher.last_name}, ${teacher.first_name}</td>
                <td>${teacher.email ?? ""}</td>
                <td>${teacher.contact_number ?? ""}</td>
                <td>${teacher.specialization ?? "—"}</td>
                <td>${teacher.status ?? ""}</td>
                <td>
                    <a href="teacher-edit.html?id=${teacher.teacher_id}" class="btn btn-sm btn-outline-primary">
                        Edit
                    </a>
                    <button type="button" class="btn btn-sm btn-outline-danger btn-deactivate" data-id="${teacher.teacher_id}">
                        Deactivate
                    </button>
                </td>
            </tr>
        `;

    });

    $("#teachersTableBody").html(rows);

}
