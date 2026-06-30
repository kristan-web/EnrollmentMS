document
.getElementById("studentForm")
.addEventListener("submit", function(e){
    e.preventDefault();

    let studentData = {
        student_number:
        document.getElementById("student_number").value,
        year_level:
        document.getElementById("year_level").value,
        first_name:
        document.getElementById("first_name").value,

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
        document.getElementById("email").value

        
    };
console.log(first_name.value,last_name.value,gender.value,birthdate.value,address.value,contact_number.value,email.value,student_number.value,year_level.value);
    $.ajax({

        url:
        "Controllers/students_controllers.php",
        type:
        "POST",
        data:
        studentData,

        success:function(response){


            console.log(response);


            alert("Student Added Successfully");


            document
            .getElementById("studentForm")
            .reset();
        },

            success:function(response){

            console.log(response);

            alert(response);

        }
    });
});