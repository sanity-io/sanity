import {FileHandle, open} from 'node:fs/promises'

const CHUNK_SIZE = 1024

/**
 * Takes a source stream that will be drained and written to the provided file name as fast as possible.
 * and returns a readable stream that reads from the same buffer file. The returned stream can be read at any rate.
 * Note: the returned stream needs to be explicitly cancelled, otherwise it will run to completion and potentially
 * prevent the process from exiting until the whole source stream has been written.
 * @param source - The source readable stream. Will be drained as fast as possible.
 * @param filename - The filename to write to.
 */
export function bufferThroughFile(source: ReadableStream, filename: string) {
  let fileHandle: FileHandle
  let totalBytesRead = 0
  let totalBytesWritten = 0

  let bufferDone = false
  let readerDone = false

  async function pump(reader: ReadableStreamDefaultReader) {
    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const {done, value} = await reader.read()
        if (done || readerDone) return
        await fileHandle.write(value)
        totalBytesWritten += value.byteLength
      }
    } finally {
      reader.releaseLock()
    }
  }

  async function tryReadFromBuffer() {
    const {bytesRead, buffer} = await fileHandle.read(
      new Uint8Array(CHUNK_SIZE),
      0,
      CHUNK_SIZE,
      totalBytesRead,
    )
    if (bytesRead === 0 && !bufferDone && !readerDone) {
      // we're waiting for more data to be written to the buffer file, try again
      return tryReadFromBuffer()
    }
    return {bytesRead, buffer}
  }

  return new ReadableStream({
    async start() {
      fileHandle = await open(filename, 'w+')
      // Note: do not await this, as it will block the stream from starting
      pump(source.getReader()).then(() => {
        bufferDone = true
      })
    },
    async pull(controller) {
      const {bytesRead, buffer} = await tryReadFromBuffer()
      if (bytesRead === 0 && bufferDone) {
        await fileHandle.close()
        controller.close()
      } else {
        totalBytesRead += bytesRead
        controller.enqueue(buffer.subarray(0, bytesRead))
      }
    },
    async cancel() {
      readerDone = true
      await fileHandle?.close()
    },
  })
}
