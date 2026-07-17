<?php

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

    // School hours constants
    const SCHOOL_START = '09:00:00';
    const SCHOOL_END = '17:00:00';

    // Constructor
    public function __construct(
        $section_id = null,
        $subject_id = null,
        $teacher_id = null,
        $room_id = null,
        $day_of_week = null,
        $start_time = null,
        $end_time = null
    ) {
        $this->section_id = $section_id;
        $this->subject_id = $subject_id;
        $this->teacher_id = $teacher_id;
        $this->room_id = $room_id;
        $this->day_of_week = $day_of_week;
        $this->start_time = $start_time;
        $this->end_time = $end_time;
    }

    // Getters
    public function getScheduleId() {
        return $this->schedule_id;
    }

    public function getSectionId() {
        return $this->section_id;
    }

    public function getSubjectId() {
        return $this->subject_id;
    }

    public function getTeacherId() {
        return $this->teacher_id;
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

    public function setSectionId($section_id) {
        $this->section_id = $section_id;
    }

    public function setSubjectId($subject_id) {
        $this->subject_id = $subject_id;
    }

    public function setTeacherId($teacher_id) {
        $this->teacher_id = $teacher_id;
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

    // Check if time is within school hours
    public static function isWithinSchoolHours($start_time, $end_time) {
        // Convert to timestamps for comparison
        $school_start = strtotime(self::SCHOOL_START);
        $school_end = strtotime(self::SCHOOL_END);
        $start = strtotime($start_time);
        $end = strtotime($end_time);

        // Check if start time is before school starts OR end time is after school ends
        if ($start < $school_start) {
            return false;
        }
        if ($end > $school_end) {
            return false;
        }
        return true;
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

        // Validate school hours (9:00 AM - 5:00 PM)
        if (!empty($start_time) && !empty($end_time)) {
            if (!self::isWithinSchoolHours($start_time, $end_time)) {
                $errors[] = "School hours are from 9:00 AM to 5:00 PM only. Please adjust the time.";
            }
        }

        return $errors;
    }
}