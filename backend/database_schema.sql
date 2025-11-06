-- CursorGallery Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE
EXTENSION IF NOT EXISTS "uuid-ossp";

-- Galleries table
CREATE TABLE IF NOT EXISTS galleries
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    uuid_generate_v4
(
),
    user_id UUID NOT NULL REFERENCES auth.users
(
    id
) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    slug TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK
(
    status
    IN
(
    'draft',
    'processing',
    'analyzed',
    'published'
)),
    image_count INTEGER NOT NULL DEFAULT 0,
    config JSONB DEFAULT '{
        "threshold": 100,
        "animationType": "fade",
        "mood": "calm"
    }'::jsonb,
    analysis_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP
  WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP
  WITH TIME ZONE DEFAULT NOW(),
    UNIQUE
(
    user_id,
    slug
)
    );

-- Images table
CREATE TABLE IF NOT EXISTS images
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    uuid_generate_v4
(
),
    gallery_id UUID NOT NULL REFERENCES galleries
(
    id
) ON DELETE CASCADE,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP
  WITH TIME ZONE DEFAULT NOW()
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_galleries_user_id ON galleries(user_id);
CREATE INDEX IF NOT EXISTS idx_galleries_slug ON galleries(slug);
CREATE INDEX IF NOT EXISTS idx_galleries_status ON galleries(status);
CREATE INDEX IF NOT EXISTS idx_images_gallery_id ON images(gallery_id);
CREATE INDEX IF NOT EXISTS idx_images_order ON images(gallery_id, order_index);

-- Create updated_at trigger function
CREATE
OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at
= NOW();
RETURN NEW;
END;
$$
LANGUAGE plpgsql;

-- Add trigger to galleries table
DROP TRIGGER IF EXISTS update_galleries_updated_at ON galleries;
CREATE TRIGGER update_galleries_updated_at
    BEFORE UPDATE
    ON galleries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update image count
CREATE
OR REPLACE FUNCTION update_gallery_image_count()
RETURNS TRIGGER AS $$
BEGIN
    IF
(TG_OP = 'DELETE') THEN
UPDATE galleries
SET image_count = (SELECT COUNT(*) FROM images WHERE gallery_id = OLD.gallery_id)
WHERE id = OLD.gallery_id;
RETURN OLD;
ELSIF
(TG_OP = 'INSERT') THEN
UPDATE galleries
SET image_count = (SELECT COUNT(*) FROM images WHERE gallery_id = NEW.gallery_id)
WHERE id = NEW.gallery_id;
RETURN NEW;
END IF;
RETURN NULL;
END;
$$
LANGUAGE plpgsql;

-- Add trigger to automatically update image count
DROP TRIGGER IF EXISTS update_image_count_trigger ON images;
CREATE TRIGGER update_image_count_trigger
    AFTER INSERT OR
DELETE
ON images
    FOR EACH ROW
    EXECUTE FUNCTION update_gallery_image_count();

-- Enable Row Level Security (RLS)
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- Galleries policies
-- Users can view their own galleries
CREATE
POLICY "Users can view own galleries" ON galleries
    FOR
SELECT USING (auth.uid() = user_id);

-- Users can insert their own galleries
CREATE
POLICY "Users can insert own galleries" ON galleries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own galleries
CREATE
POLICY "Users can update own galleries" ON galleries
    FOR
UPDATE USING (auth.uid() = user_id);

-- Users can delete their own galleries
CREATE
POLICY "Users can delete own galleries" ON galleries
    FOR DELETE
USING (auth.uid() = user_id);

-- Anyone can view published galleries
CREATE
POLICY "Anyone can view published galleries" ON galleries
    FOR
SELECT USING (status = 'published');

-- Images policies
-- Users can view images from their own galleries
CREATE
POLICY "Users can view own gallery images" ON images
    FOR
SELECT USING (
    EXISTS (
    SELECT 1 FROM galleries
    WHERE galleries.id = images.gallery_id
    AND galleries.user_id = auth.uid()
    )
    );

-- Users can insert images to their own galleries
CREATE
POLICY "Users can insert own gallery images" ON images
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM galleries 
            WHERE galleries.id = images.gallery_id 
            AND galleries.user_id = auth.uid()
        )
    );

-- Users can delete images from their own galleries
CREATE
POLICY "Users can delete own gallery images" ON images
    FOR DELETE
USING (
        EXISTS (
            SELECT 1 FROM galleries 
            WHERE galleries.id = images.gallery_id 
            AND galleries.user_id = auth.uid()
        )
    );

-- Anyone can view images from published galleries
CREATE
POLICY "Anyone can view published gallery images" ON images
    FOR
SELECT USING (
    EXISTS (
    SELECT 1 FROM galleries
    WHERE galleries.id = images.gallery_id
    AND galleries.status = 'published'
    )
    );

-- Create storage bucket for gallery images (run this separately in Supabase Storage)
-- This is just documentation, actual bucket creation is done via Supabase UI or API
-- Bucket name: 'gallery-images'
-- Public: true
-- File size limit: 10MB
-- Allowed MIME types: image/jpeg, image/png, image/webp
