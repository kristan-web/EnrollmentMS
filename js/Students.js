const STUDENTS_URL = "../Controllers/students_controllers.php";

function getStudentIdFromUrl() {

    const params = new URLSearchParams(window.location.search);
    return params.get("id");

}

$(document).ready(function () {

    const studentId = getStudentIdFromUrl();

    // Works whether the page has #studentForm (add) or #studentEditForm (edit)
    const $form = $("#studentEditForm").length ? $("#studentEditForm") : $("#studentForm");

    if (studentId) {

        // Edit mode
        $("#student_id").val(studentId);
        loadStudent(studentId);

    }

    $form.on("submit", function (e) {

        e.preventDefault();

        saveStudent(studentId, $form);

    });

});


function loadStudent(id) {

    $.ajax({
        url: STUDENTS_URL,
        type: "GET",
        data: { action: "get", id: id },
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


function saveStudent(studentId, $form) {

    let studentData = {
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

    if (studentId) {

        // Edit mode
        studentData.action = "update";
        studentData.student_id = studentId;
        studentData.status = $("#status").val();

    } else {

        // Add mode
        studentData.action = "create";
        studentData.student_number = $("#student_number").val();

    }

    $.ajax({
        url: STUDENTS_URL,
        type: "POST",
        data: studentData,
        dataType: "json",
        success: function (response) {

            alert(response.message);

            if (response.success) {

                if (studentId) {

                    window.location.href = "students-list.html";

                } else {

                    $form[0].reset();

                }

            }

        },
        error: function () {

            alert("Failed to save student.");

        }
    });

}