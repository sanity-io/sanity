export function asyncIterableToStream<T>(it: AsyncIterableIterator<T>) {
  return new ReadableStream({
    async pull(controller) {
      const {value, done} = await it.next()
      if (done) {
        controller.close()
      } else {
        controller.enqueue(value)
      }
    },
  })
}
