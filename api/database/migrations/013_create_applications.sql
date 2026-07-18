CREATE TABLE IF NOT EXISTS applications (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    public_id       VARCHAR(36) NOT NULL UNIQUE,
    form_type       ENUM('swimming','corporate') NOT NULL,
    name            VARCHAR(255) NOT NULL,
    phone           VARCHAR(50) DEFAULT NULL,
    email           VARCHAR(255) DEFAULT NULL,
    level           VARCHAR(50) DEFAULT NULL,
    school_name     VARCHAR(255) DEFAULT NULL,
    num_students    INT DEFAULT NULL,
    is_read         TINYINT(1) NOT NULL DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_public_id (public_id),
    INDEX idx_form_type (form_type),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
