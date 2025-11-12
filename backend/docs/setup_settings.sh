#!/bin/bash

# CursorGallery Settings Setup Script
# This script helps you set up the user settings feature

echo "================================================"
echo "  CursorGallery Settings Setup"
echo "================================================"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with your Supabase credentials first."
    exit 1
fi

echo "✓ .env file found"
echo ""

# Load environment variables
source .env

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
    echo "❌ Error: SUPABASE_URL or SUPABASE_KEY not set in .env"
    exit 1
fi

echo "✓ Supabase credentials loaded"
echo ""

echo "Setting up user_settings table..."
echo ""
echo "Please follow these steps:"
echo ""
echo "1. Go to your Supabase Dashboard"
echo "   URL: https://app.supabase.com"
echo ""
echo "2. Select your project"
echo ""
echo "3. Navigate to: SQL Editor (in the left sidebar)"
echo ""
echo "4. Click 'New Query'"
echo ""
echo "5. Copy and paste the SQL from:"
echo "   migrations/create_user_settings_table.sql"
echo ""
echo "6. Click 'Run' or press Ctrl+Enter"
echo ""
echo "7. Verify the table was created by running:"
echo "   SELECT * FROM user_settings LIMIT 1;"
echo ""

read -p "Have you completed the database setup? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Please complete the database setup first."
    echo "You can run this script again when ready."
    exit 0
fi

echo ""
echo "================================================"
echo "  Setup Complete! ✓"
echo "================================================"
echo ""
echo "The settings feature is now ready to use!"
echo ""
echo "Features available:"
echo "  ✓ Profile management (name, bio, website, location)"
echo "  ✓ Password change with validation"
echo "  ✓ Notification preferences"
echo "  ✓ Gallery default settings"
echo "  ✓ Data export"
echo "  ✓ Account deletion"
echo ""
echo "Access settings at: http://localhost:5173/settings"
echo ""
echo "For more information, see: SETTINGS_SETUP.md"
echo ""
