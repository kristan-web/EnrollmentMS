/**
 * Applicant Documents Module
 * Connects the "Documents" wizard step to applicant_documents_controllers.php
 */

const DOCUMENTS_API_URL = "../Controllers/applicant_documents_controllers.php";

// Filled in once Step 1 finishes (POST to applicants_controllers.php returns these)
let applicantId = null;
let referenceNumber = null;
let checklist = [];
const uploadedByType = {}; // document_type_id -> { documentId, filename, status }

/**
 * Call this once you know the applicant type, to populate the upload slots.
 */
function loadDocumentChecklist(applicantType) {
    const params = new URLSearchParams();
    params.append("action", "checklist");
    params.append("applicant_type", applicantType);

    return fetch(`${DOCUMENTS_API_URL}?${params.toString()}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) throw new Error(data.error);
            checklist = data;
            renderDocList(checklist);
            return checklist;
        })
        .catch(error => {
            console.error("Error loading document checklist:", error);
            docList.innerHTML = `<p style="color:#c00;">Failed to load requirements: ${error.message}</p>`;
        });
}

/**
 * Renders one upload slot per active document type into #docList.
 */
function renderDocList(types) {
    docList.innerHTML = "";

    types.forEach(docType => {
        const slot = document.createElement("div");
        slot.className = "doc-slot";
        slot.dataset.documentTypeId = docType.document_type_id;
        slot.innerHTML = `
            <div class="doc-slot__info">
                <span class="doc-slot__name">${escapeHtml(docType.name)}${docType.is_required == 1 ? ' <b class="req">*</b>' : ""}</span>
                <span class="doc-slot__status" data-role="status">Not uploaded</span>
            </div>
            <input type="file" accept=".jpg,.jpeg,.png,.pdf" data-role="input" hidden />
            <button type="button" class="btn btn--ghost" data-role="pick">Choose file</button>
        `;

        const input = slot.querySelector('[data-role="input"]');
        const pickBtn = slot.querySelector('[data-role="pick"]');
        const statusEl = slot.querySelector('[data-role="status"]');

        pickBtn.addEventListener("click", () => input.click());
        input.addEventListener("change", () => uploadDocument(docType, input.files[0], statusEl));

        slot.addEventListener("dragover", (e) => e.preventDefault());
        slot.addEventListener("drop", (e) => {
            e.preventDefault();
            if (e.dataTransfer.files[0]) uploadDocument(docType, e.dataTransfer.files[0], statusEl);
        });

        docList.appendChild(slot);
    });
}

/**
 * Uploads one file for one document slot.
 */
function uploadDocument(docType, file, statusEl) {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        statusEl.textContent = "File exceeds 5MB limit.";
        statusEl.classList.add("is-error");
        return;
    }

    statusEl.textContent = "Uploading…";
    statusEl.classList.remove("is-error");

    const formData = new FormData();
    formData.append("action", "upload");
    formData.append("applicant_id", applicantId);
    formData.append("document_type_id", docType.document_type_id);
    formData.append("reference_number", referenceNumber);
    formData.append("document", file);

    fetch(DOCUMENTS_API_URL, {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(result => {
        if (!result.success) throw new Error(result.message || "Upload failed.");

        uploadedByType[docType.document_type_id] = {
            documentId: result.document_id,
            filename: file.name,
            status: result.status
        };
        statusEl.textContent = `Uploaded: ${file.name}`;
    })
    .catch(error => {
        console.error("Error uploading document:", error);
        statusEl.textContent = error.message;
        statusEl.classList.add("is-error");
    });
}

/**
 * Used by Step 5 before allowing submit — makes sure every required slot is filled.
 */
function allRequiredDocumentsUploaded() {
    return checklist
        .filter(t => t.is_required == 1)
        .every(t => uploadedByType[t.document_type_id]);
}
