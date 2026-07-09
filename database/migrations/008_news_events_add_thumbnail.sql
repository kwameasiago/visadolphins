ALTER TABLE news_event_media ADD COLUMN is_thumbnail TINYINT(1) NOT NULL DEFAULT 0 AFTER sort_order;

ALTER TABLE news_events DROP COLUMN cover_media_type;
ALTER TABLE news_events DROP COLUMN cover_media_path;
