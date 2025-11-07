# Image Optimization Guide

## Overview

This guide helps you optimize images for the landing page demo gallery to ensure smooth gliding and trail effects.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Optimization Script

```bash
npm run optimize-images
```

## What It Does

The optimization script will:

- ✅ Compress all images to **95% quality** (optimal balance)
- ✅ Use **progressive JPEG** for faster loading
- ✅ Apply **mozjpeg** compression for better results
- ✅ Reduce file sizes by **20-50%** on average
- ✅ Maintain visual quality (95% is nearly imperceptible)
- ✅ Save optimized images to `public/images/optimized/`

## Results

You'll see output like this:

```
🚀 Starting image optimization...

Found 29 images to optimize

✅ IMG-20250628-WA0027.jpg: 489.61KB → 245.32KB (50.08% reduction)
✅ IMG-20250628-WA0029.jpg: 678.17KB → 402.18KB (40.69% reduction)
✅ IMG-20250628-WA0032.jpg: 502.73KB → 298.45KB (40.63% reduction)
...

📊 Optimization Summary:
✅ Successfully optimized: 29 images
📉 Total size reduction: 12.45MB → 7.23MB (41.92% smaller)

✨ Optimization complete!
```

## Using Optimized Images

### Option 1: Replace Original Images (Recommended)

```bash
# Backup originals first
mkdir public/images/backup
cp public/images/*.jpg public/images/backup/

# Replace with optimized versions
cp public/images/optimized/*.jpg public/images/
```

### Option 2: Update Image Paths

Update the image paths in `LandingPage.jsx`:

```javascript
const demoImages = [
    '/images/optimized/IMG-20250628-WA0027.jpg',
    '/images/optimized/IMG-20250628-WA0029.jpg',
    // ... etc
]
```

## Performance Benefits

- ⚡ **Faster page load** - Smaller files = quicker downloads
- 🎨 **Smoother animations** - Less data to process
- 📱 **Better mobile experience** - Reduced data usage
- 🖼️ **Maintained quality** - 95% quality is visually identical

## Technical Details

- **Quality**: 95% (sweet spot for JPEGs)
- **Format**: Progressive JPEG (loads incrementally)
- **Compression**: mozjpeg (superior to standard JPEG)
- **File size reduction**: Typically 30-50%

## Troubleshooting

### "Module not found: sharp"

Run: `npm install`

### "Permission denied"

Run: `chmod +x optimize-images.js`

### Images look degraded

- 95% quality should be imperceptible
- If needed, increase quality to 98% in `optimize-images.js`
- Line 15: Change `quality: 95` to `quality: 98`

## Notes

- Original images are never modified automatically
- Always backup before replacing originals
- Review optimized images before deployment
- Re-run optimization when adding new images
