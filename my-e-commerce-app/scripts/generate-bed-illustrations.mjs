// Generates local, clearly-labelled SVG illustrations for each owner bed line.
// These are NOT product photographs. They exist so catalogue cards show a bed
// instead of a broken image while the owner supplies real photos.
//
// Run: node scripts/generate-bed-illustrations.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ownerLines } from '../src/data/ownerCatalogue.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, '../public/images/beds');

const palette = {
  LUXURY: { bg: '#f0eaf6', top: '#8c6ba6', side: '#6d4f86', accent: '#c8a7d8' },
  COMFORT: { bg: '#e7f2ee', top: '#4f9a82', side: '#367461', accent: '#9fcbbc' },
  VALUE: { bg: '#fbf1e3', top: '#c09261', side: '#9a6f43', accent: '#e0c39b' },
};

const escapeXml = (value) =>
  String(value).replace(/[<>&"']/g, (char) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;',
  }[char]));

function illustration(line) {
  const c = palette[line.tier];
  const title = escapeXml(line.line);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360" role="img" aria-label="Illustrative image for ${title}">
  <rect width="480" height="360" fill="${c.bg}"/>
  <rect x="0" y="0" width="480" height="44" fill="${c.side}" opacity="0.12"/>
  <text x="24" y="29" font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="${c.side}">ID Beddings and More</text>

  <!-- Simple bed/mattress illustration (not a photograph) -->
  <ellipse cx="240" cy="296" rx="168" ry="16" fill="#000000" opacity="0.08"/>
  <rect x="86" y="208" width="308" height="72" rx="14" fill="${c.side}"/>
  <path d="M86 208 h308 l-26 -40 h-256 z" fill="${c.top}"/>
  <rect x="112" y="168" width="256" height="40" rx="12" fill="${c.accent}"/>
  <path d="M112 168 h256 q12 0 12 12 v8 h-280 v-8 q0 -12 12 -12 z" fill="${c.top}"/>
  <rect x="112" y="262" width="14" height="24" rx="4" fill="#5a4636"/>
  <rect x="354" y="262" width="14" height="24" rx="4" fill="#5a4636"/>

  <text x="240" y="324" text-anchor="middle" font-family="Arial, sans-serif" font-size="17" font-weight="700" fill="${c.side}">${title}</text>
  <text x="240" y="345" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" letter-spacing="1" fill="#6b6459">ILLUSTRATIVE ONLY — NOT A PRODUCT PHOTO</text>
</svg>
`;
}

await mkdir(outDir, { recursive: true });
for (const line of ownerLines) {
  await writeFile(path.join(outDir, `${line.image}.svg`), illustration(line), 'utf8');
}
console.log(`Wrote ${ownerLines.length} illustrative SVG images to public/images/beds/`);
