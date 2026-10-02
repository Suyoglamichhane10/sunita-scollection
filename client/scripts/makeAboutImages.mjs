import sharp from 'sharp';
import { mkdirSync } from 'fs';

mkdirSync('public/img', { recursive: true });

const source = 'src/assets/Aboutimage.png';

// bg-cover across a full-screen hero means the source must cover the widest
// viewport, otherwise it gets upscaled and looks soft. WebP keeps it sharp at
// a fraction of the 2.5MB PNG.
const widths = [640, 1024, 1440, 1920];

for (const w of widths) {
  await sharp(source)
    .resize(w, null, { withoutEnlargement: false, fit: 'cover', position: 'centre' })
    .webp({ quality: 82, effort: 6 })
    .toFile(`public/img/about-hero-${w}.webp`);
  console.log('about-hero', w);
}

// Owner and sister portraits, cropped to a consistent 4:5 so the story layout
// does not shift between breakpoints.
for (const [name, file] of [['owner', 'sunu.jpg'], ['sister', 'sun.jpg']]) {
  for (const w of [480, 900]) {
    await sharp(`src/assets/${file}`)
      .resize(w, Math.round(w * 1.25), { fit: 'cover', position: 'attention' })
      .webp({ quality: 84, effort: 6 })
      .toFile(`public/img/${name}-${w}.webp`);
    console.log(name, w);
  }
}
