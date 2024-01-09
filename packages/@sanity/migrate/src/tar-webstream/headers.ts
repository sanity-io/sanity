/* eslint-disable no-bitwise */
// Extracted from https://github.com/mafintosh/tar-stream/blob/master/headers.js
// Converted to TypeScript and removed reliance on Node Buffers

import {areUint8ArraysEqual} from '../uint8arrays'

const ZERO_OFFSET = '0'.charCodeAt(0)
const USTAR_MAGIC = new Uint8Array([0x75, 0x73, 0x74, 0x61, 0x72, 0x00]) // ustar\x00
const GNU_MAGIC = new Uint8Array([0x75, 0x73, 0x74, 0x61, 0x72, 0x20]) // ustar\x20
const GNU_VER = new Uint8Array([0x20, 0x00])
const MAGIC_OFFSET = 257
const VERSION_OFFSET = 263

export type TarEntryType =
  | 'file'
  | 'link'
  | 'symlink'
  | 'directory'
  | 'block-device'
  | 'character-device'
  | 'fifo'
  | 'contiguous-file'

export interface TarHeader {
  // type of entry. defaults to file. can be:
  // file | link | symlink | directory | block-device
  // character-device | fifo | contiguous-file
  type: TarEntryType | null
  // entry name
  name: string
  // entry size. defaults to 0
  size: number | null
  // entry mode. defaults to 0o755 for dirs and 0o644 otherwise
  mode: number | null
  // uid of entry owner. defaults to 0
  uid: number | null
  // gid of entry owner. defaults to 0
  gid: number | null
  // last modified date for entry. defaults to now.
  mtime: Date | null
  // linked file name. only valid for type 'link' and 'symlink' entries
  linkname: string | null
  // uname of entry owner. defaults to null
  uname: string
  // gname of entry owner. defaults to null
  gname: string
  // device major version. defaults to 0
  devmajor: number | null
  // device minor version. defaults to 0
  devminor: number | null
}

export function decode(
  buf: Uint8Array,
  filenameEncoding: BufferEncoding,
  allowUnknownFormat: boolean,
): TarHeader | null {
  let typeflag = buf[156] === 0 ? 0 : buf[156] - ZERO_OFFSET

  let name = decodeStr(buf, 0, 100, filenameEncoding)
  const mode = decodeOct(buf, 100, 8)
  const uid = decodeOct(buf, 108, 8)
  const gid = decodeOct(buf, 116, 8)
  const size = decodeOct(buf, 124, 12)
  const mtime = decodeOct(buf, 136, 12)
  const type = toType(typeflag)
  const linkname = buf[157] === 0 ? null : decodeStr(buf, 157, 100, filenameEncoding)
  const uname = decodeStr(buf, 265, 32)
  const gname = decodeStr(buf, 297, 32)
  const devmajor = decodeOct(buf, 329, 8)
  const devminor = decodeOct(buf, 337, 8)

  const c = cksum(buf)

  // checksum is still initial value if header was null.
  if (c === 8 * 32) return null

  // valid checksum
  if (c !== decodeOct(buf, 148, 8)) {
    throw new Error('Invalid tar header. Maybe the tar is corrupted or it needs to be gunzipped?')
  }

  if (isUSTAR(buf)) {
    // ustar (posix) format.
    // prepend prefix, if present.
    if (buf[345]) name = `${decodeStr(buf, 345, 155, filenameEncoding)}/${name}`
  } else if (isGNU(buf)) {
    // 'gnu'/'oldgnu' format. Similar to ustar, but has support for incremental and
    // multi-volume tarballs.
  } else if (!allowUnknownFormat) {
    throw new Error('Invalid tar header: unknown format.')
  }

  // to support old tar versions that use trailing / to indicate dirs
  if (typeflag === 0 && name && name[name.length - 1] === '/') typeflag = 5

  return {
    type: type as TarEntryType,
    name,
    mode,
    uid,
    gid,
    size,
    mtime: mtime ? new Date(1000 * mtime) : null,
    linkname,
    uname,
    gname,
    devmajor,
    devminor,
  }
}

