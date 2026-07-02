// Holds the lookups so we can reuse them for the filter row AND the modal form
let sectionStrands = [];
let sectionTeachers = [];


// LOAD STRAND + TEACHER LOOKUPS, POPULATE DROPDOWNS

function loadLookups() {

    $.ajax({
        url: "../Controllers/sections_lookup_controller.php",
        type: "GET",
        dataType: "json",
        success: function(response) {

            sectionStrands = response.strands;
            sectionTeachers = response.teachers;

            let strandFilter = document.getElementById("strand_filter");
            let strandSelect = document.getElementById("strand_id");
            let adviserSelect = document.getElementById("adviser_id");

            strandFilter.innerHTML = '<option value="">All Strands</option>';
            strandSelect.innerHTML = '<option value="">Select Strand</option>';

            sectionStrands.forEach(function(strand) {
                let label = strand.strand_name + " (" + strand.track_name + ")";
                strandFilter.innerHTML += `<option value="${strand.strand_id}">${label}</option>`;
                strandSelect.innerHTML += `<option value="${strand.strand_id}">${label}</option>`;
            });

            adviserSelect.innerHTML = '<option value="">No adviser assigned yet</option>';

            sectionTeachers.forEach(function(teacher) {
                let name = teacher.first_name + " " + teacher.last_name;
                adviserSelect.innerHTML += `<option value="${teacher.teacher_id}">${name}</option>`;
            });

        }
    });

}


// LOAD / FILTER SECTIONS TABLE

function loadSections() {

    let params = {
        keyword: document.getElementById("keyword").value,
        strand_id: document.getElementById("strand_filter").value,
        grade_level: document.getElementById("grade_level_filter").value,
        status: document.getElementById("status_filter").value
    };

    $.ajax({
        url: "../Controllers/sections_list_controller.php",
        type: "GET",
        data: params,
        dataType: "json",
        success: function(sections) {

            let tbody = document.getElementById("sectionsTableBody");
            tbody.innerHTML = "";

            if (sections.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No sections found.</td></tr>';
                return;
            }

            sections.forEach(function(section) {

                let adviserName = section.adviser_first_name
                    ? section.adviser_first_name + " " + section.adviser_last_name
                    : "—";

                let restoreBtn = section.status === "Cancelled"
                    ? `<button type="button" class="btn btn-sm btn-outline-success" onclick="restoreSection(${section.section_id})">Restore</button>`
                    : `<button type="button" class="btn btn-sm btn-outline-danger" onclick="deleteSection(${section.section_id})">Cancel</button>`;

                let row = `
                    <tr>
                        <td>${section.section_name}</td>
                        <td>${section.track_name} - ${section.strand_name}</td>
                        <td>${section.grade_level}</td>
                        <td>${section.school_year}</td>
                        <td>${adviserName}</td>
                        <td>${section.max_slots}</td>
                        <td>${section.status}</td>
                        <td>
                            <button type="button" class="btn btn-sm btn-outline-primary"
                                onclick='editSection(${JSON.stringify(section)})'>Edit</button>
                            ${restoreBtn}
                        </td>
                    </tr>
                `;

                tbody.innerHTML += row;

            });

        }
    });

}


// PREFILL THE MODAL FORM FOR EDITING

function editSection(section) {

    document.getElementById("section_id").value = section.section_id;
    document.getElementById("strand_id").value = section.strand_id;
    document.getElementById("adviser_id").value = section.adviser_id ?? "";
    document.getElementById("grade_level").value = section.grade_level;
    document.getElementById("section_name").value = section.section_name;
    document.getElementById("school_year").value = section.school_year;
    document.getElementById("max_slots").value = section.max_slots;
    document.getElementById("status").value = section.status;

    document.getElementById("sectionModalLabel").innerText = "Edit Class Section";

    let modal = new bootstrap.Modal(document.getElementById("sectionModal"));
    modal.show();

}


// RESET THE FORM FOR ADDING A NEW SECTION

function openAddSectionModal() {

    document.getElementById("sectionForm").reset();
    document.getElementById("section_id").value = "";
    document.getElementById("sectionModalLabel").innerText = "Add Class Section";

    let modal = new bootstrap.Modal(document.getElementById("sectionModal"));
    modal.show();

}


// CANCEL (SOFT DELETE) A SECTION

function deleteSection(id) {

    if (!confirm("Cancel this section? Students already enrolled will not be affected.")) {
        return;
    }

    $.ajax({
        url: "../Controllers/sections_delete_controller.php",
        type: "POST",
        data: { section_id: id, action: "delete" },
        success: function(response) {
            alert(response);
            loadSections();
        }
    });

}


// RESTORE A CANCELLED SECTION

function restoreSection(id) {

    $.ajax({
        url: "../Controllers/sections_delete_controller.php",
        type: "POST",
        data: { section_id: id, action: "restore" },
        success: function(response) {
            alert(response);
            loadSections();
        }
    });

}


// INIT

document.addEventListener("DOMContentLoaded", function() {

    loadLookups();
    loadSections();

    document.getElementById("keyword").addEventListener("input", loadSections);
    document.getElementById("strand_filter").addEventListener("change", loadSections);
    document.getElementById("grade_level_filter").addEventListener("change", loadSections);
    document.getElementById("status_filter").addEventListener("change", loadSections);

    document.getElementById("clearFilters").addEventListener("click", function() {
        document.getElementById("keyword").value = "";
        document.getElementById("strand_filter").value = "";
        document.getElementById("grade_level_filter").value = "";
        document.getElementById("status_filter").value = "";
        loadSections();
    });

});
