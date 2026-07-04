CREATE TABLE IF NOT EXISTS athletes (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    public_id   VARCHAR(36) NOT NULL UNIQUE,
    name        VARCHAR(255) NOT NULL,
    image_path  VARCHAR(500) DEFAULT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_public_id (public_id),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS athlete_personal_bests (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    athlete_id  INT NOT NULL,
    event       VARCHAR(255) NOT NULL,
    time        VARCHAR(50) NOT NULL,
    date        DATE DEFAULT NULL,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS athlete_highlights (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    athlete_id  INT NOT NULL,
    highlight   TEXT NOT NULL,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
