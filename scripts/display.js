import puppeteer from 'puppeteer';
import * as fs from 'fs';
import fetch from 'node-fetch';
import { IT8951 } from 'it8951';
import { ENDIANNESS, IMAGE_ROTATION, PIXEL_PACKING, WAVEFORM } from 'it8951';
import * as sharp from 'sharp';
import md5 from 'md5';

const browser = await puppeteer.launch({
  headless: true,
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
console.log('Setting viewport and navigating to page');
await page.setViewport({ width: 1448, height: 1072, deviceScaleFactor: 1 });
await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
console.log('I have navigated');
const screen = new IT8951(-2.33); // Change voltage to what is suggested on your e-paper
console.log('Init screen');

const captureScreenshot = async () => {
  console.log('Getting screenshot');
  await page.screenshot({ path: './build/screenshot.png'});
  return;
}

const fixImage = async (image) => {
  return new Promise(resolve => {
    sharp.default(image).grayscale().raw().toBuffer((err, data) => {
      if (err) {
        console.log('Err with fixImage');
      }
      console.log('Fixed image for display');
      resolve(data);
    });
  });
}

let screenCount = 0;
const clearScreen = async () => {
  const response = await fetch('http://localhost:3000/screenshot.png');
  const arrayBuffer = await response.arrayBuffer();
  const imageToRender = Buffer.from(arrayBuffer);
  const image = await fixImage(imageToRender);
  screen.run(); // Wake up screen
  const info = screen.systemInfo();
  await screen.waitForDisplayReady().catch((err) => { console.log(`SHIT ${err}`); return }); // Wait for screen to be ready

  screen.writePixels( // Write to image buffer
    0, // Top corner
    0, // Left corver
    info.width, // Image width, in this case use full screen size
    info.height, // Image width, in this case use full screen size
    image, // Image buffer
    PIXEL_PACKING.BPP8, // Bits per pixel in image
    IMAGE_ROTATION.ROTATE_180,
    ENDIANNESS.BIG
  );

  screen.displayArea( // Display from image buffer
    0, // Top corner
    0, // Left corner
    info.width, // Image width, in this case use full screen size
    info.height, // Image width, in this case use full screen size
    WAVEFORM.INIT // Refresh mode
  );

  screen.sleep(); // Put display to sleep
}

let count = 0;
let imageMD5 = null;
const displayImage = async () => {
  const response = await fetch('http://localhost:3000/screenshot.png');
  const arrayBuffer = await response.arrayBuffer();
  const imageToRender = Buffer.from(arrayBuffer);
  console.log('Got image');
  const image = await fixImage(imageToRender);
  if (md5(image) === imageMD5) {
    console.log('No need to update image');
    return;
  }
  imageMD5 = md5(image);
  screen.run(); // Wake up screen
  const info = screen.systemInfo();
  await screen.waitForDisplayReady().catch((err) => { console.log(`SHIT ${err}`); return }); // Wait for screen to be ready

  screen.writePixels( // Write to image buffer
    0, // Top corner
    0, // Left corver
    info.width, // Image width, in this case use full screen size
    info.height, // Image width, in this case use full screen size
    image, // Image buffer
    PIXEL_PACKING.BPP8, // Bits per pixel in image
    IMAGE_ROTATION.ROTATE_180,
    ENDIANNESS.BIG
  );

  let waveform = WAVEFORM.DU;
  if (count % 5 === 0) {
    waveform = WAVEFORM.GC16;
  }
  count += 1;

  screen.displayArea( // Display from image buffer
    0, // Top corner
    0, // Left corner
    info.width, // Image width, in this case use full screen size
    info.height, // Image width, in this case use full screen size
    waveform // Refresh mode
  );

  screen.sleep(); // Put display to sleep
}

await displayImage();

setInterval(async() => {
  await captureScreenshot();
  await displayImage();
}, 30000);

setInterval(async() => {
  console.log('Going to reload page');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
}, 3000000);
