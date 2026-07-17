<?php

// A class schedule: a subject taught to a section by a teacher, in a room, on a
// day and time. Maps directly to the `schedules` table columns.
class Schedule {

    private $schedule_id;
    private $section_id;
    private $subject_id;
    private $teacher_id;
    private $room_id;
    private $day_of_week;
    private $start_time;
    private $end_time;
    private $created_at;

    // ---- Getters ----
    public function getScheduleId() { return $this->schedule_id; }
    public function getSectionId()  { return $this->section_id; }
    public function getSubjectId()  { return $this->subject_id; }
    public function getTeacherId()  { return $this->teacher_id; }
    public function getRoomId()     { return $this->room_id; }
    public function getDayOfWeek()  { return $this->day_of_week; }
    public function getStartTime()  { return $this->start_time; }
    public function getEndTime()    { return $this->end_time; }
    public function getCreatedAt()  { return $this->created_at; }

    // ---- Setters ----
    public function setScheduleId($v) { $this->schedule_id = $v; }
    public function setSectionId($v)  { $this->section_id = $v; }
    public function setSubjectId($v)  { $this->subject_id = $v; }
    public function setTeacherId($v)  { $this->teacher_id = $v; }
    public function setRoomId($v)     { $this->room_id = $v; }
    public function setDayOfWeek($v)  { $this->day_of_week = $v; }
    public function setStartTime($v)  { $this->start_time = $v; }
    public function setEndTime($v)    { $this->end_time = $v; }
    public function setCreatedAt($v)  { $this->created_at = $v; }

    public static function allowedDays() {
        return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    }

    // Returns error messages; empty means valid.
    public static function validate($data) {
        $errors = [];

        if (empty($data['section_id'] ?? '')) {
            $errors[] = "Please select a section.";
        }
        if (empty($data['subject_id'] ?? '')) {
            $errors[] = "Please select a subject.";
        }
        if (empty($data['room_id'] ?? '')) {
            $errors[] = "Please select a room.";
        }
        if (!in_array($data['day_of_week'] ?? '', self::allowedDays(), true)) {
            $errors[] = "Please select a valid day.";
        }

        $start = $data['start_time'] ?? '';
        $end   = $data['end_time'] ?? '';
        if (empty($start)) $errors[] = "Start time is required.";
        if (empty($end))   $errors[] = "End time is required.";
        if (!empty($start) && !empty($end) && $start >= $end) {
            $errors[] = "End time must be after start time.";
        }
        // teacher_id is optional (a slot can be scheduled before a teacher is assigned).

        return $errors;
    }
}
?>
