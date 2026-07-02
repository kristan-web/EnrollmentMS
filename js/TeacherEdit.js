const TEACHERS_GET_URL = "../Controllers/teachers_get_controller.php";
const TEACHERS_UPDATE_URL = "../Controllers/teachers_update_controller.php";

function getTeacherIdFromUrl() {

    const params = new URLSearchParams(window.location.search);
    return params.get("id");

}

$(document).ready(function () {

    const teacherId = getTeacherIdFromUrl();

    if (!teacherId) {

        alert("No teacher selected to edit.");
        window.location.href = "teachers-list.html";
        return;

    }

    $("#teacher_id").val(teacherId);

    loadTeacher(teacherId);

    $("#teacherEditForm").on("submit", function (e) {

        e.preventDefault();

        saveTeacher();

    });

});


function loadTeacher(id) {

    $.ajax({
        url: TEACHERS_GET_URL,
        type: "GET",
        data: { id: id },
        dataType: "json",
        success: function (teacher) {

            if (teacher.error) {

                alert(teacher.error);
                window.location.href = "teachers-list.html";
                return;

            }

            populateForm(teacher);

        },
        error: function () {

            alert("Failed to load teacher information.");

        }
    });

}


function populateForm(teacher) {

    $("#first_name").val(teacher.first_name);
    $("#last_name").val(teacher.last_name);
    $("#email").val(teacher.email);
    $("#contact_number").val(teacher.contact_number);
    $("#specialization").val(teacher.specialization);
    $("#status").val(teacher.status);

}


function validateTeacherForm(data) {

    const errors = [];

    if (!/^[a-zA-Z .'-]{2,50}$/.test(data.first_name)) {
        errors.push("First name must be letters only (2-50 characters).");
    }

    if (!/^[a-zA-Z .'-]{2,50}$/.test(data.last_name)) {
        errors.push("Last name must be letters only (2-50 characters).");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push("Please enter a valid email address.");
    }

    if (!/^[0-9]{7,15}$/.test(data.contact_number)) {
        errors.push("Contact number must be 7-15 digits, numbers only.");
    }

    if (data.specialization.trim() === "") {
        errors.push("Specialization is required.");
    }

    return errors;

}


function showFormAlert(messages) {

    $("#formAlert").html(messages.join("<br>")).removeClass("d-none");

}


function saveTeacher() {

    let teacherData = {
        teacher_id: $("#teacher_id").val(),
        first_name: $("#first_name").val().trim(),
        last_name: $("#last_name").val().trim(),
        email: $("#email").val().trim(),
        contact_number: $("#contact_number").val().trim(),
        specialization: $("#specialization").val().trim(),
        status: $("#status").val()
    };

    const errors = validateTeacherForm(teacherData);

    $("#formAlert").addClass("d-none");

    if (errors.length > 0) {

        showFormAlert(errors);
        return;

    }

    $.ajax({
        url: TEACHERS_UPDATE_URL,
        type: "POST",
        data: teacherData,
        success: function (response) {

            alert(response);

            if (response.indexOf("SUCCESS") !== -1) {

                window.location.href = "teachers-list.html";

            }

        },
        error: function () {

            showFormAlert(["Failed to save changes. Please try again."]);

        }
    });

}
