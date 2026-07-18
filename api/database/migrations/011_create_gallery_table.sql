CREATE TABLE IF NOT EXISTS gallery (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    public_id       VARCHAR(36) NOT NULL UNIQUE,
    image_path      VARCHAR(500) NOT NULL,
    tag             VARCHAR(100) DEFAULT NULL,
    caption         TEXT DEFAULT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_public_id (public_id),
    INDEX idx_tag (tag),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
