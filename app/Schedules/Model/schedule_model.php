<?php

class Schedule {

    private $schedule_id;
    private $class_subject_id;
    private $room_id;
    private $day_of_week;
    private $start_time;
    private $end_time;
    private $created_at;

    // Constructor
    public function __construct(
        $class_subject_id = null,
        $room_id = null,
        $day_of_week = null,
        $start_time = null,
        $end_time = null
    ) {
        $this->class_subject_id = $class_subject_id;
        $this->room_id = $room_id;
        $this->day_of_week = $day_of_week;
        $this->start_time = $start_time;
        $this->end_time = $end_time;
    }

    // Getters
    public function getScheduleId() {
        return $this->schedule_id;
    }

    public function getClassSubjectId() {
        return $this->class_subject_id;
    }

    public function getRoomId() {
        return $this->room_id;
    }

    public function getDayOfWeek() {
        return $this->day_of_week;
    }

    public function getStartTime() {
        return $this->start_time;
    }

    public function getEndTime() {
        return $this->end_time;
    }

    public function getCreatedAt() {
        return $this->created_at;
    }

    // Setters
    public function setScheduleId($schedule_id) {
        $this->schedule_id = $schedule_id;
    }

    public function setClassSubjectId($class_subject_id) {
        $this->class_subject_id = $class_subject_id;
    }

    public function setRoomId($room_id) {
        $this->room_id = $room_id;
    }

    public function setDayOfWeek($day_of_week) {
        $this->day_of_week = $day_of_week;
    }

    public function setStartTime($start_time) {
        $this->start_time = $start_time;
    }

    public function setEndTime($end_time) {
        $this->end_time = $end_time;
    }

    public function setCreatedAt($created_at) {
        $this->created_at = $created_at;
    }

    // Allowed days of week
    public static function allowedDays() {
        return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    }

    // Validation
    public static function validate($data) {
        $errors = [];

        $section_id = $data['section_id'] ?? '';
        $subject_id = $data['subject_id'] ?? '';
        $teacher_id = $data['teacher_id'] ?? '';
        $room_id = $data['room_id'] ?? '';
        $day_of_week = $data['day_of_week'] ?? '';
        $start_time = $data['start_time'] ?? '';
        $end_time = $data['end_time'] ?? '';

        if (empty($section_id)) {
            $errors[] = "Please select a section.";
        }

        if (empty($subject_id)) {
            $errors[] = "Please select a subject.";
        }

        if (empty($teacher_id)) {
            $errors[] = "Please select a teacher.";
        }

        if (empty($room_id)) {
            $errors[] = "Please select a room.";
        }

        if (!in_array($day_of_week, self::allowedDays(), true)) {
            $errors[] = "Please select a valid day.";
        }

        if (empty($start_time)) {
            $errors[] = "Start time is required.";
        }

        if (empty($end_time)) {
            $errors[] = "End time is required.";
        }

        if (!empty($start_time) && !empty($end_time) && $start_time >= $end_time) {
            $errors[] = "End time must be after start time.";
        }

        return $errors;
    }
}