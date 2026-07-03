document
.getElementById("sectionForm")
.addEventListener("submit", function(e){
    e.preventDefault();

    let sectionData = {
        section_id:
        document.getElementById("section_id").value,

        strand_id:
        document.getElementById("strand_id").value,

        adviser_id:
        document.getElementById("adviser_id").value,

        grade_level:
        document.getElementById("grade_level").value,

        section_name:
        document.getElementById("section_name").value,

        school_year:
        document.getElementById("school_year").value,

        max_slots:
        document.getElementById("max_slots").value,

        status:
        document.getElementById("status").value
    };

    console.log(sectionData);

    $.ajax({

        url:
        "../Controllers/sections_controllers.php",
        type:
        "POST",
        data:
        sectionData,

        success:function(response){

            console.log(response);

            alert(response);

            document
            .getElementById("sectionForm")
            .reset();

            document.getElementById("section_id").value = "";

            // hide the modal and refresh the table (both defined in SectionsList.js)
            let modalEl = document.getElementById("sectionModal");
            let modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) {
                modal.hide();
            }

            loadSections();
        }
    });
});
