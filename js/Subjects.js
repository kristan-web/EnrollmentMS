const SUBJECTS_URL = "../Controllers/subjects_controllers.php";

function getSubjectIdFromUrl() {

    const params = new URLSearchParams(window.location.search);
    return params.get("id");

}

$(document).ready(function () {

    const subjectId = getSubjectIdFromUrl();

    // Works whether the page has #subjectEditForm (edit) or #subjectForm (add)
    const $form = $("#subjectEditForm").length ? $("#subjectEditForm") : $("#subjectForm");
    const isEditForm = $form.is("#subjectEditForm");

    loadMeta(function () {

        if (isEditForm) {

            if (!subjectId) {

                alert("No subject selected to edit.");
                window.location.href = "subjects-list.html";
                return;

            }

            $("#subject_id").val(subjectId);

            loadSubject(subjectId);

        }

    });

    // Core subjects are shared across all strands, so hide/disable the strand field
    $("#subject_type").on("change", function () {

        toggleStrandField($(this).val());

    });

    $form.on("submit", function (e) {

        e.preventDefault();

        saveSubject(subjectId, $form);

    });

});


// Loads dropdown data: subject types, grade levels, semesters, strands

function loadMeta(callback) {

    $.ajax({
        url: SUBJECTS_URL,
        type: "GET",
        data: { action: "meta" },
        dataType: "json",
        success: function (meta) {

            let typeOptions = "";
            meta.subject_types.forEach(function (type) {
                typeOptions += `<option value="${type}">${type}</option>`;
            });
            $("#subject_type").html(typeOptions);

            let gradeOptions = "";
            meta.grade_levels.forEach(function (grade) {
                gradeOptions += `<option value="${grade}">Grade ${grade}</option>`;
            });
            $("#grade_level").html(gradeOptions);

            let semesterOptions = "";
            meta.semesters.forEach(function (sem) {
                semesterOptions += `<option value="${sem}">${sem}</option>`;
            });
            $("#semester").html(semesterOptions);

            let strandOptions = '<option value="">-- Select Strand --</option>';
            meta.strands.forEach(function (strand) {
                strandOptions += `<option value="${strand.strand_id}">${strand.strand_code} - ${strand.strand_name}</option>`;
            });
            $("#strand_id").html(strandOptions);

            toggleStrandField($("#subject_type").val());

            if (typeof callback === "function") {
                callback();
            }

        },
        error: function () {

            alert("Failed to load form data. Please refresh the page.");

        }
    });

}


// Shows/hides the strand dropdown depending on subject type.
// Core subjects are shared across all strands and must not have a strand.

function toggleStrandField(subjectType) {

    if (subjectType === "Core") {

        $("#strandFieldWrapper").addClass("d-none");
        $("#strand_id").val("").prop("required", false);

    } else {

        $("#strandFieldWrapper").removeClass("d-none");
        $("#strand_id").prop("required", true);

    }

}


function loadSubject(id) {

    $.ajax({
        url: SUBJECTS_URL,
        type: "GET",
        data: { action: "get", id: id },
        dataType: "json",
        success: function (subject) {

            if (subject.error) {

                alert(subject.error);
                window.location.href = "subjects-list.html";
                return;

            }

            populateForm(subject);

        },
        error: function () {

            alert("Failed to load subject information.");

        }
    });

}


function populateForm(subject) {

    $("#subject_code").val(subject.subject_code);
    $("#subject_name").val(subject.subject_name);
    $("#subject_type").val(subject.subject_type);
    $("#grade_level").val(subject.grade_level);
    $("#semester").val(subject.semester);
    $("#units").val(subject.units);
    $("#description").val(subject.description);
    $("#strand_id").val(subject.strand_id ?? "");

    if ($("#status").length) {
        $("#status").val(subject.status);
    }

    toggleStrandField(subject.subject_type);

}


function validateSubjectForm(data) {

    const errors = [];

    if (!/^[A-Za-z0-9_-]{2,20}$/.test(data.subject_code)) {
        errors.push("Subject code may only contain letters, numbers, hyphens, and underscores (2-20 characters).");
    }

    if (data.subject_name.length < 2 || data.subject_name.length > 150) {
        errors.push("Subject name must be between 2 and 150 characters.");
    }

    if (!["Core", "Applied", "Specialized"].includes(data.subject_type)) {
        errors.push("Please select a valid subject type.");
    }

    if (!["11", "12"].includes(data.grade_level)) {
        errors.push("Please select a valid grade level.");
    }

    if (!["1st Semester", "2nd Semester"].includes(data.semester)) {
        errors.push("Please select a valid semester.");
    }

    if (!/^\d{1,2}(\.\d)?$/.test(data.units) || parseFloat(data.units) < 0.5 || parseFloat(data.units) > 20) {
        errors.push("Units must be a number between 0.5 and 20 (at most one decimal place).");
    }

    if (data.subject_type === "Core" && data.strand_id) {
        errors.push("Core subjects must not have a strand assigned.");
    }

    if ((data.subject_type === "Applied" || data.subject_type === "Specialized") && !data.strand_id) {
        errors.push("Please select a strand for Applied/Specialized subjects.");
    }

    if (data.description && data.description.length > 1000) {
        errors.push("Description must be 1000 characters or fewer.");
    }

    return errors;

}


function showFormAlert(messages) {

    $("#formAlert").html(messages.join("<br>")).removeClass("d-none");

}


function saveSubject(subjectId, $form) {

    let subjectData = {
        subject_code: $("#subject_code").val().trim(),
        subject_name: $("#subject_name").val().trim(),
        subject_type: $("#subject_type").val(),
        grade_level: $("#grade_level").val(),
        semester: $("#semester").val(),
        units: $("#units").val().trim(),
        description: $("#description").val().trim(),
        strand_id: $("#strand_id").val()
    };

    const errors = validateSubjectForm(subjectData);

    $("#formAlert").addClass("d-none");

    if (errors.length > 0) {

        showFormAlert(errors);
        return;

    }

    if (subjectId) {

        // Edit mode
        subjectData.action = "update";
        subjectData.subject_id = subjectId;
        subjectData.status = $("#status").val();

    } else {

        // Add mode
        subjectData.action = "create";

    }

    $.ajax({
        url: SUBJECTS_URL,
        type: "POST",
        data: subjectData,
        success: function (response) {

            alert(response);

            if (response.indexOf("SUCCESS") !== -1) {

                if (subjectId) {

                    window.location.href = "subjects-list.html";

                } else {

                    $form[0].reset();
                    toggleStrandField($("#subject_type").val());

                }

            }

        },
        error: function () {

            showFormAlert(["Failed to save subject. Please try again."]);

        }
    });

}