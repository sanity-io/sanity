import FIFO from 'fast-fifo'

import {concatUint8Arrays} from '../uint8arrays'

const EMPTY = new Uint8Array()

// Extracted from https://github.com/mafintosh/tar-stream/blob/master/extract.js#L8 and converted to ts
export class BufferList {
  public buffered: number
  public shifted: number
  private queue: FIFO<Uint8Array>
  private _offset: number

  constructor() {
    this.buffered = 0
    this.shifted = 0
    this.queue = new FIFO()

    this._offset = 0
  }

  push(buffer: Uint8Array) {
    this.buffered += buffer.byteLength
    this.queue.push(buffer)
  }

  shiftFirst(size: number) {
    return this.buffered === 0 ? null : this._next(size)
  }

  shift(size: number) {
    if (size > this.buffered) return null
    if (size === 0) return EMPTY

    let chunk = this._next(size)

    if (size === chunk.byteLength) return chunk // likely case

    const chunks = [chunk]

    while ((size -= chunk.byteLength) > 0) {
      chunk = this._next(size)
      chunks.push(chunk)
    }

    return concatUint8Arrays(chunks)
  }

  private _next(size: number) {
    const buf = this.queue.peek()
    const rem = buf.byteLength - this._offset

    if (size >= rem) {
      const sub = this._offset ? buf.subarray(this._offset, buf.byteLength) : buf
      this.queue.shift()
      this._offset = 0
      this.buffered -= rem
      this.shifted += rem
      return sub
    }

    this.buffered -= size
    this.shifted += size

    return buf.subarray(this._offset, (this._offset += size))
  }
}
