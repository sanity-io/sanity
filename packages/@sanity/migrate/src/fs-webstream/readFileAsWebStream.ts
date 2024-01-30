import type {FileHandle} from 'node:fs/promises'
import {open} from 'node:fs/promises'
import baseDebug from '../debug'

const debug = baseDebug.extend('readFileAsWebStream')

export function readFileAsWebStream(filename: string): ReadableStream<Uint8Array> {
  const CHUNK_SIZE = 1024

  let fileHandle: FileHandle
  let position = 0

  return new ReadableStream({
    async start() {
      debug('Starting readable stream from', filename)
      fileHandle = await open(filename, 'r')
    },
    async pull(controller) {
      const buffer = new Uint8Array(CHUNK_SIZE)

      const {bytesRead} = await fileHandle.read(buffer, 0, CHUNK_SIZE, position)
      if (bytesRead === 0) {
        await fileHandle.close()
        debug('Closing readable stream from', filename)
        controller.close()
      } else {
        position += bytesRead
        controller.enqueue(buffer.subarray(0, bytesRead))
      }
    },

    cancel() {
      debug('Cancelling readable stream from', filename)
      return fileHandle.close()
    },
  })
}
