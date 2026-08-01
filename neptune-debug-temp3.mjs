import puppeteer from 'puppeteer';
import path from 'path';

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page = await browser.newPage();
page.on('console', (msg) => console.log('[console]', msg.type(), msg.text()));

const resolved = path.resolve('neptune1/index.html').split(path.sep).join('/');
const filePath = 'file:///' + resolved;
await page.goto(filePath, { waitUntil: 'domcontentloaded', timeout: 15000 });
await new Promise((r) => setTimeout(r, 500));

console.log('--- filling ONLY password, email left blank ---');
await page.type('#neptune-password', 'SomePassword123');
await page.click('button[type="submit"]');
await new Promise((r) => setTimeout(r, 500));

const errorState = await page.$eval('#neptuneLoginError', (el) => ({ text: el.textContent, display: getComputedStyle(el).display }));
console.log('--- error element after submit with only password ---', JSON.stringify(errorState));

await browser.close();
