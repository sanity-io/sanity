export async function* streamToAsyncIterator<T>(stream: ReadableStream<T>) {
  // Get a lock on the stream
  const reader = stream.getReader()
  try {
    while (true) {
      // Read from the stream
      const {done, value} = await reader.read()

      // Exit if we're done
      if (done) return
      // Else yield the chunk
      yield value
    }
  } finally {
    reader.releaseLock()
  }
}
