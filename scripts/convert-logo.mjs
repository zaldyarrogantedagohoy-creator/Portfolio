import * as Jimp from 'jimp';
import fs from 'fs';

const input = 'src/assets/images/logo.png';
const output = 'src/assets/images/logo.png';

if (!fs.existsSync(input)) {
  throw new Error(`Missing input file: ${input}`);
}

const threshold = 0.98;

async function convert() {
  const image = await Jimp.Jimp.read(input);
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
    const r = this.bitmap.data[idx + 0] / 255;
    const g = this.bitmap.data[idx + 1] / 255;
    const b = this.bitmap.data[idx + 2] / 255;
    if (r >= threshold && g >= threshold && b >= threshold) {
      this.bitmap.data[idx + 3] = 0;
    }
  });
  await new Promise((resolve, reject) => {
    image.write(output, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  console.log('Converted white background to transparent in', output);
}

convert().catch(err => {
  console.error(err);
  process.exit(1);
});
