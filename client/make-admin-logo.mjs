import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(__dirname, 'src/assets/LOGO!.png');
const dest = path.join(__dirname, 'public/admin-logo.png');

const resized = await sharp(src)
  .resize(160, 160, { fit: 'inside', withoutEnlargement: true })
  .png()
  .toBuffer();

await sharp({
  create: {
    width: 200,
    height: 200,
    channels: 4,
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  },
})
  .composite([
    {
      input: resized,
      gravity: 'center',
    },
    {
      input: Buffer.from(
        `<svg width="200" height="200"><circle cx="100" cy="100" r="100" fill="white"/></svg>`
      ),
      blend: 'dest-in',
    },
  ])
  .png()
  .toFile(dest);

console.log('Created circular admin logo with white background');
