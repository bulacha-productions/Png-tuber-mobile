const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function createIconPng(width, height) {
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  const cx = width / 2;
  const cy = height / 2;
  const cornerRadius = width * 0.22;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;

      // Rounded squircle mask
      const qx = Math.max(0, Math.abs(x - cx) - (cx - cornerRadius));
      const qy = Math.max(0, Math.abs(y - cy) - (cy - cornerRadius));
      const distFromCorner = Math.sqrt(qx * qx + qy * qy);

      if (distFromCorner > cornerRadius) {
        // Outside squircle: transparent
        rawData[pixelOffset] = 0;
        rawData[pixelOffset + 1] = 0;
        rawData[pixelOffset + 2] = 0;
        rawData[pixelOffset + 3] = 0;
        continue;
      }

      // Vertical Gradient: from royal blue (#3B82F6 -> #4F46E5) to deep indigo/purple (#1E1B4B)
      const t = y / height;
      let r = Math.round(59 * (1 - t) + 30 * t);
      let g = Math.round(130 * (1 - t) + 27 * t);
      let b = Math.round(246 * (1 - t) + 75 * t);
      let a = 255;

      // Top right microphone icon (( 🎙️ ))
      const micCenterX = width * 0.72;
      const micCenterY = height * 0.18;
      const dMic = Math.hypot(x - micCenterX, y - micCenterY);

      // Mic capsule
      const inMicCapsule = Math.abs(x - micCenterX) <= width * 0.026 && Math.abs(y - micCenterY) <= height * 0.045;
      // Mic stand arc
      const inStandArc = (dMic >= width * 0.038 && dMic <= width * 0.046) && y >= micCenterY;
      // Sound waves
      const inSoundWaveL = Math.hypot(x - (micCenterX - width * 0.07), y - micCenterY) <= width * 0.008;
      const inSoundWaveR = Math.hypot(x - (micCenterX + width * 0.07), y - micCenterY) <= width * 0.008;

      if (inMicCapsule || inStandArc || inSoundWaveL || inSoundWaveR) {
        r = 255; g = 255; b = 255;
      }

      // Anime girl head silhouette (Center)
      const headCenterX = cx;
      const headCenterY = height * 0.46;
      const dHead = Math.hypot(x - headCenterX, y - headCenterY);

      // Face & hair mass
      const inHeadMass = dHead <= width * 0.24;
      // Left Ponytail
      const inPonytail = Math.hypot(x - (headCenterX - width * 0.22), y - (headCenterY - height * 0.04)) <= width * 0.09;

      if (inHeadMass || inPonytail) {
        // Base white silhouette
        r = 255; g = 255; b = 255;

        // Hair sparkle (dark purple star)
        const dSparkle = Math.hypot(x - (headCenterX - width * 0.12), y - (headCenterY - height * 0.14));
        if (dSparkle <= width * 0.025) {
          r = 79; g = 70; b = 229;
        }

        // Anime Eyes (Cute dark vertical pills)
        const eyeLX = headCenterX - width * 0.05;
        const eyeRX = headCenterX + width * 0.08;
        const eyeY = headCenterY + height * 0.03;
        const inEyeL = Math.abs(x - eyeLX) <= width * 0.018 && Math.abs(y - eyeY) <= height * 0.032;
        const inEyeR = Math.abs(x - eyeRX) <= width * 0.018 && Math.abs(y - eyeY) <= height * 0.032;

        if (inEyeL || inEyeR) {
          r = 30; g = 27; b = 75;
        }

        // Lavender Blush cheeks
        const blushLX = headCenterX - width * 0.10;
        const blushRX = headCenterX + width * 0.13;
        const blushY = headCenterY + height * 0.07;
        const inBlushL = Math.hypot(x - blushLX, (y - blushY) * 1.5) <= width * 0.03;
        const inBlushR = Math.hypot(x - blushRX, (y - blushY) * 1.5) <= width * 0.03;

        if (inBlushL || inBlushR) {
          r = 196; g = 181; b = 253; // #C4B5FD
        }

        // Cute smiling mouth
        const mouthX = headCenterX + width * 0.015;
        const mouthY = headCenterY + height * 0.08;
        const dMouth = Math.hypot(x - mouthX, y - mouthY);
        if (dMouth <= width * 0.018 && y >= mouthY) {
          r = 30; g = 27; b = 75;
        }
      }

      // Bottom Text Area Bar highlight
      if (y >= height * 0.78 && y <= height * 0.82) {
        if (Math.abs(x - cx) <= width * 0.35) {
          r = Math.min(255, r + 150);
          g = Math.min(255, g + 150);
          b = Math.min(255, b + 150);
        }
      }
      if (y >= height * 0.86 && y <= height * 0.89) {
        if (Math.abs(x - cx) <= width * 0.22) {
          r = Math.min(255, r + 120);
          g = Math.min(255, g + 130);
          b = Math.min(255, b + 180);
        }
      }

      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  function createChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const crc = crc32(buf.subarray(4, 8 + len));
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let j = 0; j < 8; j++) {
        c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
      }
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  return Buffer.concat([
    signature,
    createChunk('IHDR', ihdr),
    createChunk('IDAT', compressed),
    createChunk('IEND', Buffer.alloc(0))
  ]);
}

// Generate PWA Icons
const publicDir = path.resolve(__dirname, '../public');
fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createIconPng(192, 192));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createIconPng(512, 512));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createIconPng(512, 512));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createIconPng(180, 180));

// Generate Android Native Mipmap Icons
const resDir = path.resolve(__dirname, '../android/app/src/main/res');
const mipmaps = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 }
];

mipmaps.forEach(({ dir, size }) => {
  const targetDir = path.join(resDir, dir);
  fs.mkdirSync(targetDir, { recursive: true });
  const png = createIconPng(size, size);
  fs.writeFileSync(path.join(targetDir, 'ic_launcher.png'), png);
  fs.writeFileSync(path.join(targetDir, 'ic_launcher_round.png'), png);
});

console.log('Successfully generated all icons matching user design!');
