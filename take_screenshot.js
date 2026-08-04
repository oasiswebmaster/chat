const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors']
  });

  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE CONSOLE LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message, err.stack));
  page.on('requestfailed', req => console.log('REQUEST FAILED:', req.url(), req.failure() ? req.failure().errorText : ''));

  console.log('Navigating to https://oasisresort.ca...');
  await page.goto('https://oasisresort.ca', { waitUntil: 'load' });

  await new Promise(resolve => setTimeout(resolve, 5000));

  const isOverlayHidden = await page.evaluate(() => {
    const overlay = document.querySelector('[class*="LoadingEmblem-module"]');
    return overlay ? overlay.style.display || getComputedStyle(overlay).display : 'none';
  });

  console.log('LOADING EMBLEM DISPLAY STATUS:', isOverlayHidden);

  await browser.close();
  process.exit(0);
})();
