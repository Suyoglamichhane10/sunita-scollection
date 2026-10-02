import sharp from 'sharp';
import { writeFileSync } from 'fs';

const source = 'public/admin-logo.png';
const out = {
  32: 'public/favicon-32.png',
  180: 'public/apple-touch-icon.png',
  192: 'public/icons/icon-192.png',
  512: 'public/icons/icon-512.png',
};

const ring = '<circle cx="256" cy="256" r="250" fill="#881337"/>';

for (const [size, path] of Object.entries(out)) {
  const s = Number(size);

  // Circular mask, with a solid brand ring behind the artwork so transparent
  // corners in the source never show through as a square.
  const mask = Buffer.from(
    `<svg width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg">
       <defs><clipPath id="c"><circle cx="${s / 2}" cy="${s / 2}" r="${s / 2}"/></clipPath></defs>
       <g clip-path="url(#c)">
         <rect width="${s}" height="${s}" fill="#881337"/>
         <image href="data:image/png;base64,${
           (await import('fs')).readFileSync(source).toString('base64')
         }" x="0" y="0" width="${s}" height="${s}" preserveAspectRatio="xMidYMid meet"/>
       </g>
     </svg>`
  );

  await sharp(mask, { density: 384 })
    .resize(s, s)
    .png()
    .toFile(path);
  console.log('wrote', path, s + 'x' + s);
}

// Real multi-size .ico so /favicon.ico stops 404ing on a PNG named .ico.
const icoSizes = [16, 32, 48];
const pngs = await Promise.all(
  icoSizes.map(async (s) => await sharp(source).resize(s, s, { fit: 'cover' }).png().toBuffer())
);

const header = Buffer.alloc(6 + 16 * pngs.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(pngs.length, 4);

let offset = header.length;
pngs.forEach((buf, i) => {
  const s = icoSizes[i];
  const entry = 6 + i * 16;
  header[entry] = s === 256 ? 0 : s;
  header[entry + 1] = s === 256 ? 0 : s;
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(buf.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += buf.length;
});

writeFileSync('public/favicon.ico', Buffer.concat([header, ...pngs]));
console.log('wrote public/favicon.ico');
