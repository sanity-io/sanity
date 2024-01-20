/* eslint-disable no-bitwise,callback-return */
import {BufferList} from './BufferList'
import * as headers from './headers'
import {type TarHeader} from './headers'

// Inspired by
// - https://github.com/alanshaw/it-tar/blob/master/src/extract.ts
// - https://github.com/mafintosh/tar-stream/blob/master/extract.js

const emptyReadableStream = () =>
  new ReadableStream({
    pull(controller) {
      controller.close()
    },
  })

export function untar(
  stream: ReadableStream<Uint8Array>,
  options: {
    filenameEncoding?: BufferEncoding
    allowUnknownFormat?: boolean
  } = {},
): ReadableStream<[header: TarHeader, entry: ReadableStream<Uint8Array>]> {
  const buffer = new BufferList()

  const reader = stream.getReader()

  let readingChunk = false
  return new ReadableStream({
    async pull(controller) {
      if (readingChunk) {
        return
      }
      const {done, value} = await reader.read()

      if (!done) {
        buffer.push(value)
      }

      const headerChunk = buffer.shift(512)
      if (!headerChunk) {
        throw new Error('Unexpected end of tar file. Expected 512 bytes of headers.')
      }

      const header = headers.decode(
        headerChunk,
        options.filenameEncoding ?? 'utf-8',
        options.allowUnknownFormat ?? false,
      )
      if (header) {
        if (header.size === null || header.size === 0 || header.type === 'directory') {
          controller.enqueue([header, emptyReadableStream()])
        } else {
          readingChunk = true
          controller.enqueue([
            header,
            entryStream(reader, header.size!, buffer, () => {
              readingChunk = false
            }),
          ])
        }
      } else if (done) {
        // note - there might be more data in the buffer, after the input stream is done
        // so only complete if we couldn't find a header
        controller.close()
      }
    },
  })
}

function entryStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  expectedBytes: number,
  buffer: BufferList,
  next: () => void,
) {
  let totalBytesRead = 0
  // let pulling = false
  return new ReadableStream({
    async pull(controller) {
      const {done, value} = await reader.read()
      const remaining = expectedBytes - totalBytesRead

      if (!done) {
        buffer.push(value)
      }

      const chunk = buffer.shiftFirst(remaining)
      if (!chunk) {
        throw new Error('Premature end of tar stream')
      }
      controller.enqueue(chunk)
      totalBytesRead += chunk!.byteLength
      if (chunk?.byteLength === remaining) {
        // We've reached the end of the entry, discard any padding at the end (
        discardPadding(buffer, expectedBytes)
        controller.close()
        next()
      }
    },
  })
}

function getPadding(size: number) {
  size &= 511
  return size === 0 ? 0 : 512 - size
}

function discardPadding(bl: BufferList, size: number) {
  const overflow = getPadding(size)
  if (overflow > 0) {
    bl.shift(overflow)
  }
}
