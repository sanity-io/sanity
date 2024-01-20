import {type FileHandle, open, unlink} from 'node:fs/promises'

import baseDebug from '../debug'

const debug = baseDebug.extend('bufferThroughFile')

const CHUNK_SIZE = 1024

/**
 * Takes a source stream that will be drained and written to the provided file name as fast as possible.
 * and returns a function that can be called to create multiple readable stream on top of the buffer file.
 * It will start pulling data from the source stream once the first readableStream is created, writing to the buffer file in the background.
 * The readable streams and can be read at any rate (but will not receive data faster than the buffer file is written to).
 * Note: by default, buffering will run to completion, and this may prevent the process from exiting after done reading from the
 * buffered streams. To stop writing to the buffer file, an AbortSignal can be provided and once it's controller aborts, the buffer file will
 * stop. After the signal is aborted, no new buffered readers can be created.
 *
 * @param source - The source readable stream. Will be drained as fast as possible.
 * @param filename - The filename to write to.
 * @param options - Optional AbortSignal to stop writing to the buffer file.
 * @returns A function that can be called multiple times to create a readable stream on top of the buffer file.
 */
export function bufferThroughFile(
  source: ReadableStream<Uint8Array>,
  filename: string,
  options?: {signal: AbortSignal; keepFile?: boolean},
) {
  const signal = options?.signal

  let writeHandle: FileHandle
  let readHandle: Promise<FileHandle> | null

  // Whether the all data has been written to the buffer file.
  let bufferDone = false

  signal?.addEventListener('abort', async () => {
    debug('Aborting bufferThroughFile')
    await Promise.all([
      writeHandle && writeHandle.close(),
      readHandle && (await readHandle).close(),
    ])
  })

  // Number of active readers. When this reaches 0, the read handle will be closed.
  let readerCount = 0
  let ready: Promise<void>

  async function pump(reader: ReadableStreamDefaultReader<Uint8Array>) {
    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const {done, value} = await reader.read()
        if (done || signal?.aborted) {
          // if we're done reading, or the primary reader has been cancelled, stop writing to the buffer file
          return
        }
        await writeHandle.write(value)
      }
    } finally {
      await writeHandle.close()
      bufferDone = true
      reader.releaseLock()
    }
  }

  function createBufferedReader() {
    let totalBytesRead = 0

    return async function tryReadFromBuffer(handle: FileHandle) {
      const {bytesRead, buffer} = await handle.read(
        new Uint8Array(CHUNK_SIZE),
        0,
        CHUNK_SIZE,
        totalBytesRead,
      )
      if (bytesRead === 0 && !bufferDone && !signal?.aborted) {
        debug('Not enough data in buffer file, waiting for more data to be written')
        // we're waiting for more data to be written to the buffer file, try again
        return tryReadFromBuffer(handle)
      }
      totalBytesRead += bytesRead
      return {bytesRead, buffer}
    }
  }

  function init(): Promise<void> {
    if (!ready) {
      ready = (async () => {
        debug('Initializing bufferThroughFile')
        writeHandle = await open(filename, 'w')
        // start pumping data from the source stream to the buffer file
        // note, don't await this, as it will block the ReadableStream.start() method
        debug('Start buffering source stream to file')
        pump(source.getReader()).then(() => {
          debug('Buffering source stream to buffer file')
        })
      })()
    }
    return ready
  }

  function getReadHandle(): Promise<FileHandle> {
    if (!readHandle) {
      debug('Opening read handle on %s', filename)
      readHandle = open(filename, 'r')
    }
    return readHandle
  }

  function onReaderStart() {
    readerCount++
  }
  async function onReaderEnd() {
    readerCount--
    if (readerCount === 0 && readHandle) {
      const handle = readHandle
      readHandle = null
      debug('Closing read handle on %s', filename)
      await (await handle).close()
      if (options?.keepFile !== true) {
        debug('Removing buffer file', filename)
        await unlink(filename)
      }
    }
  }

  return () => {
    const readChunk = createBufferedReader()

    let didEnd = false
    function onEnd() {
      if (didEnd) {
        return
      }
      didEnd = true
      onReaderEnd()
    }
    return new ReadableStream<Uint8Array>({
      async start() {
        if (signal?.aborted) {
          throw new Error('Cannot create new buffered readers on aborted stream')
        }
        debug('Reader started reading from file handle')
        onReaderStart()
        await init()
        await getReadHandle()
      },
      async pull(controller) {
        if (!readHandle) {
          throw new Error('Cannot read from closed handle')
        }
        const {bytesRead, buffer} = await readChunk(await readHandle)
        if (bytesRead === 0 && bufferDone) {
          debug('Reader done reading from file handle')
          await onEnd()
          controller.close()
        } else {
          controller.enqueue(buffer.subarray(0, bytesRead))
        }
      },
      cancel() {
        onEnd()
      },
    })
  }
}
