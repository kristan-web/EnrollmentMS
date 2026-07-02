const STUDENTS_GET_URL = "../Controllers/students_get_controller.php";
const STUDENTS_UPDATE_URL = "../Controllers/students_update_controller.php";

function getStudentIdFromUrl() {

    const params = new URLSearchParams(window.location.search);
    return params.get("id");

}

$(document).ready(function () {

    const studentId = getStudentIdFromUrl();

    if (!studentId) {

        alert("No student selected to edit.");
        window.location.href = "students-list.html";
        return;

    }

    $("#student_id").val(studentId);

    loadStudent(studentId);

    $("#studentEditForm").on("submit", function (e) {

        e.preventDefault();

        saveStudent();

    });

});


function loadStudent(id) {

    $.ajax({
        url: STUDENTS_GET_URL,
        type: "GET",
        data: { id: id },
        dataType: "json",
        success: function (student) {

            if (student.error) {

                alert(student.error);
                window.location.href = "students-list.html";
                return;

            }

            populateForm(student);

        },
        error: function () {

            alert("Failed to load student information.");

        }
    });

}


function populateForm(student) {

    $("#lrn").val(student.lrn);
    $("#student_number").val(student.student_number);
    $("#first_name").val(student.first_name);
    $("#middle_name").val(student.middle_name);
    $("#last_name").val(student.last_name);
    $("#gender").val(student.gender);
    $("#birthdate").val(student.birthdate);
    $("#address").val(student.address);
    $("#contact_number").val(student.contact_number);
    $("#email").val(student.email);
    $("#grade_level").val(student.grade_level);
    $("#status").val(student.status);

    $("#father_name").val(student.father_name);
    $("#father_contact_number").val(student.father_contact_number);
    $("#father_occupation").val(student.father_occupation);
    $("#mother_name").val(student.mother_name);
    $("#mother_contact_number").val(student.mother_contact_number);
    $("#mother_occupation").val(student.mother_occupation);

    $("#guardian_name").val(student.guardian_name);
    $("#guardian_relationship").val(student.guardian_relationship);
    $("#guardian_contact_number").val(student.guardian_contact_number);
    $("#guardian_address").val(student.guardian_address);

    $("#emergency_contact_name").val(student.emergency_contact_name);
    $("#emergency_contact_relationship").val(student.emergency_contact_relationship);
    $("#emergency_contact_number").val(student.emergency_contact_number);

}


function saveStudent() {

    let studentData = {
        student_id: $("#student_id").val(),
        lrn: $("#lrn").val(),
        first_name: $("#first_name").val(),
        middle_name: $("#middle_name").val(),
        last_name: $("#last_name").val(),
        gender: $("#gender").val(),
        birthdate: $("#birthdate").val(),
        address: $("#address").val(),
        contact_number: $("#contact_number").val(),
        email: $("#email").val(),
        grade_level: $("#grade_level").val(),
        status: $("#status").val(),

        father_name: $("#father_name").val(),
        father_contact_number: $("#father_contact_number").val(),
        father_occupation: $("#father_occupation").val(),
        mother_name: $("#mother_name").val(),
        mother_contact_number: $("#mother_contact_number").val(),
        mother_occupation: $("#mother_occupation").val(),

        guardian_name: $("#guardian_name").val(),
        guardian_relationship: $("#guardian_relationship").val(),
        guardian_contact_number: $("#guardian_contact_number").val(),
        guardian_address: $("#guardian_address").val(),

        emergency_contact_name: $("#emergency_contact_name").val(),
        emergency_contact_relationship: $("#emergency_contact_relationship").val(),
        emergency_contact_number: $("#emergency_contact_number").val()
    };

    $.ajax({
        url: STUDENTS_UPDATE_URL,
        type: "POST",
        data: studentData,
        success: function (response) {

            alert(response);

            if (response.indexOf("SUCCESS") !== -1) {

                window.location.href = "students-list.html";

            }

        },
        error: function () {

            alert("Failed to save changes.");

        }
    });

}
