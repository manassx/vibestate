-- =====================================================
-- CursorGallery - User Settings Table Migration
-- =====================================================
-- Run this in Supabase SQL Editor to create the user_settings table

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
    profile JSONB DEFAULT '{"bio": "", "website": "", "location": ""}',
    preferences JSONB DEFAULT '{"emailNotifications": true, "browserNotifications": false, "galleryUpdates": true, "marketingEmails": false, "defaultGalleryVisibility": "private", "autoSave": true, "compressImages": true, "defaultThreshold": 80, "language": "en"}',
    created_at TIMESTAMP
  WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP
  WITH TIME ZONE DEFAULT timezone('utc', now()),
    UNIQUE
(
    user_id
)
    );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Create function to auto-update updated_at timestamp
CREATE
OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at
= timezone('utc', now());
RETURN NEW;
END;
$$
LANGUAGE plpgsql;

-- Create trigger to call the function
CREATE TRIGGER trigger_user_settings_updated_at
    BEFORE UPDATE
    ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_user_settings_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own settings
CREATE
POLICY "Users can view their own settings"
    ON user_settings FOR
SELECT
    USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own settings
CREATE
POLICY "Users can insert their own settings"
    ON user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own settings
CREATE
POLICY "Users can update their own settings"
    ON user_settings FOR
UPDATE
    USING (auth.uid() = user_id);

-- RLS Policy: Users can delete their own settings
CREATE
POLICY "Users can delete their own settings"
    ON user_settings FOR DELETE
USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL
ON user_settings TO authenticated;
GRANT SELECT ON user_settings TO anon;

-- Success message
DO
$$
BEGIN 
    RAISE
NOTICE 'User settings table created successfully! ✓';
END $$;
