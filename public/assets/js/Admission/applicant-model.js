(function () {
  const APPLICANTS_KEY = "ems_applicants";
  const DOCS_KEY = "ems_applicant_docs";
  const DOC_TYPES_KEY = "ems_document_types";
  const REF_SEQ_KEY = "ems_applicant_ref_seq";
  const STUDENTS_KEY = "ems_students";
  const ENROLL_KEY = "ems_enrollments";
  const STRANDS_KEY = "ems_strands";
  const SY_KEY = "ems_school_years";

  const MAX_FILE_BYTES = 500 * 1024;
  const ALLOWED_TYPES = ["image/jpeg", "image/png"];

  const DEFAULT_DOC_TYPES = [
    { name: "Form 138 (Report Card)", description: "Grade 10 report card from your previous school.", applicantType: "All", isRequired: true, sortOrder: 1 },
    { name: "Certificate of Good Moral Character", description: "Issued by your previous school.", applicantType: "All", isRequired: true, sortOrder: 2 },
    { name: "PSA Birth Certificate", description: "Clear photo or scan of the photocopy.", applicantType: "All", isRequired: true, sortOrder: 3 },
    { name: "2x2 ID Photo", description: "Recent photo with a white background.", applicantType: "All", isRequired: true, sortOrder: 4 },
    { name: "Certificate of Transfer / Honorable Dismissal", description: "Clearance from your previous school.", applicantType: "Transferee", isRequired: true, sortOrder: 5 }
  ];

  const DEFAULT_STRANDS = [
    { code: "STEM", name: "Science, Technology, Engineering, and Mathematics" },
    { code: "ABM", name: "Accountancy, Business, and Management" },
    { code: "HUMSS", name: "Humanities and Social Sciences" },
    { code: "GAS", name: "General Academic Strand" },
    { code: "TVL", name: "Technical-Vocational-Livelihood" }
  ];

  function loadJson(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      return [];
    }
  }

  function persist(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function makeId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function documentTypes() {
    let types = loadJson(DOC_TYPES_KEY);
    if (!types.length) {
      types = DEFAULT_DOC_TYPES.map((t, i) => ({ id: "dt" + (i + 1), isActive: true, ...t }));
      persist(DOC_TYPES_KEY, types);
    }
    return types;
  }

  function requirementsFor(applicantType) {
    return documentTypes()
      .filter((t) => t.isActive && (t.applicantType === "All" || t.applicantType === applicantType))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  function strandOptions() {
    const stored = loadJson(STRANDS_KEY);
    const list = stored.length ? stored : DEFAULT_STRANDS;
    return list
      .map((s) => ({ code: s.code, name: s.name }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }

  function activeSchoolYear() {
    const active = loadJson(SY_KEY).find((y) => y.status === "active");
    if (active) return active.year;
    const year = new Date().getFullYear();
    return `${year}-${year + 1}`;
  }

  function nextReference() {
    const seq = parseInt(localStorage.getItem(REF_SEQ_KEY) || "0", 10) + 1;
    localStorage.setItem(REF_SEQ_KEY, String(seq));
    return `APP-${new Date().getFullYear()}-${String(seq).padStart(6, "0")}`;
  }

  function applicants() {
    return loadJson(APPLICANTS_KEY);
  }

  function documents() {
    return loadJson(DOCS_KEY);
  }

  function getApplicant(id) {
    return applicants().find((a) => a.id === id) || null;
  }

  function documentsFor(applicantId) {
    return documents().filter((d) => d.applicantId === applicantId);
  }

  function validateFile(file) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Only JPG or PNG images are accepted.";
    }
    if (file.size > MAX_FILE_BYTES) {
      return `File is too large. Maximum size is ${Math.round(MAX_FILE_BYTES / 1024)} KB.`;
    }
    return "";
  }

  function submitApplication(data, files) {
    const list = applicants();
    const duplicate = list.some((a) =>
      a.status !== "Rejected" &&
      a.email.toLowerCase() === data.email.toLowerCase() &&
      a.schoolYear === data.schoolYear
    );
    if (duplicate) {
      throw new Error(`An application under this email already exists for S.Y. ${data.schoolYear}. Use the Check Status page to track it.`);
    }

    const record = {
      id: makeId(),
      referenceNumber: nextReference(),
      status: "Pending",
      rejectionReason: "",
      reviewedAt: null,
      convertedStudentId: null,
      submittedAt: new Date().toISOString(),
      ...data
    };

    const docs = documents();
    for (const f of files) {
      docs.push({
        id: makeId(),
        applicantId: record.id,
        documentTypeId: f.documentTypeId,
        documentTypeName: f.documentTypeName,
        fileName: f.fileName,
        fileSize: f.fileSize,
        mimeType: f.mimeType,
        dataUrl: f.dataUrl,
        status: "Pending",
        remarks: "",
        uploadedAt: record.submittedAt
      });
    }

    try {
      persist(DOCS_KEY, docs);
    } catch {
      throw new Error("Your uploads exceed the available storage. Please use smaller image files and try again.");
    }
    list.push(record);
    persist(APPLICANTS_KEY, list);
    return record;
  }

  function findByReference(referenceNumber, email) {
    return applicants().find((a) =>
      a.referenceNumber.toUpperCase() === referenceNumber.trim().toUpperCase() &&
      a.email.toLowerCase() === email.trim().toLowerCase()
    ) || null;
  }

  function effectiveStatus(app) {
    if (app.status === "Approved" && app.convertedStudentId) {
      const enrolled = loadJson(ENROLL_KEY).some((e) =>
        e.studentId === app.convertedStudentId && e.status === "Enrolled"
      );
      if (enrolled) return "Enrolled";
    }
    return app.status;
  }

  function update(id, changes) {
    const list = applicants();
    const app = list.find((a) => a.id === id);
    if (!app) return null;
    Object.assign(app, changes);
    persist(APPLICANTS_KEY, list);
    return app;
  }

  function markUnderReview(id) {
    const app = getApplicant(id);
    if (app && app.status === "Pending") {
      update(id, { status: "Under Review" });
    }
  }

  function setDocumentStatus(docId, status, remarks) {
    const docs = documents();
    const doc = docs.find((d) => d.id === docId);
    if (!doc) return null;
    doc.status = status;
    doc.remarks = remarks || "";
    persist(DOCS_KEY, docs);
    return doc;
  }

  function missingRequirements(app) {
    const docs = documentsFor(app.id);
    return requirementsFor(app.applicantType)
      .filter((t) => t.isRequired)
      .filter((t) => !docs.some((d) => d.documentTypeId === t.id && d.status === "Verified"));
  }

  function computeAge(birthDate) {
    if (!birthDate) return "";
    const dob = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age >= 0 ? String(age) : "";
  }

  function approve(id) {
    const app = getApplicant(id);
    if (!app) throw new Error("Application not found.");
    if (missingRequirements(app).length) {
      throw new Error("All required documents must be verified before approving.");
    }

    const students = loadJson(STUDENTS_KEY);
    let student = app.convertedStudentId
      ? students.find((s) => s.id === app.convertedStudentId)
      : null;

    if (!student) {
      student = {
        id: makeId(),
        status: "active",
        studentType: app.applicantType,
        lastName: app.lastName,
        firstName: app.firstName,
        middleName: app.middleName || "",
        birthDate: app.birthDate,
        age: computeAge(app.birthDate),
        birthPlace: "",
        contact: app.contact || "",
        gender: app.gender,
        maritalStatus: "Single",
        citizenship: "Filipino",
        religion: "",
        address: app.address,
        fatherName: app.fatherName || "",
        fatherOccupation: "",
        motherName: app.motherName || "",
        motherOccupation: "",
        parentAddress: app.address,
        lrn: app.lrn || ""
      };
      students.push(student);
      persist(STUDENTS_KEY, students);
    }

    update(id, {
      status: "Approved",
      convertedStudentId: student.id,
      reviewedAt: new Date().toISOString(),
      rejectionReason: ""
    });
    return student;
  }

  function reject(id, reason) {
    return update(id, {
      status: "Rejected",
      rejectionReason: reason || "",
      reviewedAt: new Date().toISOString()
    });
  }

  window.ApplicantModel = {
    MAX_FILE_BYTES,
    ALLOWED_TYPES,
    documentTypes,
    requirementsFor,
    strandOptions,
    activeSchoolYear,
    applicants,
    getApplicant,
    documentsFor,
    validateFile,
    submitApplication,
    findByReference,
    effectiveStatus,
    markUnderReview,
    setDocumentStatus,
    missingRequirements,
    computeAge,
    approve,
    reject
  };
})();
