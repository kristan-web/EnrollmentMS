document
.getElementById("studentForm")
.addEventListener("submit", function(e){
    e.preventDefault();

    let studentData = {
        lrn:
        document.getElementById("lrn").value,

        student_number:
        document.getElementById("student_number").value,

        first_name:
        document.getElementById("first_name").value,

        middle_name:
        document.getElementById("middle_name").value,

        last_name:
        document.getElementById("last_name").value,

        gender:
        document.getElementById("gender").value,

        birthdate:
        document.getElementById("birthdate").value,

        address:
        document.getElementById("address").value,

        contact_number:
        document.getElementById("contact_number").value,

        email:
        document.getElementById("email").value,

        grade_level:
        document.getElementById("grade_level").value,

        father_name:
        document.getElementById("father_name").value,

        father_contact_number:
        document.getElementById("father_contact_number").value,

        father_occupation:
        document.getElementById("father_occupation").value,

        mother_name:
        document.getElementById("mother_name").value,

        mother_contact_number:
        document.getElementById("mother_contact_number").value,

        mother_occupation:
        document.getElementById("mother_occupation").value,

        guardian_name:
        document.getElementById("guardian_name").value,

        guardian_relationship:
        document.getElementById("guardian_relationship").value,

        guardian_contact_number:
        document.getElementById("guardian_contact_number").value,

        guardian_address:
        document.getElementById("guardian_address").value,

        emergency_contact_name:
        document.getElementById("emergency_contact_name").value,

        emergency_contact_relationship:
        document.getElementById("emergency_contact_relationship").value,

        emergency_contact_number:
        document.getElementById("emergency_contact_number").value
    };

    console.log(studentData);

    $.ajax({

        url:
        "../Controllers/students_controllers.php",
        type:
        "POST",
        data:
        studentData,

        success:function(response){

            console.log(response);

            alert(response);

            document
            .getElementById("studentForm")
            .reset();
        }
    });
});
