const TEACHERS_CREATE_URL = "../Controllers/teachers_controllers.php";

$(document).ready(function () {

    $("#teacherForm").on("submit", function (e) {

        e.preventDefault();

        submitTeacher();

    });

});


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


function submitTeacher() {

    let teacherData = {
        first_name: $("#first_name").val().trim(),
        last_name: $("#last_name").val().trim(),
        email: $("#email").val().trim(),
        contact_number: $("#contact_number").val().trim(),
        specialization: $("#specialization").val().trim()
    };

    const errors = validateTeacherForm(teacherData);

    $("#formAlert").addClass("d-none");

    if (errors.length > 0) {

        showFormAlert(errors);
        return;

    }

    $.ajax({
        url: TEACHERS_CREATE_URL,
        type: "POST",
        data: teacherData,
        success: function (response) {

            alert(response);

            if (response.indexOf("SUCCESS") !== -1) {

                $("#teacherForm")[0].reset();

            }

        },
        error: function () {

            showFormAlert(["Failed to save teacher. Please try again."]);

        }
    });

}
