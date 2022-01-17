import puppeteer from 'puppeteer';

const captureScreenshot = async () => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1448, height: 1072 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: './public/screenshot.png'});
  browser.close();
  return;
}

await captureScreenshot();
