import type {FileHandle} from 'node:fs/promises'
import {open} from 'node:fs/promises'

export function readFileAsWebStream(filename: string): ReadableStream<Uint8Array> {
  const CHUNK_SIZE = 1024

  let fileHandle: FileHandle
  let position = 0

  return new ReadableStream({
    async start() {
      fileHandle = await open(filename, 'r')
    },
    async pull(controller) {
      const buffer = new Uint8Array(CHUNK_SIZE)

      const {bytesRead} = await fileHandle.read(buffer, 0, CHUNK_SIZE, position)
      if (bytesRead === 0) {
        await fileHandle.close()
        controller.close()
      } else {
        position += bytesRead
        controller.enqueue(buffer.subarray(0, bytesRead))
      }
    },

    cancel() {
      return fileHandle.close()
    },
  })
}
