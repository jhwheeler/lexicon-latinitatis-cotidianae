// Draws the home-screen icons (src/icons/) with the lexicon's own serif: an ink L over a red rule,
// on white, kept inside the middle of the square so that a phone may round or mask the corners.
// Run from the repository root after `npm ci`: node scripts/make_icons.mjs
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const font = readFileSync(root + 'src/fonts/lexicon-serif-700.woff2').toString('base64');
const browser = await chromium.launch({
  executablePath: process.env.LEXICON_CHROMIUM_EXECUTABLE || undefined,
  args: JSON.parse(process.env.LEXICON_CHROMIUM_ARGS || '[]')
});
for (const size of [180, 192, 512]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<style>
    @font-face { font-family: L; src: url(data:font/woff2;base64,${font}); font-weight: 700; }
    html, body { margin: 0; width: 100%; height: 100%; background: #ffffff; }
    body { display: flex; flex-direction: column; align-items: center; justify-content: center; }
    b { font: 700 ${size * 0.56}px/0.8 L; color: #141414; }
    i { display: block; width: ${size * 0.4}px; height: ${Math.max(2, size * 0.028)}px; margin-top: ${size * 0.075}px; background: #b0171f; }
  </style><b>L</b><i></i>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${root}src/icons/icon-${size}.png` });
  await page.close();
}
await browser.close();
