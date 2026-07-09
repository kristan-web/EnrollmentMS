<?php

class ApplicantDocument {

    private $documentId;
    private $applicantId;
    private $documentTypeId;
    private $filePath;
    private $originalFilename;
    private $fileSize;
    private $mimeType;
    private $status;   // Pending | Verified | Rejected
    private $remarks;

    // ---- Getters ----
    public function getDocumentId() { return $this->documentId; }
    public function getApplicantId() { return $this->applicantId; }
    public function getDocumentTypeId() { return $this->documentTypeId; }
    public function getFilePath() { return $this->filePath; }
    public function getOriginalFilename() { return $this->originalFilename; }
    public function getFileSize() { return $this->fileSize; }
    public function getMimeType() { return $this->mimeType; }
    public function getStatus() { return $this->status; }
    public function getRemarks() { return $this->remarks; }

    // ---- Setters ----
    public function setDocumentId($documentId) { $this->documentId = $documentId; }
    public function setApplicantId($applicantId) { $this->applicantId = $applicantId; }
    public function setDocumentTypeId($documentTypeId) { $this->documentTypeId = $documentTypeId; }
    public function setFilePath($filePath) { $this->filePath = $filePath; }
    public function setOriginalFilename($originalFilename) { $this->originalFilename = $originalFilename; }
    public function setFileSize($fileSize) { $this->fileSize = $fileSize; }
    public function setMimeType($mimeType) { $this->mimeType = $mimeType; }
    public function setStatus($status) { $this->status = $status; }
    public function setRemarks($remarks) { $this->remarks = $remarks; }
}
?>
