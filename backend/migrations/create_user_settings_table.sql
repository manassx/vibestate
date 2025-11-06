-- Create user_settings table
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
    profile JSONB DEFAULT '{
        "bio": "",
        "website": "",
        "location": ""
    }'::jsonb,
    preferences JSONB DEFAULT '{
        "emailNotifications": true,
        "browserNotifications": false,
        "galleryUpdates": true,
        "marketingEmails": false,
        "defaultGalleryVisibility": "private",
        "autoSave": true,
        "compressImages": true,
        "defaultThreshold": 80,
        "language": "en"
    }'::jsonb,
    created_at TIMESTAMP
  WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP
  WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE
(
    user_id
)
    );

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Create a trigger to automatically update the updated_at timestamp
CREATE
OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at
= TIMEZONE('utc', NOW());
RETURN NEW;
END;
$$
LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_settings_updated_at
    BEFORE UPDATE
    ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_user_settings_updated_at();

-- Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for user_settings
-- Users can only read their own settings
CREATE
POLICY "Users can view their own settings"
    ON user_settings
    FOR
SELECT
    USING (auth.uid() = user_id);

-- Users can only insert their own settings
CREATE
POLICY "Users can insert their own settings"
    ON user_settings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can only update their own settings
CREATE
POLICY "Users can update their own settings"
    ON user_settings
    FOR
UPDATE
    USING (auth.uid() = user_id);

-- Users can only delete their own settings
CREATE
POLICY "Users can delete their own settings"
    ON user_settings
    FOR DELETE
USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL
ON user_settings TO authenticated;
GRANT SELECT ON user_settings TO anon;
