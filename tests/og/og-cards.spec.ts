import { mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { test } from '@playwright/test';
import { MOLAR_PATH } from '../../src/components/shared/BrandMark';
import { OG_CARDS } from '../../src/seo/ogCards';

/**
 * Renders the social share cards in src/seo/ogCards.ts to PNG. Not part of
 * the test suite: run `deno task og-images`, which sets OG_OUT_DIR to the
 * repository's public/og, then commit the images.
 */
const outDir = process.env.OG_OUT_DIR;

const require = createRequire(import.meta.url);
const font = readFileSync(
  require.resolve('@fontsource-variable/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-wght-normal.woff2'),
).toString('base64');

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const cardHtml = (heading: string, text: string) => `<!doctype html>
<html><head><meta charset="utf-8"><style>
@font-face { font-family: 'Atkinson'; src: url(data:font/woff2;base64,${font}) format('woff2'); font-weight: 200 800; }
html, body { margin: 0; }
body { width: 1200px; height: 630px; background: #073B34; color: #ECF5F2; font-family: 'Atkinson', sans-serif; position: relative; overflow: hidden; }
.wrap { position: absolute; inset: 0; padding: 72px 84px; display: flex; flex-direction: column; }
.brand { display: flex; align-items: center; gap: 22px; }
.brand span { font-size: 44px; font-weight: 750; letter-spacing: -0.02em; }
h1 { font-size: ${heading.length > 34 ? 64 : 78}px; line-height: 1.04; font-weight: 750; letter-spacing: -0.025em; margin: auto 0 0; max-width: 17ch; }
p { font-size: 32px; color: #A9C9C0; margin: 28px 0 0; max-width: 36ch; line-height: 1.3; }
.rule { position: absolute; right: 0; top: 0; bottom: 0; width: 14px; background: #2FB39A; }
</style></head><body>
<div class="rule"></div>
<div class="wrap">
  <div class="brand">
    <svg width="72" height="72" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#FFFFFF"/><path fill="#0B5D52" d="${MOLAR_PATH}"/></svg>
    <span>DentistDSS</span>
  </div>
  <h1>${escape(heading)}</h1>
  <p>${escape(text)}</p>
</div>
</body></html>`;

test.skip(!outDir, 'Set OG_OUT_DIR (deno task og-images) to write the cards.');
test.use({ viewport: { width: 1200, height: 630 } });

for (const card of OG_CARDS) {
  test(`og card ${card.key}`, async ({ page }) => {
    mkdirSync(outDir!, { recursive: true });
    await page.setContent(cardHtml(card.heading, card.text));
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: join(outDir!, `${card.key}.png`), type: 'png' });
  });
}
