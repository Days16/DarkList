#!/usr/bin/env node
// Genera resources/icon.png (256x256 RGBA, esquinas redondeadas, icono de lista)
const zlib = require('zlib')
const fs = require('fs')
const path = require('path')

const SIZE = 256
const RADIUS = 52

// CRC32
const crcTable = new Uint32Array(256)
for (let i = 0; i < 256; i++) {
  let c = i
  for (let j = 0; j < 8; j++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  crcTable[i] = c
}
function crc32(buf) {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const t = Buffer.from(type)
  const len = Buffer.allocUnsafe(4); len.writeUInt32BE(data.length)
  const crcBuf = Buffer.allocUnsafe(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, crcBuf])
}

// RGBA pixel buffer
const rgba = Buffer.alloc(SIZE * SIZE * 4) // all transparent

function setPixel(x, y, r, g, b, a) {
  if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return
  const i = (y * SIZE + x) * 4
  rgba[i] = r; rgba[i+1] = g; rgba[i+2] = b; rgba[i+3] = a
}

// Fondo redondeado violeta
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const dx = Math.max(RADIUS - x, x - (SIZE - RADIUS - 1), 0)
    const dy = Math.max(RADIUS - y, y - (SIZE - RADIUS - 1), 0)
    if (dx * dx + dy * dy <= RADIUS * RADIUS) {
      setPixel(x, y, 124, 106, 247, 255)
    }
  }
}

// Dibujar rectángulo sólido (helper)
function fillRect(x1, y1, x2, y2, r, g, b, a) {
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      const i = (y * SIZE + x) * 4
      if (x >= 0 && x < SIZE && y >= 0 && y < SIZE && rgba[i+3] > 0) {
        rgba[i] = r; rgba[i+1] = g; rgba[i+2] = b; rgba[i+3] = a
      }
    }
  }
}

// 3 líneas de tarea (checkbox + línea de texto)
const startY = 80
const gap = 34
for (let row = 0; row < 3; row++) {
  const cy = startY + row * gap
  // Checkbox redondo
  const cx = 78, cr = 9
  for (let y = cy - cr; y <= cy + cr; y++) {
    for (let x = cx - cr; x <= cx + cr; x++) {
      const d = Math.sqrt((x-cx)**2 + (y-cy)**2)
      if (d <= cr) setPixel(x, y, 255, 255, 255, row === 0 ? 230 : 180)
    }
  }
  // Palomita en la primera fila
  if (row === 0) {
    for (let t = 0; t <= 10; t++) {
      setPixel(Math.round(cx - 5 + t * 0.5), Math.round(cy + t * 0.5 - 5), 124, 106, 247, 255)
    }
    for (let t = 0; t <= 6; t++) {
      setPixel(Math.round(cx + 0 + t), Math.round(cy + 5 - t), 124, 106, 247, 255)
    }
  }
  // Línea de texto
  const lineX1 = 100, lineX2 = row === 1 ? 168 : 184, lineH = 7
  fillRect(lineX1, cy - lineH, lineX2, cy + lineH, 255, 255, 255, row === 0 ? 230 : 160)
}

// Cuarta línea más tenue
fillRect(78, startY + 3 * gap - 7, 184, startY + 3 * gap + 7, 255, 255, 255, 60)

// Codificar como PNG RGBA
const raw = Buffer.alloc((SIZE * 4 + 1) * SIZE)
for (let y = 0; y < SIZE; y++) {
  raw[y * (SIZE * 4 + 1)] = 0
  for (let x = 0; x < SIZE; x++) {
    const src = (y * SIZE + x) * 4
    const dst = y * (SIZE * 4 + 1) + 1 + x * 4
    raw.copy(rgba, 0, 0, 0) // no-op, just ensuring copy
    raw[dst]   = rgba[src]
    raw[dst+1] = rgba[src+1]
    raw[dst+2] = rgba[src+2]
    raw[dst+3] = rgba[src+3]
  }
}

const compressed = zlib.deflateSync(raw)
const ihdr = Buffer.allocUnsafe(13)
ihdr.writeUInt32BE(SIZE, 0); ihdr.writeUInt32BE(SIZE, 4)
ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', ihdr),
  chunk('IDAT', compressed),
  chunk('IEND', Buffer.alloc(0))
])

const outDir = path.join(__dirname, '../resources')
fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(path.join(outDir, 'icon.png'), png)
console.log('Icono generado en resources/icon.png (' + SIZE + 'x' + SIZE + ')')
