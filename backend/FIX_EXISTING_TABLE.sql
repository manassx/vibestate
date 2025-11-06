-- Fix existing user_settings table
-- This script safely updates the table if it already exists

-- Drop trigger if exists (to avoid duplicate error)
DROP TRIGGER IF EXISTS update_user_settings_timestamp ON user_settings;
DROP TRIGGER IF EXISTS trigger_user_settings_updated_at ON user_settings;

-- Drop function if exists
DROP FUNCTION IF EXISTS update_user_settings_timestamp();
DROP FUNCTION IF EXISTS update_user_settings_updated_at();

-- Make sure the table has the correct structure
-- This will NOT drop existing data
ALTER TABLE user_settings
    ALTER COLUMN profile SET DEFAULT '{"bio": "", "website": "", "location": ""}',
ALTER
COLUMN preferences SET DEFAULT '{"emailNotifications": true, "browserNotifications": false, "galleryUpdates": true, "marketingEmails": false, "defaultGalleryVisibility": "private", "autoSave": true, "compressImages": true, "defaultThreshold": 80, "language": "en"}';

-- Create the updated timestamp function
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

-- Create the trigger
CREATE TRIGGER update_user_settings_timestamp
    BEFORE UPDATE
    ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_user_settings_timestamp();

-- Make sure RLS is enabled
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP
POLICY IF EXISTS "Users can view their own settings" ON user_settings;
DROP
POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
DROP
POLICY IF EXISTS "Users can update their own settings" ON user_settings;
DROP
POLICY IF EXISTS "Users can delete their own settings" ON user_settings;
DROP
POLICY IF EXISTS "Users can manage their own settings" ON user_settings;

-- Create a single comprehensive policy
CREATE
POLICY "Users can manage their own settings" ON user_settings
    FOR ALL USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL
ON user_settings TO authenticated;

-- Success message
SELECT 'Table updated successfully!' as status;