function isUSTAR(buf: Uint8Array) {
  return areUint8ArraysEqual(USTAR_MAGIC, buf.subarray(MAGIC_OFFSET, MAGIC_OFFSET + 6))
}

function isGNU(buf: Uint8Array) {
  return (
    areUint8ArraysEqual(GNU_MAGIC, buf.subarray(MAGIC_OFFSET, MAGIC_OFFSET + 6)) &&
    areUint8ArraysEqual(GNU_VER, buf.subarray(VERSION_OFFSET, VERSION_OFFSET + 2))
  )
}

function clamp(index: number, len: number, defaultValue: number) {
  if (typeof index !== 'number') return defaultValue
  index = ~~index // Coerce to integer.
  if (index >= len) return len
  if (index >= 0) return index
  index += len
  if (index >= 0) return index
  return 0
}
function toType(flag: number) {
  switch (flag) {
    case 0:
      return 'file'
    case 1:
      return 'link'
    case 2:
      return 'symlink'
    case 3:
      return 'character-device'
    case 4:
      return 'block-device'
    case 5:
      return 'directory'
    case 6:
      return 'fifo'
    case 7:
      return 'contiguous-file'
    case 72:
      return 'pax-header'
    case 55:
      return 'pax-global-header'
    case 27:
      return 'gnu-long-link-path'
    case 28:
    case 30:
      return 'gnu-long-path'
    default:
      return null
  }
}

function indexOf(block: Uint8Array, num: number, offset: number, end: number) {
  for (; offset < end; offset++) {
    if (block[offset] === num) return offset
  }
  return end
}

function cksum(block: Uint8Array) {
  let sum = 8 * 32
  for (let i = 0; i < 148; i++) sum += block[i]
  for (let j = 156; j < 512; j++) sum += block[j]
  return sum
}

/* Copied from the node-tar repo and modified to meet
 * tar-stream coding standard.
 *
 * Source: https://github.com/npm/node-tar/blob/51b6627a1f357d2eb433e7378e5f05e83b7aa6cd/lib/header.js#L349
 */
function parse256(buf: Uint8Array) {
  // first byte MUST be either 80 or FF
  // 80 for positive, FF for 2's comp
  let positive
  if (buf[0] === 0x80) positive = true
  else if (buf[0] === 0xff) positive = false
  else return null

  // build up a base-256 tuple from the least sig to the highest
  const tuple = []
  let i
  for (i = buf.length - 1; i > 0; i--) {
    const byte = buf[i]
    if (positive) tuple.push(byte)
    else tuple.push(0xff - byte)
  }

  let sum = 0
  const l = tuple.length
  for (i = 0; i < l; i++) {
    sum += tuple[i] * Math.pow(256, i)
  }

  return positive ? sum : -1 * sum
}

const decoders: {[encoding: string]: TextDecoder} = {}
const getCachedDecoder = (encoding: string) => {
  if (!(encoding in decoders)) {
    decoders[encoding] = new TextDecoder(encoding)
  }
  return decoders[encoding]
}

function toString(uint8: Uint8Array, encoding = 'utf-8') {
  return getCachedDecoder(encoding).decode(uint8)
}

function decodeOct(val: Uint8Array, offset: number, length: number) {
  val = val.subarray(offset, offset + length)
  offset = 0
  // If prefixed with 0x80 then parse as a base-256 integer
  if (val[offset] & 0x80) {
    return parse256(val)
  }
  // Older versions of tar can prefix with spaces
  while (offset < val.length && val[offset] === 32) offset++
  const end = clamp(indexOf(val, 32, offset, val.length), val.length, val.length)
  while (offset < end && val[offset] === 0) offset++
  if (end === offset) return 0
  return parseInt(toString(val.subarray(offset, end)), 8)
}

function decodeStr(val: Uint8Array, offset: number, length: number, encoding?: string) {
  return toString(val.subarray(offset, indexOf(val, 0, offset, offset + length)), encoding)
}
