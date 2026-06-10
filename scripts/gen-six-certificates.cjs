const fs = require('fs');
const zlib = require('zlib');
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
  crcTable[n] = c >>> 0;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const chunk = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(chunk), 0);
  return Buffer.concat([len, chunk, crc]);
}
function createPng(width, height, r, g, b, a) {
  const header = Buffer.from([137,80,78,71,13,10,26,10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const row = Buffer.alloc(width * 4);
  for (let x = 0; x < width; x++) {
    row[x*4] = r;
    row[x*4 + 1] = g;
    row[x*4 + 2] = b;
    row[x*4 + 3] = a;
  }
  const rows = [];
  for (let y = 0; y < height; y++) rows.push(Buffer.concat([Buffer.from([0]), row]));
  const idat = zlib.deflateSync(Buffer.concat(rows));
  return Buffer.concat([header, pngChunk('IHDR', ihdr), pngChunk('IDAT', idat), pngChunk('IEND', Buffer.alloc(0))]);
}
const backgrounds = [
  [59, 130, 246, 255],
  [16, 185, 129, 255],
  [244, 63, 94, 255],
  [168, 85, 247, 255],
  [245, 158, 11, 255],
  [14, 165, 233, 255]
];
for (let i = 0; i < 6; i++) {
  const file = `public/certificate-${i + 1}.png`;
  const [r, g, b, a] = backgrounds[i];
  const png = createPng(920, 560, r, g, b, a);
  fs.writeFileSync(file, png);
  console.log(`Created ${file}`);
}
