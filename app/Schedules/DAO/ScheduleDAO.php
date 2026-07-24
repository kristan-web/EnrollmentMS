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
            s.section_id,
            s.subject_id,
            s.teacher_id,
            s.room_id,
            s.day_of_week,
            s.start_time,
            s.end_time,
            s.created_at,
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
        LEFT JOIN class_sections sec ON sec.section_id = s.section_id
        LEFT JOIN subjects sub ON sub.subject_id = s.subject_id
        LEFT JOIN teachers t ON t.teacher_id = s.teacher_id
        LEFT JOIN rooms r ON r.room_id = s.room_id
        LEFT JOIN strands st ON st.strand_id = sec.strand_id
        WHERE 1=1
        ";

        $params = [];

        // Only apply filters if they have actual values
        if (!empty($filters['keyword']) && $filters['keyword'] !== 'null') {
            $query .= " AND (
                sub.subject_code LIKE :keyword
                OR sub.subject_name LIKE :keyword
                OR sec.section_name LIKE :keyword
                OR CONCAT(t.first_name, ' ', t.last_name) LIKE :keyword
            ) ";
            $params[':keyword'] = "%" . $filters['keyword'] . "%";
        }

        if (!empty($filters['section_id']) && $filters['section_id'] !== 'null') {
            $query .= " AND s.section_id = :section_id ";
            $params[':section_id'] = $filters['section_id'];
        }

        if (!empty($filters['term']) && $filters['term'] !== 'null') {
            $query .= " AND sub.semester = :term ";
            $params[':term'] = $filters['term'];
        }

        if (!empty($filters['teacher_id']) && $filters['teacher_id'] !== 'null') {
            $query .= " AND s.teacher_id = :teacher_id ";
            $params[':teacher_id'] = $filters['teacher_id'];
        }

        if (!empty($filters['day_of_week']) && $filters['day_of_week'] !== 'null') {
            $query .= " AND s.day_of_week = :day_of_week ";
            $params[':day_of_week'] = $filters['day_of_week'];
        }

        $query .= " ORDER BY FIELD(s.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'), s.start_time ";

        // Debug: Log the query
        error_log("=== getAll QUERY ===");
        error_log("Query: " . $query);
        error_log("Params: " . print_r($params, true));

        $stmt = $this->conn->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Debug: Log results
        error_log("Results found: " . count($results));
        if (count($results) > 0) {
            error_log("First result: " . print_r($results[0], true));
        } else {
            error_log("No results found. Checking if query returned false...");
            error_log("Results type: " . gettype($results));
        }
        
        return $results;
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
            sub.semester,
            t.first_name AS teacher_first_name,
            t.last_name AS teacher_last_name,
            r.room_name
        FROM schedules s
        INNER JOIN subjects sub ON sub.subject_id = s.subject_id
        INNER JOIN class_sections sec ON sec.section_id = s.section_id
        LEFT JOIN teachers t ON t.teacher_id = s.teacher_id
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
        SELECT COUNT(*) FROM schedules
        WHERE section_id = :section_id
        AND day_of_week = :day_of_week
        AND (
            (start_time < :end_time AND end_time > :start_time)
        )
        ";

        if ($excludeId) {
            $query .= " AND schedule_id != :exclude_id ";
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
        SELECT COUNT(*) FROM schedules
        WHERE teacher_id = :teacher_id
        AND day_of_week = :day_of_week
        AND (
            (start_time < :end_time AND end_time > :start_time)
        )
        ";

        if ($excludeId) {
            $query .= " AND schedule_id != :exclude_id ";
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

    /**
     * Check if a section already has the same subject on the same day
     * This prevents duplicate subjects for the same section on the same day
     */
    public function checkDuplicateSubject($sectionId, $subjectId, $dayOfWeek, $excludeId = null) {
        $query = "
        SELECT COUNT(*) FROM schedules
        WHERE section_id = :section_id
        AND subject_id = :subject_id
        AND day_of_week = :day_of_week
        ";

        if ($excludeId) {
            $query .= " AND schedule_id != :exclude_id ";
        }

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':section_id', $sectionId);
        $stmt->bindValue(':subject_id', $subjectId);
        $stmt->bindValue(':day_of_week', $dayOfWeek);
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
            section_id,
            subject_id,
            teacher_id,
            room_id,
            day_of_week,
            start_time,
            end_time
        )
        VALUES
        (
            :section_id,
            :subject_id,
            :teacher_id,
            :room_id,
            :day_of_week,
            :start_time,
            :end_time
        )
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':section_id', $schedule->getSectionId());
        $stmt->bindValue(':subject_id', $schedule->getSubjectId());
        $stmt->bindValue(':teacher_id', $schedule->getTeacherId());
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
        $stmt->bindValue(':schedule_id', $schedule->getScheduleId());
        $stmt->bindValue(':section_id', $schedule->getSectionId());
        $stmt->bindValue(':subject_id', $schedule->getSubjectId());
        $stmt->bindValue(':teacher_id', $schedule->getTeacherId());
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

        // Only filter by term if provided
        if ($term && $term !== 'null' && $term !== '') {
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

    // GET ALL TEACHERS (for dropdown)
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

    // TEMPORARY DEBUG METHOD - Check all schedules
    public function debugGetAllSchedules() {
        $query = "SELECT * FROM schedules";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}