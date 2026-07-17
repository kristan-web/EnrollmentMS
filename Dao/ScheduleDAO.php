<?php

require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../Models/schedule_model.php";

// Data access for class schedules.
//
// The `schedules` table links a section + subject + teacher + room to a day and
// time slot directly (section_id, subject_id, teacher_id, room_id). There is no
// class_subjects junction table in this schema, so every query joins those
// tables straight off the schedule row.
class ScheduleDAO {

    private $conn;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->connect();
    }

    // The one row-shape every list/detail view uses.
    private function selectColumns() {
        return "
            s.schedule_id, s.section_id, s.subject_id, s.teacher_id, s.room_id,
            s.day_of_week, s.start_time, s.end_time, s.created_at,
            sec.section_name, sec.grade_level, sec.school_year,
            sub.subject_code, sub.subject_name, sub.subject_type, sub.semester,
            t.first_name AS teacher_first_name, t.last_name AS teacher_last_name,
            r.room_name, r.building,
            st.strand_code, st.strand_name
        ";
    }

    private function fromJoins() {
        return "
        FROM schedules s
        INNER JOIN class_sections sec ON sec.section_id = s.section_id
        INNER JOIN subjects sub ON sub.subject_id = s.subject_id
        INNER JOIN strands st ON st.strand_id = sec.strand_id
        LEFT JOIN teachers t ON t.teacher_id = s.teacher_id
        INNER JOIN rooms r ON r.room_id = s.room_id
        ";
    }

    // LIST with optional filters.
    public function getAll($filters = []) {
        $query = "SELECT " . $this->selectColumns() . $this->fromJoins() . " WHERE 1 = 1 ";
        $params = [];

        if (!empty($filters["keyword"])) {
            $query .= " AND (
                sub.subject_code LIKE :keyword
                OR sub.subject_name LIKE :keyword
                OR sec.section_name LIKE :keyword
                OR CONCAT(t.first_name, ' ', t.last_name) LIKE :keyword
            ) ";
            $params[":keyword"] = "%" . $filters["keyword"] . "%";
        }
        if (!empty($filters["section_id"])) {
            $query .= " AND s.section_id = :section_id ";
            $params[":section_id"] = $filters["section_id"];
        }
        if (!empty($filters["term"])) {
            $query .= " AND sub.semester = :term ";
            $params[":term"] = $filters["term"];
        }
        if (!empty($filters["teacher_id"])) {
            $query .= " AND s.teacher_id = :teacher_id ";
            $params[":teacher_id"] = $filters["teacher_id"];
        }
        if (!empty($filters["day_of_week"])) {
            $query .= " AND s.day_of_week = :day_of_week ";
            $params[":day_of_week"] = $filters["day_of_week"];
        }

        // Monday..Sunday, then by start time.
        $query .= " ORDER BY FIELD(s.day_of_week,'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'), s.start_time ";

        $stmt = $this->conn->prepare($query);
        foreach ($params as $k => $v) $stmt->bindValue($k, $v);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById($id) {
        $query = "SELECT " . $this->selectColumns() . $this->fromJoins() . " WHERE s.schedule_id = :id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":id", $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // All schedules for one section (for the printable timetable). $term filters
    // by the subject's semester.
    public function getBySection($sectionId, $term = null) {
        $query = "SELECT " . $this->selectColumns() . $this->fromJoins() . " WHERE s.section_id = :section_id ";
        if ($term) $query .= " AND sub.semester = :term ";
        $query .= " ORDER BY FIELD(s.day_of_week,'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'), s.start_time ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":section_id", $sectionId);
        if ($term) $stmt->bindValue(":term", $term);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // ---- Conflict checks (time overlap on the same day) --------------------

    private function overlaps($column, $id, $dayOfWeek, $startTime, $endTime, $excludeId) {
        $query = "
        SELECT COUNT(*) FROM schedules
        WHERE $column = :id
          AND day_of_week = :day_of_week
          AND (start_time < :end_time AND end_time > :start_time)
        ";
        if ($excludeId) $query .= " AND schedule_id <> :exclude_id ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":id", $id);
        $stmt->bindValue(":day_of_week", $dayOfWeek);
        $stmt->bindValue(":start_time", $startTime);
        $stmt->bindValue(":end_time", $endTime);
        if ($excludeId) $stmt->bindValue(":exclude_id", $excludeId);
        $stmt->execute();
        return $stmt->fetchColumn() > 0;
    }

    public function checkSectionConflict($sectionId, $dayOfWeek, $startTime, $endTime, $excludeId = null) {
        return $this->overlaps("section_id", $sectionId, $dayOfWeek, $startTime, $endTime, $excludeId);
    }

    public function checkTeacherConflict($teacherId, $dayOfWeek, $startTime, $endTime, $excludeId = null) {
        return $this->overlaps("teacher_id", $teacherId, $dayOfWeek, $startTime, $endTime, $excludeId);
    }

    public function checkRoomConflict($roomId, $dayOfWeek, $startTime, $endTime, $excludeId = null) {
        return $this->overlaps("room_id", $roomId, $dayOfWeek, $startTime, $endTime, $excludeId);
    }

    // ---- Writes ------------------------------------------------------------

    public function insert(Schedule $s) {
        $query = "
        INSERT INTO schedules (section_id, subject_id, teacher_id, room_id, day_of_week, start_time, end_time)
        VALUES (:section_id, :subject_id, :teacher_id, :room_id, :day_of_week, :start_time, :end_time)
        ";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":section_id", $s->getSectionId());
        $stmt->bindValue(":subject_id", $s->getSubjectId());
        $stmt->bindValue(":teacher_id", $s->getTeacherId() ?: null);
        $stmt->bindValue(":room_id", $s->getRoomId());
        $stmt->bindValue(":day_of_week", $s->getDayOfWeek());
        $stmt->bindValue(":start_time", $s->getStartTime());
        $stmt->bindValue(":end_time", $s->getEndTime());
        return $stmt->execute();
    }

    public function update(Schedule $s) {
        $query = "
        UPDATE schedules SET
            section_id = :section_id,
            subject_id = :subject_id,
            teacher_id = :teacher_id,
            room_id = :room_id,
            day_of_week = :day_of_week,
            start_time = :start_time,
            end_time = :end_time
        WHERE schedule_id = :schedule_id
        ";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(":schedule_id", $s->getScheduleId());
        $stmt->bindValue(":section_id", $s->getSectionId());
        $stmt->bindValue(":subject_id", $s->getSubjectId());
        $stmt->bindValue(":teacher_id", $s->getTeacherId() ?: null);
        $stmt->bindValue(":room_id", $s->getRoomId());
        $stmt->bindValue(":day_of_week", $s->getDayOfWeek());
        $stmt->bindValue(":start_time", $s->getStartTime());
        $stmt->bindValue(":end_time", $s->getEndTime());
        return $stmt->execute();
    }

    public function delete($id) {
        $stmt = $this->conn->prepare("DELETE FROM schedules WHERE schedule_id = :id");
        $stmt->bindValue(":id", $id);
        return $stmt->execute();
    }

    // ---- Lookups for the Add/Edit form -------------------------------------

    public function getAllSections() {
        $query = "
        SELECT sec.section_id, sec.section_name, sec.grade_level, sec.school_year,
               st.strand_code, st.strand_name
        FROM class_sections sec
        JOIN strands st ON st.strand_id = sec.strand_id
        WHERE sec.status <> 'Cancelled'
        ORDER BY sec.section_name
        ";
        return $this->conn->query($query)->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getAllRooms() {
        return $this->conn->query("SELECT room_id, room_name, building, capacity FROM rooms ORDER BY room_name")->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getAllTeachers() {
        return $this->conn->query("SELECT teacher_id, first_name, last_name FROM teachers WHERE status = 'Active' ORDER BY last_name, first_name")->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getAllSubjects() {
        return $this->conn->query("
            SELECT subject_id, subject_code, subject_name, subject_type, grade_level, semester
            FROM subjects
            WHERE status = 'Active'
            ORDER BY grade_level, semester, subject_name
        ")->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>
