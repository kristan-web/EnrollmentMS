<?php
// Validation for staff-account create / edit. Kept out of the controller, like
// Enrollment::validate() elsewhere in the project.

require_once __DIR__ . "/../../Dao/staff/StaffDAO.php";

class StaffAccount {

    // Returns error messages; empty means valid. $isEdit skips the password
    // rules (password is only set on create or via a separate reset).
    public static function validate($d, $isEdit = false) {
        $errors = [];

        if (trim((string) ($d["full_name"] ?? "")) === "") {
            $errors[] = "Full name is required.";
        }
        if (empty($d["email"] ?? "") || !filter_var($d["email"], FILTER_VALIDATE_EMAIL)) {
            $errors[] = "A valid email address is required.";
        }
        if (!in_array($d["role"] ?? "", StaffDAO::ROLES, true)) {
            $errors[] = "Select a valid role.";
        }

        if (!$isEdit) {
            $pw = (string) ($d["password"] ?? "");
            if (strlen($pw) < 8 || strlen($pw) > 64) {
                $errors[] = "Password must be 8 to 64 characters.";
            }
        }

        return $errors;
    }

    // For the standalone password reset.
    public static function validatePassword($pw) {
        $errors = [];
        if (strlen((string) $pw) < 8 || strlen((string) $pw) > 64) {
            $errors[] = "Password must be 8 to 64 characters.";
        }
        return $errors;
    }
}
?>
