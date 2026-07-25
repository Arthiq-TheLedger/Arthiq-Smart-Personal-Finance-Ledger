import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '../public');
const source = path.join(publicDir, 'logo-icon.png');

/** Solid black — no transparency (PWA / iOS home screen) */
const BG = { r: 0, g: 0, b: 0 };

/** How much of the square the logo fills (0–1). Higher = larger icon, less empty banding. */
const FILL = 0.94;

const sizes = [
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-1024.png', size: 1024 },
];

async function makeIcon(name, size, fill = FILL) {
  const inner = Math.round(size * fill);
  const offset = Math.round((size - inner) / 2);

  const logoBuf = await sharp(source)
    .flatten({ background: BG })
    .resize(inner, inner, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: BG,
    },
  })
    .composite([{ input: logoBuf, left: offset, top: offset }])
    .png({ compressionLevel: 9, force: true })
    .toFile(path.join(publicDir, name));

  console.log(`Generated ${name} (${size}x${size}, fill ${Math.round(fill * 100)}%)`);
}

for (const { name, size } of sizes) {
  await makeIcon(name, size);
}

/** Maskable Android icon — slightly inset for safe zone */
await makeIcon('icon-512-maskable.png', 512, 0.82);

console.log('Done — all icons use logo-icon on solid black (no transparency).');
