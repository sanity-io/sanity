import path from 'node:path'
import readline from 'node:readline'
import {Readable, type Writable} from 'node:stream'
import zlib from 'node:zlib'

import {type SanityDocument} from '@sanity/types'
import tar from 'tar-stream'

const HEADER_SIZE = 300

// https://github.com/kevva/is-gzip/blob/13dab7c877787bd5cff9de5482b1736f00df99c6/index.js
const isGzip = (buf: Buffer) =>
  buf.length >= 3 && buf[0] === 0x1f && buf[1] === 0x8b && buf[2] === 0x08

// https://github.com/watson/is-deflate/blob/f9e8f0c7814eed715e13e29e97c69acee319686a/index.js
const isDeflate = (buf: Buffer) =>
  buf.length >= 2 && buf[0] === 0x78 && (buf[1] === 1 || buf[1] === 0x9c || buf[1] === 0xda)

// https://github.com/kevva/is-tar/blob/d295ffa2002a5d415946fc3d49f024ace8c28bd3/index.js
const isTar = (buf: Buffer) =>
  buf.length >= 262 &&
  buf[257] === 0x75 &&
  buf[258] === 0x73 &&
  buf[259] === 0x74 &&
  buf[260] === 0x61 &&
  buf[261] === 0x72

async function* extract<TReturn>(
  stream: AsyncIterable<Buffer>,
  extractor: Writable & AsyncIterable<TReturn>,
) {
  // set up a task to drain the input iterable into the extractor asynchronously
  // before this function delegates to the extractor's iterable (containing the
  // result of the extraction)
  const drained = new Promise<void>((resolve, reject) => {
    // setTimeout is used here to ensure draining occurs after delegation
    setTimeout(async () => {
      try {
        for await (const chunk of stream) extractor.write(chunk)
        extractor.end()
        resolve()
      } catch (err) {
        reject(err)
      }
    })
  })

  // have this function delegate the results of the extractor
  yield* extractor
  await drained
  extractor.destroy()
}

/**
 * Given a async iterable of buffers, looks at the header of the file in the
 * first few bytes to see the file type then extracts the contents tries again.
 * If the given iterable of buffers is a tarball then it looks for an ndjson
 * files and returns another iterable of buffers with the contents of the
 * ndjson file
 */
async function* maybeExtractNdjson(stream: AsyncIterable<Buffer>): AsyncIterable<Buffer> {
  let buffer = Buffer.alloc(0)

  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk])
    if (buffer.length < HEADER_SIZE) continue

    const fileHeader = buffer
    const restOfStream = async function* restOfStream() {
      yield fileHeader
      yield* stream
    }

    if (isGzip(fileHeader)) {
      yield* maybeExtractNdjson(extract(restOfStream(), zlib.createGunzip()))
      return
    }

    if (isDeflate(fileHeader)) {
      yield* maybeExtractNdjson(extract(restOfStream(), zlib.createDeflate()))
      return
    }

    if (isTar(fileHeader)) {
      for await (const entry of extract(restOfStream(), tar.extract())) {
        const filename = path.basename(entry.header.name)
        const extname = path.extname(filename).toLowerCase()
        // ignore hidden and non-ndjson files
        if (extname !== '.ndjson' || filename.startsWith('.')) continue

        for await (const ndjsonChunk of entry) yield ndjsonChunk
        return
      }
    }

    yield* restOfStream()
  }
}

/**
 * Takes in an async iterable of buffers from an ndjson file or tarball and
 * returns an async iterable of sanity documents.
 */
export async function* extractDocumentsFromNdjsonOrTarball(
  file: AsyncIterable<Buffer>,
): AsyncIterable<SanityDocument> {
  const lines = readline.createInterface({
    input: Readable.from(maybeExtractNdjson(file)),
  })

  for await (const line of lines) {
    const trimmed = line.trim()
    if (trimmed) yield JSON.parse(trimmed) as SanityDocument
  }
  lines.close()
}
