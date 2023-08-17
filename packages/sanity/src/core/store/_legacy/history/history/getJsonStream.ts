import type {TransactionLogEventWithEffects} from '@sanity/types'

type StreamResult = TransactionLogEventWithEffects | {error: {description?: string; type: string}}

export async function getJsonStream(
  url: string,
  token: string | undefined,
): Promise<ReadableStream<StreamResult>> {
  const options: RequestInit = token
    ? {headers: {Authorization: `Bearer ${token}`}}
    : {credentials: 'include'}
  const response = await fetch(url, options)
  return getStream(response)
}

function getStream(response: Response): ReadableStream<StreamResult> {
  const body = response.body
  if (!body) {
    throw new Error('Failed to read body from response')
  }

  let reader: ReadableStreamDefaultReader<Uint8Array>
  let cancelled = false

  return new ReadableStream<TransactionLogEventWithEffects>({
    start(controller): void | PromiseLike<void> {
      reader = body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      reader
        .read()
        .then(function processResult(result): void | Promise<void> {
          if (result.done) {
            if (cancelled) {
              return
            }

            buffer = buffer.trim()
            if (buffer.length === 0) {
              controller.close()
              return
            }

            controller.enqueue(JSON.parse(buffer))
            controller.close()
            return
          }

          buffer += decoder.decode(result.value, {stream: true})
          const lines = buffer.split('\n')

          for (let i = 0; i < lines.length - 1; ++i) {
            const line = lines[i].trim()
            if (line.length === 0) {
              continue
            }

            try {
              controller.enqueue(JSON.parse(line))
            } catch (err) {
              controller.error(err)
              cancelled = true
              reader.cancel()
              return
            }
          }

          buffer = lines[lines.length - 1]

          // eslint-disable-next-line consistent-return
          return reader
            .read()
            .then(processResult)
            .catch((err) => controller.error(err))
        })
        .catch((err) => controller.error(err))
    },

    cancel(): void {
      cancelled = true
      reader.cancel()
    },
  })
}
