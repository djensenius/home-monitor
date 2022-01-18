import puppeteer from 'puppeteer';
import * as fs from 'fs';
import fetch from 'node-fetch';
import { IT8951 } from 'it8951';
import { ENDIANNESS, IMAGE_ROTATION, PIXEL_PACKING, WAVEFORM } from 'it8951';
import * as sharp from 'sharp';

const captureScreenshot = async () => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1448, height: 1072, deviceScaleFactor: 1 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: './public/screenshot.png'});
  browser.close();
  return;
}

const fixImage = async (image) => {
  return new Promise(resolve => {
    console.log(sharp);
    sharp.default(image).grayscale().raw().toBuffer((err, data) => {
      if (err) {
        console.log('Err with fixImage');
      }
      console.log('resolving');
      resolve(data);
    });
  });
}

const displayImage = async () => {
  const response = await fetch('http://localhost:3000/screenshot.png');
  const arrayBuffer = await response.arrayBuffer();
  const imageToRender = Buffer.from(arrayBuffer);
  console.log('Got image');
  const image = await fixImage(imageToRender);
  console.log('Fix image');
  const screen = new IT8951(2330); // Change voltage to what is suggested on your e-paper
  screen.run(); // Wake up screen
  const info = screen.systemInfo();
  await screen.waitForDisplayReady(); // Wait for screen to be ready

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
    WAVEFORM.GC16 // Refresh mode
  );

  screen.sleep(); // Put display to sleep
}

console.log('Going to screenshot');
await captureScreenshot();
console.log('Going to display?!?');
await displayImage();
console.log('Done display');
