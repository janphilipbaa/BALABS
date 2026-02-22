import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, 'temporary screenshots');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const url   = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';

// Find next auto-increment index
const existing = fs.readdirSync(dir).filter(f => f.startsWith('screenshot-') && f.endsWith('.png'));
let maxN = 0;
existing.forEach(f => {
  const m = f.match(/^screenshot-(\d+)/);
  if (m) maxN = Math.max(maxN, parseInt(m[1]));
});
const n = maxN + 1;
const filename = label ? `screenshot-${n}-${label}.png` : `screenshot-${n}.png`;
const outPath  = path.join(dir, filename);

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page    = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 800));

// Scroll through page to trigger IntersectionObserver animations
const pageHeight = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < pageHeight; y += 600) {
  await page.evaluate(pos => window.scrollTo(0, pos), y);
  await new Promise(r => setTimeout(r, 120));
}
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise(r => setTimeout(r, 400));

await page.screenshot({ path: outPath, fullPage: true });
await browser.close();

console.log(`Screenshot saved: ${outPath}`);
