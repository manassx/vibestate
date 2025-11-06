-- CursorGallery User Settings Table
-- Copy and paste this entire script into Supabase SQL Editor and click RUN

CREATE TABLE IF NOT EXISTS user_settings
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),
    user_id UUID NOT NULL REFERENCES auth.users
(
    id
) ON DELETE CASCADE,
    profile JSONB DEFAULT '{"bio": "", "website": "", "location": ""}',
    preferences JSONB DEFAULT '{"emailNotifications": true, "browserNotifications": false, "galleryUpdates": true, "marketingEmails": false, "defaultGalleryVisibility": "private", "autoSave": true, "compressImages": true, "defaultThreshold": 80, "language": "en"}',
    created_at TIMESTAMPTZ DEFAULT now
(
),
    updated_at TIMESTAMPTZ DEFAULT now
(
),
    UNIQUE
(
    user_id
)
    );

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

CREATE
OR REPLACE FUNCTION update_user_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at
= now();
RETURN NEW;
END;
$$
LANGUAGE plpgsql;

CREATE TRIGGER update_user_settings_timestamp
    BEFORE UPDATE
    ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_user_settings_timestamp();

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE
POLICY "Users can manage their own settings" ON user_settings
    FOR ALL USING (auth.uid() = user_id);

GRANT ALL
ON user_settings TO authenticated;
