import puppeteer from 'puppeteer';

const url = process.argv[2] || 'https://neptune.atipicgroup.com';

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();

page.on('console', (msg) => console.log('[console]', msg.type(), msg.text()));
page.on('pageerror', (err) => console.log('[pageerror]', err.message));
page.on('requestfailed', (req) => console.log('[requestfailed]', req.url(), req.failure()?.errorText));
page.on('response', (res) => {
  if (res.url().includes('/api/')) {
    console.log('[response]', res.status(), res.url());
  }
});

await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
console.log('--- page loaded ---');

const hasForm = await page.$('#neptuneLoginForm');
console.log('form present:', !!hasForm);

if (hasForm) {
  await page.type('#neptune-email', 'debug-test@example.com');
  await page.type('#neptune-password', 'wrongpassword123');
  console.log('--- submitting form ---');
  await Promise.all([
    page.click('button[type="submit"]'),
  ]);
  await new Promise((r) => setTimeout(r, 3000));

  const errorVisible = await page.$eval('#neptuneLoginError', (el) => ({
    text: el.textContent,
    display: getComputedStyle(el).display,
  })).catch((e) => ({ err: e.message }));
  console.log('--- error element state ---', JSON.stringify(errorVisible));

  const contentVisible = await page.$eval('#neptune-content-section', (el) => getComputedStyle(el).display).catch((e) => e.message);
  console.log('--- content section display ---', contentVisible);
}

await page.screenshot({ path: 'C:\\Users\\Adria\\AppData\\Local\\Temp\\claude\\c--Users-Adria-OneDrive-AMC-website-Claude\\8c034beb-b3a3-4db4-a02d-bfd8aae08c67\\scratchpad\\neptune-debug.png', fullPage: false });
console.log('--- screenshot saved ---');

await browser.close();
