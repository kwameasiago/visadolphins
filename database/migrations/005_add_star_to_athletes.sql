ALTER TABLE athletes ADD COLUMN star TINYINT(1) NOT NULL DEFAULT 0 AFTER image_path;
CREATE INDEX idx_star ON athletes(star);
