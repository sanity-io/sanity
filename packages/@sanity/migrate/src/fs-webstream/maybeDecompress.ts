import {peekInto} from './peekInto'

function isGzip(buffer: Uint8Array) {
  return buffer.length > 3 && buffer[0] === 0x1f && buffer[1] === 0x8b && buffer[2] === 0x08
}

function isDeflate(buf: Uint8Array) {
  return buf.length > 2 && buf[0] === 0x78 && (buf[1] === 1 || buf[1] === 0x9c || buf[1] === 0xda)
}

export async function maybeDecompress(readable: ReadableStream<Uint8Array>) {
  const [head, stream] = await peekInto(readable, {size: 10})
  if (isGzip(head)) {
    return stream.pipeThrough(new DecompressionStream('gzip'))
  }
  if (isDeflate(head)) {
    return stream.pipeThrough(new DecompressionStream('deflate-raw'))
  }
  return stream
}
