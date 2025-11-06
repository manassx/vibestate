# Settings Feature Setup Guide

This guide explains how to set up and use the comprehensive settings feature in CursorGallery.

## Features

The settings system includes:

### 1. Profile Settings

- **Full Name**: Update your display name
- **Email**: View your email (cannot be changed)
- **Bio**: Add a short bio (160 characters max)
- **Website**: Add your personal or portfolio website
- **Location**: Add your location

### 2. Account Security

- **Change Password**: Securely update your password with validation
- **Password Strength Indicator**: Visual feedback on password security
- **Current Password Verification**: Ensures account security

### 3. Preferences

- **Notification Settings**:
    - Email notifications
    - Browser notifications
    - Gallery update alerts
    - Marketing emails

- **Gallery Defaults**:
    - Default visibility (Private/Public/Unlisted)
    - Default interaction threshold
    - Auto-save changes
    - Image compression on upload

### 4. Data Management

- **Export Data**: Download all your galleries and settings as JSON
- **Account Deletion**: Permanently delete your account and all data

## Database Setup

### Step 1: Create the user_settings table

Run the SQL migration in your Supabase dashboard:

```sql
-- Navigate to: SQL Editor in Supabase Dashboard
-- Copy and paste the contents of: migrations/create_user_settings_table.sql
-- Click "Run"
```

Or use the Supabase CLI:

```bash
# Navigate to backend directory
cd vibestate/backend

# Run the migration
supabase db push migrations/create_user_settings_table.sql
```

### Step 2: Verify Table Creation

Check that the table was created successfully:

```sql
SELECT * FROM user_settings LIMIT 1;
```

## API Endpoints

All endpoints require authentication via Bearer token in the Authorization header.

### GET /api/user/settings

Get current user settings.

**Response:**

```json
{
  "profile": {
    "bio": "Designer and photographer",
    "website": "https://example.com",
    "location": "San Francisco, CA"
  },
  "preferences": {
    "emailNotifications": true,
    "browserNotifications": false,
    "galleryUpdates": true,
    "marketingEmails": false,
    "defaultGalleryVisibility": "private",
    "autoSave": true,
    "compressImages": true,
    "defaultThreshold": 80,
    "language": "en"
  }
}
```

### PUT /api/user/profile

Update user profile information.

**Request:**

```json
{
  "name": "John Doe",
  "bio": "Designer and photographer",
  "website": "https://example.com",
  "location": "San Francisco, CA"
}
```

### PUT /api/user/preferences

Update user preferences.

**Request:**

```json
{
  "emailNotifications": true,
  "browserNotifications": false,
  "galleryUpdates": true,
  "marketingEmails": false,
  "defaultGalleryVisibility": "private",
  "autoSave": true,
  "compressImages": true,
  "defaultThreshold": 80,
  "language": "en"
}
```

### POST /api/user/change-password

Change user password.

**Request:**

```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

### GET /api/user/export-data

Export all user data including galleries, images, and settings.

**Response:**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "settings": { ... },
  "galleries": [ ... ],
  "export_date": "2024-01-15T12:00:00Z"
}
```

### DELETE /api/user/account

Permanently delete user account and all associated data.

**Warning:** This action cannot be undone!

## Frontend Integration

The settings page is located at `/settings` and includes:

### Features

- **Tab Navigation**: Easy switching between sections
- **Real-time Validation**: Instant feedback on inputs
- **Responsive Design**: Works on all devices
- **Theme Support**: Respects light/dark mode
- **Beautiful UI**: Matches the app's aesthetic

### Usage

Users can access settings:

1. Click their profile icon in the navbar
2. Select "SETTINGS" from the dropdown
3. Or navigate directly to `/settings`

## Security Features

### Row Level Security (RLS)

- Users can only access their own settings
- Automatic enforcement at the database level
- Prevents unauthorized access

### Password Security

- Minimum 6 characters required (can be increased)
- Current password verification before changes
- Password strength indicator
- Secure hashing via Supabase Auth

### Data Privacy

- User data export in standard JSON format
- Complete data deletion on account removal
- GDPR compliant

## Testing

### Test Profile Updates

1. Navigate to Settings > Profile
2. Update your name, bio, website, or location
3. Click "SAVE PROFILE"
4. Verify changes persist after page refresh

### Test Password Change

1. Navigate to Settings > Account
2. Enter current password
3. Enter and confirm new password
4. Verify you can log in with new password

### Test Preferences

1. Navigate to Settings > Preferences
2. Toggle various notification settings
3. Adjust default gallery settings
4. Click "SAVE PREFERENCES"
5. Verify settings persist

### Test Data Export

1. Navigate to Settings > Danger Zone
2. Click "EXPORT" button
3. Verify JSON file downloads
4. Check file contains all expected data

### Test Account Deletion

**Warning: Use a test account!**

1. Navigate to Settings > Danger Zone
2. Click "DELETE ACCOUNT"
3. Type "DELETE MY ACCOUNT" exactly
4. Click "CONFIRM DELETE"
5. Verify redirect to homepage
6. Verify cannot log in with deleted credentials

## Troubleshooting

### Settings Not Loading

- Check if user_settings table exists
- Verify RLS policies are set up correctly
- Check browser console for errors
- Verify backend is running and accessible

### Profile Updates Not Saving

- Check network tab for API errors
- Verify authentication token is valid
- Check backend logs for errors
- Ensure user_settings table has correct structure

### Password Change Failing

- Verify current password is correct
- Check new password meets requirements (min 6 chars)
- Ensure Supabase admin API is enabled
- Check for rate limiting

### Data Export Empty

- Verify user has galleries created
- Check if user_settings entry exists
- Look for errors in backend logs

## Future Enhancements

Potential additions to the settings system:

1. **Two-Factor Authentication (2FA)**
    - SMS or authenticator app support
    - Backup codes

2. **Account Activity Log**
    - Login history
    - Settings change history
    - Gallery activity

3. **Privacy Controls**
    - Profile visibility settings
    - Gallery discovery settings
    - Data retention preferences

4. **Advanced Preferences**
    - Keyboard shortcuts customization
    - Display density options
    - Color scheme preferences

5. **Integrations**
    - Connect social media accounts
    - Third-party service integrations
    - API key management

6. **Email Management**
    - Email verification
    - Change email address
    - Secondary email

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review backend logs for errors
3. Check browser console for frontend errors
4. Verify database table structure
5. Ensure all migrations have been run

## License

This settings system is part of CursorGallery and follows the same license as the main project.
