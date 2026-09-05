// One-shot icon generator for the Hive browser extension.
// Draws an amber hexagon badge on dark and encodes real PNGs (no deps, zlib only).
const zlib = require('zlib')
const fs = require('fs')
const path = require('path')

const crcTable = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([td, data])))
  return Buffer.concat([len, td, data, crc])
}

function encodePng(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h)
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}

function pointInPoly(x, y, pts) {
  let inside = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]
    const [xj, yj] = pts[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function makeIcon(size) {
  const buf = Buffer.alloc(size * size * 4)
  const cx = size / 2
  const cy = size / 2
  const R = size * 0.42
  const hex = []
  for (let k = 0; k < 6; k++) {
    const a = (-90 + k * 60) * (Math.PI / 180)
    hex.push([cx + R * Math.cos(a), cy + R * Math.sin(a)])
  }
  const inner = hex.map(([x, y]) => [cx + (x - cx) * 0.62, cy + (y - cy) * 0.62])
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      const px = x + 0.5
      const py = y + 0.5
      let r = 13
      let g = 14
      let b = 17
      if (pointInPoly(px, py, hex)) {
        r = 242
        g = 193
        b = 78
        if (pointInPoly(px, py, inner)) {
          r = 13
          g = 14
          b = 17
        }
      }
      buf[i] = r
      buf[i + 1] = g
      buf[i + 2] = b
      buf[i + 3] = 255
    }
  }
  return encodePng(size, size, buf)
}

const outDir = path.join(__dirname, '..', 'chrome-extension', 'icons')
for (const s of [16, 48, 128]) {
  const out = path.join(outDir, `icon${s}.png`)
  fs.writeFileSync(out, makeIcon(s))
  console.log('wrote', out, fs.statSync(out).size, 'bytes')
}
