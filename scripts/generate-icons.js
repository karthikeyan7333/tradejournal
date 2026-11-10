import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generate() {
  const logoSvg = fs.readFileSync('public/logo.svg');
  const maskableSvg = fs.readFileSync('public/icon-maskable.svg');

  // 192x192
  await sharp(logoSvg)
    .resize(192, 192)
    .png()
    .toFile('public/pwa-192x192.png');
  console.log('Generated pwa-192x192.png');

  // 512x512
  await sharp(logoSvg)
    .resize(512, 512)
    .png()
    .toFile('public/pwa-512x512.png');
  console.log('Generated pwa-512x512.png');

  // 512x512 maskable
  await sharp(maskableSvg)
    .resize(512, 512)
    .png()
    .toFile('public/pwa-maskable-512x512.png');
  console.log('Generated pwa-maskable-512x512.png');

  // 180x180 apple touch icon
  await sharp(logoSvg)
    .resize(180, 180)
    .png()
    .toFile('public/apple-touch-icon.png');
  console.log('Generated apple-touch-icon.png');

  // 32x32 favicon
  await sharp(logoSvg)
    .resize(32, 32)
    .png()
    .toFile('public/favicon.png');
  console.log('Generated favicon.png');

  fs.copyFileSync('public/logo.svg', 'public/icon.svg');
  console.log('Icons generated successfully!');
}

generate().catch(console.error);
