const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, 'public', 'images');
const optimizedDir = path.join(__dirname, 'public', 'images', 'optimized');

// Create optimized directory if it doesn't exist
if (!fs.existsSync(optimizedDir)) {
    fs.mkdirSync(optimizedDir, {recursive: true});
}

async function optimizeImage(filePath, fileName) {
    const outputPath = path.join(optimizedDir, fileName);

    try {
        const info = await sharp(filePath)
            .jpeg({
                quality: 95,
                progressive: true,
                mozjpeg: true
            })
            .toFile(outputPath);

        const originalSize = fs.statSync(filePath).size;
        const optimizedSize = info.size;
        const reduction = ((originalSize - optimizedSize) / originalSize * 100).toFixed(2);

        console.log(`✅ ${fileName}: ${(originalSize / 1024).toFixed(2)}KB → ${(optimizedSize / 1024).toFixed(2)}KB (${reduction}% reduction)`);

        return {success: true, fileName, originalSize, optimizedSize};
    } catch (error) {
        console.error(`❌ Error optimizing ${fileName}:`, error.message);
        return {success: false, fileName, error: error.message};
    }
}

async function optimizeAllImages() {
    console.log('🚀 Starting image optimization...\n');

    const files = fs.readdirSync(imagesDir)
        .filter(file => /\.(jpg|jpeg|png)$/i.test(file))
        .filter(file => file !== 'optimized'); // Skip the optimized directory

    console.log(`Found ${files.length} images to optimize\n`);

    const results = [];

    for (const file of files) {
        const filePath = path.join(imagesDir, file);
        const result = await optimizeImage(filePath, file);
        results.push(result);
    }

    console.log('\n📊 Optimization Summary:');
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    if (successful.length > 0) {
        const totalOriginal = successful.reduce((sum, r) => sum + r.originalSize, 0);
        const totalOptimized = successful.reduce((sum, r) => sum + r.optimizedSize, 0);
        const totalReduction = ((totalOriginal - totalOptimized) / totalOriginal * 100).toFixed(2);

        console.log(`✅ Successfully optimized: ${successful.length} images`);
        console.log(`📉 Total size reduction: ${(totalOriginal / 1024 / 1024).toFixed(2)}MB → ${(totalOptimized / 1024 / 1024).toFixed(2)}MB (${totalReduction}% smaller)`);
    }

    if (failed.length > 0) {
        console.log(`❌ Failed: ${failed.length} images`);
    }

    console.log('\n✨ Optimization complete!');
    console.log(`📁 Optimized images saved to: ${optimizedDir}`);
    console.log('\n💡 Next steps:');
    console.log('   1. Review the optimized images');
    console.log('   2. Replace original images if satisfied');
    console.log('   3. Or use optimized folder in your image paths');
}

optimizeAllImages().catch(console.error);
