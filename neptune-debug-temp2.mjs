import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page = await browser.newPage();
page.on('console', (msg) => console.log('[console]', msg.type(), msg.text()));
page.on('response', (res) => { if (res.url().includes('/api/')) console.log('[response]', res.status(), res.url()); });

await page.goto('https://neptune.atipicgroup.com', { waitUntil: 'networkidle2', timeout: 30000 });
console.log('--- page loaded, filling ONLY password (email left blank) ---');
await page.type('#neptune-password', 'SomePassword123');
await page.click('button[type="submit"]');
await new Promise((r) => setTimeout(r, 1500));

const validationMsg = await page.$eval('#neptune-email', (el) => el.validationMessage);
console.log('--- email field validationMessage ---', JSON.stringify(validationMsg));
const formStillVisible = await page.$eval('#neptune-login-section', (el) => getComputedStyle(el).display);
console.log('--- login section display after submit attempt ---', formStillVisible);
console.log('--- any /api/login request fired? (see [response] lines above; none = validation blocked it) ---');

await browser.close();
