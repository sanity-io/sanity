import {ClientError, ServerError} from '@sanity/client'
import {
  type TransactionLogEventWithMutations,
  type TransactionLogEventWithEffects,
} from '@sanity/types'

import {DEFAULT_STUDIO_CLIENT_HEADERS} from '../../studioClient'

type StreamResult =
  | (TransactionLogEventWithEffects & TransactionLogEventWithMutations)
  | {error: {description?: string; type: string}}

export async function getJsonStream(
  url: string,
  token: string | undefined,
): Promise<ReadableStream<StreamResult>> {
  const options: RequestInit = token
    ? {headers: {...DEFAULT_STUDIO_CLIENT_HEADERS, Authorization: `Bearer ${token}`}}
    : {credentials: 'include', headers: DEFAULT_STUDIO_CLIENT_HEADERS}
  const response = await fetch(url, options)
  if (!response.ok) {
    throw await toHttpError(response, url)
  }
  return getStream(response)
}

/**
 * Builds the same error `@sanity/client` throws for a non-OK response, so callers (and the studio's
 * request-error handler, which only claims `HttpError`s) can treat translog failures like any other
 * API failure: `statusCode`, `response.headers` (e.g. `retry-after`) and the API's error message.
 */
async function toHttpError(response: Response, url: string): Promise<Error> {
  const text = await response.text()
  const headers = Object.fromEntries(response.headers.entries())
  let body: unknown = text
  if ((headers['content-type'] || '').includes('application/json')) {
    try {
      body = JSON.parse(text)
    } catch {
      // keep the raw text
    }
  }
  const res = {
    statusCode: response.status,
    statusMessage: response.statusText,
    headers,
    body,
    url,
    method: 'GET',
  }
  return response.status >= 500 ? new ServerError(res) : new ClientError(res)
}

function getStream(response: Response): ReadableStream<StreamResult> {
  const body = response.body
  if (!body) {
    throw new Error('Failed to read body from response')
  }

  let reader: ReadableStreamDefaultReader<Uint8Array>
  let cancelled = false

  return new ReadableStream<TransactionLogEventWithEffects & TransactionLogEventWithMutations>({
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
              void reader.cancel()
              return
            }
          }

          buffer = lines[lines.length - 1]

          return reader
            .read()
            .then(processResult)
            .catch((err) => controller.error(err))
        })
        .catch((err) => controller.error(err))
    },

    cancel(): void {
      cancelled = true
      void reader.cancel()
    },
  })
}
