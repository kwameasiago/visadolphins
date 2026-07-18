CREATE TABLE IF NOT EXISTS news_events (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    public_id       VARCHAR(36) NOT NULL UNIQUE,
    title           VARCHAR(500) NOT NULL,
    body            LONGTEXT DEFAULT NULL,
    cover_media_type ENUM('image', 'youtube', 'video') DEFAULT NULL,
    cover_media_path VARCHAR(500) DEFAULT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_public_id (public_id),
    INDEX idx_title (title(255)),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS news_event_media (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    news_event_id   INT NOT NULL,
    media_type      ENUM('image', 'youtube', 'video') NOT NULL,
    media_path      VARCHAR(500) NOT NULL,
    sort_order      INT DEFAULT 0,
    FOREIGN KEY (news_event_id) REFERENCES news_events(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
