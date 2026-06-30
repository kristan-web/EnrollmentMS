// Load departments into the dropdown when the page is ready
$(document).ready(function(){

    $.ajax({

        url: "Controllers/departments_controllers.php",
        type: "GET",
        dataType: "json",

        success: function(departments){

            let $select = $("#department_id");

            departments.forEach(function(dept){

                $select.append(
                    $("<option>")
                    .val(dept.department_id)
                    .text(dept.department_name)
                );

            });

        },

        error: function(){

            alert("Failed to load departments");

        }

    });

});


document
.getElementById("professorForm")
.addEventListener("submit", function(e){
    e.preventDefault();

    let professorData = {
        department_id:
        document.getElementById("department_id").value,

        first_name:
        document.getElementById("first_name").value,

        last_name:
        document.getElementById("last_name").value,

        email:
        document.getElementById("email").value,

        contact_number:
        document.getElementById("contact_number").value

    };

    console.log(professorData);

    $.ajax({

        url:
        "Controllers/professors_controllers.php",
        type:
        "POST",
        data:
        professorData,

        success:function(response){

            console.log(response);

            alert(response);

            document
            .getElementById("professorForm")
            .reset();
        }
    });
});
