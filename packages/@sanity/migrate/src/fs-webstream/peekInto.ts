import {concatUint8Arrays} from '../uint8arrays'

export function peekInto(readable: ReadableStream, options: {size: number}) {
  const {size} = options
  return new Promise<[head: Uint8Array, ReadableStream]>((resolve, reject) => {
    let totalBytesRead = 0
    let streamCompleted = false
    const chunks: Array<Uint8Array> = []
    const reader = readable.getReader()

    function settled() {
      const head = concatUint8Arrays(chunks)
      resolve([
        head,
        new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(head)
            if (streamCompleted) {
              controller.close()
            }
          },
          async pull(controller) {
            const {done, value} = await reader.read()
            if (done) {
              controller.close()
            } else {
              controller.enqueue(value)
            }
          },
        }),
      ])
    }
    ;(async () => {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const {done, value: chunk} = await reader.read()
        if (done) {
          streamCompleted = true
          break
        } else {
          totalBytesRead += chunk.byteLength
          chunks.push(chunk)
          if (totalBytesRead >= size) {
            break
          }
        }
      }
    })().then(settled, reject)
  })
}
