import {streamAsyncIterator} from '../utils/streamToAsyncIterator'

/**
 * Helper to drain a stream, useful in cases where you want to keep reading a stream but disregard the received chunks.
 * @param stream - the readable stream to drain
 */
export async function drain(stream: ReadableStream<unknown>) {
  for await (const _ of streamAsyncIterator(stream)) {
    // do nothing
  }
}
