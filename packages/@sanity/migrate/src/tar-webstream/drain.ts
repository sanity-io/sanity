/* eslint-disable no-constant-condition */
/**
 * Helper to drain a stream, useful in cases where you want to keep reading a stream but disregard the received chunks.
 * @param stream - the readable stream to drain
 */
export async function drain(stream: ReadableStream) {
  const reader = stream.getReader()
  while (true) {
    const {done} = await reader.read()
    if (done) {
      return
    }
  }
}
