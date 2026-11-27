import {inflateSync} from 'node:zlib'

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

export interface PngInfo {
  width: number
  height: number
  /** The smallest rectangle that holds every visible pixel, or `null` when it can't be decoded. */
  bounds: {left: number; top: number; right: number; bottom: number} | null
}

const CHANNELS: Record<number, number> = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}

function paeth(a: number, b: number, c: number) {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)
  if (pa <= pb && pa <= pc) return a
  return pb <= pc ? b : c
}

/**
 * Reads the dimensions of a PNG and the bounding box of its non-transparent pixels. Supports the
 * non-interlaced grayscale, RGB, palette and alpha color types that PokéAPI's sprites use.
 */
export function readPng(buffer: Buffer): PngInfo {
  if (!buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('Not a PNG file')
  }

  let width = 0
  let height = 0
  let bitDepth = 0
  let colorType = 0
  let interlaced = false
  let transparency: Buffer | undefined
  const data: Buffer[] = []

  for (let offset = 8; offset < buffer.length;) {
    const length = buffer.readUInt32BE(offset)
    const type = buffer.toString('ascii', offset + 4, offset + 8)
    const chunk = buffer.subarray(offset + 8, offset + 8 + length)
    offset += 12 + length
    if (type === 'IHDR') {
      width = chunk.readUInt32BE(0)
      height = chunk.readUInt32BE(4)
      bitDepth = chunk[8]
      colorType = chunk[9]
      interlaced = chunk[12] === 1
    } else if (type === 'tRNS') {
      transparency = chunk
    } else if (type === 'IDAT') {
      data.push(chunk)
    } else if (type === 'IEND') {
      break
    }
  }

  const channels = CHANNELS[colorType]
  const hasAlpha = colorType === 4 || colorType === 6 || transparency !== undefined
  if (interlaced || !channels || !hasAlpha) {
    return {width, height, bounds: null}
  }

  const pixels = inflateSync(Buffer.concat(data))
  const bitsPerPixel = channels * bitDepth
  const bytesPerPixel = Math.max(1, bitsPerPixel / 8)
  const rowLength = Math.ceil((width * bitsPerPixel) / 8)
  let previous = Buffer.alloc(rowLength)
  let bounds: PngInfo['bounds'] = null

  const sample = (row: Buffer, x: number, channel: number) => {
    if (bitDepth === 8) return row[x * channels + channel]
    if (bitDepth === 16) return row.readUInt16BE((x * channels + channel) * 2)
    const bit = (x * channels + channel) * bitDepth
    return (row[bit >> 3] >> (8 - bitDepth - (bit & 7))) & ((1 << bitDepth) - 1)
  }

  const isVisible = (row: Buffer, x: number) => {
    if (colorType === 6 || colorType === 4) {
      const alpha = sample(row, x, channels - 1)
      return alpha > (bitDepth === 16 ? 0x0fff : 0x0f)
    }
    if (colorType === 3) {
      const index = sample(row, x, 0)
      return !transparency || index >= transparency.length || transparency[index] > 0x0f
    }
    // Grayscale or RGB with a single transparent color key
    for (let channel = 0; channel < channels; channel++) {
      if (sample(row, x, channel) !== transparency!.readUInt16BE(channel * 2)) return true
    }
    return false
  }

  for (let y = 0; y < height; y++) {
    const start = y * (rowLength + 1)
    const filter = pixels[start]
    const row = Buffer.from(pixels.subarray(start + 1, start + 1 + rowLength))
    for (let i = 0; i < rowLength; i++) {
      const left = i >= bytesPerPixel ? row[i - bytesPerPixel] : 0
      const up = previous[i]
      const upLeft = i >= bytesPerPixel ? previous[i - bytesPerPixel] : 0
      if (filter === 1) row[i] += left
      else if (filter === 2) row[i] += up
      else if (filter === 3) row[i] += (left + up) >> 1
      else if (filter === 4) row[i] += paeth(left, up, upLeft)
    }
    for (let x = 0; x < width; x++) {
      if (!isVisible(row, x)) continue
      if (bounds) {
        bounds.left = Math.min(bounds.left, x)
        bounds.right = Math.max(bounds.right, x + 1)
        bounds.bottom = y + 1
      } else {
        bounds = {left: x, top: y, right: x + 1, bottom: y + 1}
      }
    }
    previous = row
  }

  return {width, height, bounds}
}
