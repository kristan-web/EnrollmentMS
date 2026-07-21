<?php
// Data access for the audit log. record() is called (additively) wherever a
// staff account is created/changed and on admin-console login; getAll() feeds
// the "View audit logs" page.

$projectFilePath = "C:/xampp/htdocs/EnrollmentMS";

require_once "$projectFilePath/config/db.php";

class AuditDAO {

    private $conn;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->connect();
    }

    // Write one audit entry. Never throws — a failed log must not break the
    // action it was recording.
    public function record($actorId, $actorName, $actorRole, $action, $entity = null, $entityId = null, $details = null, $ip = null) {
        if (!$this->conn) return false;

        $query = "
        INSERT INTO audit_logs
            (actor_id, actor_name, actor_role, action, entity, entity_id, details, ip_address)
        VALUES
            (:actor_id, :actor_name, :actor_role, :action, :entity, :entity_id, :details, :ip)
        ";
        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(":actor_id", $actorId ?: null);
            $stmt->bindValue(":actor_name", $actorName);
            $stmt->bindValue(":actor_role", $actorRole);
            $stmt->bindValue(":action", $action);
            $stmt->bindValue(":entity", $entity);
            $stmt->bindValue(":entity_id", $entityId ?: null);
            $stmt->bindValue(":details", $details);
            $stmt->bindValue(":ip", $ip);
            return $stmt->execute();
        } catch (PDOException $e) {
            return false;
        }
    }

    // The log, newest first. $filters: action, keyword (name/details), from, to.
    public function getAll($filters = []) {
        if (!$this->conn) return [];

        $query = "SELECT * FROM audit_logs WHERE 1 = 1";
        $params = [];

        if (!empty($filters["action"])) {
            $query .= " AND action = :action ";
            $params[":action"] = $filters["action"];
        }
        if (!empty($filters["keyword"])) {
            $query .= " AND (actor_name LIKE :kw OR details LIKE :kw OR actor_role LIKE :kw) ";
            $params[":kw"] = "%" . $filters["keyword"] . "%";
        }
        if (!empty($filters["from"])) {
            $query .= " AND created_at >= :from ";
            $params[":from"] = $filters["from"] . " 00:00:00";
        }
        if (!empty($filters["to"])) {
            $query .= " AND created_at <= :to ";
            $params[":to"] = $filters["to"] . " 23:59:59";
        }

        $query .= " ORDER BY created_at DESC, log_id DESC LIMIT 500";

        try {
            $stmt = $this->conn->prepare($query);
            foreach ($params as $k => $v) $stmt->bindValue($k, $v);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return [];
        }
    }

    // Distinct action values, to populate the filter dropdown.
    public function distinctActions() {
        if (!$this->conn) return [];
        try {
            $stmt = $this->conn->query("SELECT DISTINCT action FROM audit_logs ORDER BY action");
            return $stmt->fetchAll(PDO::FETCH_COLUMN);
        } catch (PDOException $e) {
            return [];
        }
    }
}
?>
