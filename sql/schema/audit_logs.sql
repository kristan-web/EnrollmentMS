-- Audit log for the admin console (staff account management + logins).
-- Additive: does not change any existing table.
USE `enrollment_management_system`;

CREATE TABLE IF NOT EXISTS `audit_logs` (
  `log_id`     int(11) NOT NULL AUTO_INCREMENT,
  `actor_id`   int(11) DEFAULT NULL,                 -- users.user_id of who acted (NULL if unknown)
  `actor_name` varchar(100) DEFAULT NULL,
  `actor_role` varchar(20)  DEFAULT NULL,
  `action`     varchar(40)  NOT NULL,                -- login | logout | create_account | update_account | reset_password | delete_account
  `entity`     varchar(40)  DEFAULT NULL,            -- what was acted on, e.g. 'user'
  `entity_id`  int(11)      DEFAULT NULL,
  `details`    varchar(255) DEFAULT NULL,            -- human-readable summary
  `ip_address` varchar(45)  DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`log_id`),
  KEY `idx_actor`   (`actor_id`),
  KEY `idx_action`  (`action`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
