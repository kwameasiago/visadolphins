CREATE TABLE IF NOT EXISTS contact_submissions (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    public_id       VARCHAR(36) NOT NULL UNIQUE,
    name            VARCHAR(255) NOT NULL,
    phone           VARCHAR(50) DEFAULT NULL,
    email           VARCHAR(255) DEFAULT NULL,
    subject         VARCHAR(100) DEFAULT NULL,
    message         TEXT NOT NULL,
    is_read         TINYINT(1) NOT NULL DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_public_id (public_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
