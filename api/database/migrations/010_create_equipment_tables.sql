CREATE TABLE IF NOT EXISTS equipment (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    public_id       VARCHAR(36) NOT NULL UNIQUE,
    name            VARCHAR(500) NOT NULL,
    image_path      VARCHAR(500) DEFAULT NULL,
    category        VARCHAR(100) DEFAULT NULL,
    price           VARCHAR(100) DEFAULT NULL,
    description     TEXT DEFAULT NULL,
    sizes           VARCHAR(500) DEFAULT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_public_id (public_id),
    INDEX idx_name (name(255)),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS equipment_features (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    equipment_id    INT NOT NULL,
    feature         VARCHAR(500) NOT NULL,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
