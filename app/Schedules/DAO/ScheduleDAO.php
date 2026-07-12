<?php

require_once __DIR__."/../../../config/db.php";
require_once __DIR__."/../Model/schedule_model.php";

class ScheduleDAO {

    private $conn;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->connect();
    }

    // GET ALL SCHEDULES with related data
    public function getAll($filters = []) {
        $query = "
        SELECT 
            s.schedule_id,
            s.class_subject_id,
            s.room_id,
            s.day_of_week,
            s.start_time,
            s.end_time,
            s.created_at,
            cs.section_id,
            cs.subject_id,
            cs.teacher_id,
            sec.section_name,
            sec.grade_level,
            sec.school_year,
            sub.subject_code,
            sub.subject_name,
            sub.subject_type,
            sub.semester,
            t.first_name AS teacher_first_name,
            t.last_name AS teacher_last_name,
            r.room_name,
            r.building,
            st.strand_code,
            st.strand_name
        FROM schedules s
        INNER JOIN class_subjects cs ON cs.class_subject_id = s.class_subject_id
        INNER JOIN class_sections sec ON sec.section_id = cs.section_id
        INNER JOIN subjects sub ON sub.subject_id = cs.subject_id
        INNER JOIN strands st ON st.strand_id = sec.strand_id
        LEFT JOIN teachers t ON t.teacher_id = cs.teacher_id
        INNER JOIN rooms r ON r.room_id = s.room_id
        WHERE 1=1
        ";

        $params = [];

        if (!empty($filters['keyword'])) {
            $query .= " AND (
                sub.subject_code LIKE :keyword
                OR sub.subject_name LIKE :keyword
                OR sec.section_name LIKE :keyword
                OR CONCAT(t.first_name, ' ', t.last_name) LIKE :keyword
            ) ";
            $params[':keyword'] = "%" . $filters['keyword'] . "%";
        }

        if (!empty($filters['section_id'])) {
            $query .= " AND sec.section_id = :section_id ";
            $params[':section_id'] = $filters['section_id'];
        }

        if (!empty($filters['term'])) {
            $query .= " AND sub.semester = :term ";
            $params[':term'] = $filters['term'];
        }

        if (!empty($filters['teacher_id'])) {
            $query .= " AND cs.teacher_id = :teacher_id ";
            $params[':teacher_id'] = $filters['teacher_id'];
        }

        if (!empty($filters['day_of_week'])) {
            $query .= " AND s.day_of_week = :day_of_week ";
            $params[':day_of_week'] = $filters['day_of_week'];
        }

        $query .= " ORDER BY s.day_of_week, s.start_time ";

        $stmt = $this->conn->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // GET SCHEDULE BY ID
    public function getById($id) {
        $query = "
        SELECT * FROM schedules WHERE schedule_id = :id
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':id', $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // GET SCHEDULES FOR A SECTION
    public function getBySection($sectionId, $term = null) {
        $query = "
        SELECT 
            s.*,
            sub.subject_code,
            sub.subject_name,
            sub.subject_type,
            t.first_name AS teacher_first_name,
            t.last_name AS teacher_last_name,
            r.room_name
        FROM schedules s
        INNER JOIN class_subjects cs ON cs.class_subject_id = s.class_subject_id
        INNER JOIN subjects sub ON sub.subject_id = cs.subject_id
        INNER JOIN class_sections sec ON sec.section_id = cs.section_id
        LEFT JOIN teachers t ON t.teacher_id = cs.teacher_id
        INNER JOIN rooms r ON r.room_id = s.room_id
        WHERE sec.section_id = :section_id
        ";

        if ($term) {
            $query .= " AND sub.semester = :term ";
        }

        $query .= " ORDER BY s.day_of_week, s.start_time ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':section_id', $sectionId);
        if ($term) {
            $stmt->bindValue(':term', $term);
        }
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // CHECK CONFLICT - SECTION
    public function checkSectionConflict($sectionId, $dayOfWeek, $startTime, $endTime, $excludeId = null) {
        $query = "
        SELECT COUNT(*) FROM schedules s
        INNER JOIN class_subjects cs ON cs.class_subject_id = s.class_subject_id
        WHERE cs.section_id = :section_id
        AND s.day_of_week = :day_of_week
        AND (
            (s.start_time < :end_time AND s.end_time > :start_time)
        )
        ";

        if ($excludeId) {
            $query .= " AND s.schedule_id != :exclude_id ";
        }

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':section_id', $sectionId);
        $stmt->bindValue(':day_of_week', $dayOfWeek);
        $stmt->bindValue(':start_time', $startTime);
        $stmt->bindValue(':end_time', $endTime);
        if ($excludeId) {
            $stmt->bindValue(':exclude_id', $excludeId);
        }
        $stmt->execute();
        return $stmt->fetchColumn() > 0;
    }

    // CHECK CONFLICT - TEACHER
    public function checkTeacherConflict($teacherId, $dayOfWeek, $startTime, $endTime, $excludeId = null) {
        $query = "
        SELECT COUNT(*) FROM schedules s
        INNER JOIN class_subjects cs ON cs.class_subject_id = s.class_subject_id
        WHERE cs.teacher_id = :teacher_id
        AND s.day_of_week = :day_of_week
        AND (
            (s.start_time < :end_time AND s.end_time > :start_time)
        )
        ";

        if ($excludeId) {
            $query .= " AND s.schedule_id != :exclude_id ";
        }

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':teacher_id', $teacherId);
        $stmt->bindValue(':day_of_week', $dayOfWeek);
        $stmt->bindValue(':start_time', $startTime);
        $stmt->bindValue(':end_time', $endTime);
        if ($excludeId) {
            $stmt->bindValue(':exclude_id', $excludeId);
        }
        $stmt->execute();
        return $stmt->fetchColumn() > 0;
    }

    // CHECK CONFLICT - ROOM
    public function checkRoomConflict($roomId, $dayOfWeek, $startTime, $endTime, $excludeId = null) {
        $query = "
        SELECT COUNT(*) FROM schedules
        WHERE room_id = :room_id
        AND day_of_week = :day_of_week
        AND (
            (start_time < :end_time AND end_time > :start_time)
        )
        ";

        if ($excludeId) {
            $query .= " AND schedule_id != :exclude_id ";
        }

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':room_id', $roomId);
        $stmt->bindValue(':day_of_week', $dayOfWeek);
        $stmt->bindValue(':start_time', $startTime);
        $stmt->bindValue(':end_time', $endTime);
        if ($excludeId) {
            $stmt->bindValue(':exclude_id', $excludeId);
        }
        $stmt->execute();
        return $stmt->fetchColumn() > 0;
    }

    // INSERT SCHEDULE
    public function insert(Schedule $schedule) {
        $query = "
        INSERT INTO schedules
        (
            class_subject_id,
            room_id,
            day_of_week,
            start_time,
            end_time
        )
        VALUES
        (
            :class_subject_id,
            :room_id,
            :day_of_week,
            :start_time,
            :end_time
        )
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':class_subject_id', $schedule->getClassSubjectId());
        $stmt->bindValue(':room_id', $schedule->getRoomId());
        $stmt->bindValue(':day_of_week', $schedule->getDayOfWeek());
        $stmt->bindValue(':start_time', $schedule->getStartTime());
        $stmt->bindValue(':end_time', $schedule->getEndTime());
        return $stmt->execute();
    }

    // UPDATE SCHEDULE
    public function update(Schedule $schedule) {
        $query = "
        UPDATE schedules SET
            class_subject_id = :class_subject_id,
            room_id = :room_id,
            day_of_week = :day_of_week,
            start_time = :start_time,
            end_time = :end_time
        WHERE schedule_id = :schedule_id
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':schedule_id', $schedule->getScheduleId());
        $stmt->bindValue(':class_subject_id', $schedule->getClassSubjectId());
        $stmt->bindValue(':room_id', $schedule->getRoomId());
        $stmt->bindValue(':day_of_week', $schedule->getDayOfWeek());
        $stmt->bindValue(':start_time', $schedule->getStartTime());
        $stmt->bindValue(':end_time', $schedule->getEndTime());
        return $stmt->execute();
    }

    // DELETE SCHEDULE
    public function delete($id) {
        $query = "DELETE FROM schedules WHERE schedule_id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':id', $id);
        return $stmt->execute();
    }

    // GET SECTION INFO (grade_level + strand_id) - used to filter subjects
    public function getSectionInfo($sectionId) {
        $query = "
        SELECT section_id, strand_id, grade_level, school_year
        FROM class_sections
        WHERE section_id = :id
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':id', $sectionId);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // GET SUBJECTS APPLICABLE TO A SECTION
    // Matches the section's grade level, and either the section's own
    // strand or a "common" subject (strand_id IS NULL applies to every
    // strand). Optionally narrowed further by term/semester.
    public function getSubjectsForSection($sectionId, $term = null) {
        $section = $this->getSectionInfo($sectionId);
        if (!$section) {
            return [];
        }

        $query = "
        SELECT subject_id, subject_code, subject_name, subject_type, grade_level, semester, units
        FROM subjects
        WHERE status = 'Active'
        AND grade_level = :grade_level
        AND (strand_id = :strand_id OR strand_id IS NULL)
        ";

        $params = [
            ':grade_level' => $section['grade_level'],
            ':strand_id' => $section['strand_id'],
        ];

        if ($term) {
            $query .= " AND semester = :term ";
            $params[':term'] = $term;
        }

        $query .= " ORDER BY subject_type, subject_name ";

        $stmt = $this->conn->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // FIND OR CREATE THE class_subjects LINK ROW for (section, subject)
    // The Schedule form now picks straight from the official `subjects`
    // table plus a teacher; this quietly creates/reuses the linking row
    // instead of requiring it to be set up separately beforehand.
    public function findOrCreateClassSubject($sectionId, $subjectId, $teacherId = null) {
        $query = "
        SELECT class_subject_id FROM class_subjects
        WHERE section_id = :section_id AND subject_id = :subject_id
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':section_id', $sectionId);
        $stmt->bindValue(':subject_id', $subjectId);
        $stmt->execute();
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            // Keep the teacher assignment in sync in case it was changed
            $update = $this->conn->prepare("
                UPDATE class_subjects SET teacher_id = :teacher_id
                WHERE class_subject_id = :id
            ");
            $update->bindValue(':teacher_id', $teacherId);
            $update->bindValue(':id', $existing['class_subject_id']);
            $update->execute();

            return $existing['class_subject_id'];
        }

        $insert = $this->conn->prepare("
            INSERT INTO class_subjects (section_id, subject_id, teacher_id)
            VALUES (:section_id, :subject_id, :teacher_id)
        ");
        $insert->bindValue(':section_id', $sectionId);
        $insert->bindValue(':subject_id', $subjectId);
        $insert->bindValue(':teacher_id', $teacherId);
        $insert->execute();

        return $this->conn->lastInsertId();
    }

    // GET ALL CLASS SUBJECTS (for dropdown)
    public function getAllClassSubjects($filters = []) {
        $query = "
        SELECT 
            cs.class_subject_id,
            cs.section_id,
            cs.subject_id,
            cs.teacher_id,
            sec.section_name,
            sec.grade_level,
            sec.school_year,
            sub.subject_code,
            sub.subject_name,
            sub.subject_type,
            sub.semester,
            t.first_name AS teacher_first_name,
            t.last_name AS teacher_last_name,
            st.strand_code,
            st.strand_name
        FROM class_subjects cs
        INNER JOIN class_sections sec ON sec.section_id = cs.section_id
        INNER JOIN subjects sub ON sub.subject_id = cs.subject_id
        INNER JOIN strands st ON st.strand_id = sec.strand_id
        LEFT JOIN teachers t ON t.teacher_id = cs.teacher_id
        WHERE 1=1
        ";

        $params = [];

        if (!empty($filters['section_id'])) {
            $query .= " AND cs.section_id = :section_id ";
            $params[':section_id'] = $filters['section_id'];
        }

        if (!empty($filters['term'])) {
            $query .= " AND sub.semester = :term ";
            $params[':term'] = $filters['term'];
        }

        $query .= " ORDER BY sec.section_name, sub.subject_code ";

        $stmt = $this->conn->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // GET ALL SECTIONS (for filter dropdown)
    public function getAllSections() {
        $query = "
        SELECT section_id, section_name, grade_level, school_year
        FROM class_sections
        WHERE status = 'Open' OR status = 'Closed'
        ORDER BY section_name
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // GET ALL ROOMS (for dropdown)
    public function getAllRooms() {
        $query = "
        SELECT room_id, room_name, building, capacity
        FROM rooms
        ORDER BY building, room_name
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // GET ALL TEACHERS (for filter dropdown)
    public function getAllTeachers() {
        $query = "
        SELECT teacher_id, first_name, last_name
        FROM teachers
        WHERE status = 'Active'
        ORDER BY last_name, first_name
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // GET CLASS SUBJECT BY ID
    public function getClassSubjectById($id) {
        $query = "
        SELECT * FROM class_subjects WHERE class_subject_id = :id
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':id', $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}