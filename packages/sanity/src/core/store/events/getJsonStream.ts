import {
  ClientError,
  ServerError,
  type RequestHandler,
  type RequestHandlerOptions,
} from '@sanity/client'
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
  /**
   * The studio client request handler, when this fetch runs inside a Studio.
   * History is loaded with `fetch` (NDJSON) rather than through the client, so
   * the fetch runs as the handler's `next`: the handler can renew the token and
   * retry, or claim an invalid session (see {@link withSessionErrorCode}) and
   * keep the promise pending while the studio shows the login screen.
   */
  requestHandler?: RequestHandler,
): Promise<ReadableStream<StreamResult>> {
  const request: RequestHandlerOptions = {
    url,
    method: 'GET',
    headers: token
      ? {...DEFAULT_STUDIO_CLIENT_HEADERS, Authorization: `Bearer ${token}`}
      : DEFAULT_STUDIO_CLIENT_HEADERS,
  }
  if (!requestHandler) return fetchJsonStream(request)
  // `next` resolves to the stream here, not a parsed body: the studio's
  // handlers pass the result through untouched.
  const result = await requestHandler(request, fetchJsonStream)
  if (!(result instanceof ReadableStream)) {
    throw new Error('The request handler did not return the history stream')
  }
  return result
}

async function fetchJsonStream(
  request: RequestHandlerOptions,
): Promise<ReadableStream<StreamResult>> {
  const url = request.url
  const headers = new Headers(request.headers)
  const response = await fetch(url, {
    headers,
    // Without a token, the studio signs in with its cookie.
    ...(headers.has('authorization') ? {} : {credentials: 'include'}),
  })
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
    body: withSessionErrorCode(response.status, body),
    url,
    method: 'GET',
  }
  return response.status >= 500 ? new ServerError(res) : new ClientError(res)
}

/**
 * The API's code for a request that resolves to no session, one of the codes
 * `isInvalidSessionError` treats as an ended session.
 */
const SESSION_NOT_FOUND_ERROR_CODE = 'SIO-401-ANF'

/**
 * History answers a request that carried no credentials with a 401
 * `unauthenticatedError` and no `errorCode`. Studio sends its credential with
 * every history fetch (its token, or its cookie), so that answer means the
 * session is gone. It gets the session-not-found code, so the studio request
 * handler and `isInvalidSessionError` treat it like any other ended session.
 * An `errorCode` the API sends itself is kept.
 */
function withSessionErrorCode(statusCode: number, body: unknown): unknown {
  if (statusCode !== 401 || typeof body !== 'object' || body === null || !('error' in body)) {
    return body
  }
  const {error} = body
  const isUnauthenticated =
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    error.type === 'unauthenticatedError'
  return isUnauthenticated ? {errorCode: SESSION_NOT_FOUND_ERROR_CODE, ...body} : body
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
