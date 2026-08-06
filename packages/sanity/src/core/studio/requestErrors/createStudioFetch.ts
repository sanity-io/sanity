import {ClientError, type ClientConfig, type SanityClient, ServerError} from '@sanity/client'

import {type RequestFailureDiagnostics} from '../../store/authStore/createAuthStore'
import {type RequestErrorChannel} from './types'

type Fetch = ReturnType<NonNullable<ClientConfig['resolveFetch']>>
type FetchInput = Parameters<Fetch>[0]
type FetchInit = Parameters<Fetch>[1]
type FetchResponse = Awaited<ReturnType<Fetch>>

interface StudioFetchOptions {
  channel: RequestErrorChannel
  diagnostics?: RequestFailureDiagnostics
  fetch: Fetch
  getClient?: () => SanityClient
  waitForCorsRetry?: () => Promise<void>
}

/**
 * Wraps the fetch implementation used by Studio clients so transport-level
 * failures can retain the Studio's global error handling after the client
 * removed its private `_requestHandler` hook.
 *
 * @internal
 */
export function createStudioFetch({
  channel,
  diagnostics,
  fetch,
  getClient,
  waitForCorsRetry,
}: StudioFetchOptions): Fetch {
  return async (input, init) => {
    let failedResponse: FetchResponse | undefined
    const method = getRequestMethod(input, init)

    const execute = async (): Promise<FetchResponse> => {
      try {
        const response = await fetch(input, init)
        if (response.status < 400) return response

        failedResponse = response
        return handleError(
          await responseError(response, input, method),
          diagnostics,
          getClient,
          waitForCorsRetry,
          execute,
        )
      } catch (err) {
        return handleError(err, diagnostics, getClient, waitForCorsRetry, execute)
      }
    }

    try {
      return await channel.attempt(execute, {retryable: method === 'GET' || method === 'HEAD'})
    } catch (err) {
      // The request-error channel deliberately re-throws caller-domain errors.
      // A fetch response for such an error must still reach @sanity/client so
      // it can create its normal ClientError for the call site.
      if (failedResponse) return failedResponse
      throw err
    }
  }
}

async function responseError(
  response: FetchResponse,
  input: FetchInput,
  method: string,
): Promise<ClientError | ServerError> {
  const body = await parseResponseBody(response)
  return response.status >= 500
    ? new ServerError(responseShape(response, input, method, body))
    : new ClientError(responseShape(response, input, method, body))
}

async function handleError(
  error: unknown,
  diagnostics: RequestFailureDiagnostics | undefined,
  getClient: (() => SanityClient) | undefined,
  waitForCorsRetry: (() => Promise<void>) | undefined,
  retry: () => Promise<FetchResponse>,
): Promise<FetchResponse> {
  if (diagnostics && getClient) {
    const result = await diagnostics.diagnose(error, getClient())
    if (result.type !== 'unknown') {
      diagnostics.onRequestFailure(result, getClient())
      if (result.type === 'cors' && waitForCorsRetry) {
        await waitForCorsRetry()
        return retry()
      }
      return new Promise<never>(() => {})
    }
  }

  throw error
}

function getRequestMethod(input: FetchInput, init: FetchInit | undefined): string {
  return (init?.method ?? 'GET').toUpperCase()
}

function responseShape(response: FetchResponse, input: FetchInput, method: string, body: unknown) {
  return {
    body,
    headers: Object.fromEntries(response.headers),
    method,
    statusCode: response.status,
    statusMessage: response.statusText,
    url: getRequestUrl(input),
  }
}

function getRequestUrl(input: FetchInput): string {
  return input
}

async function parseResponseBody(response: FetchResponse): Promise<unknown> {
  const clone = response as FetchResponse & {clone?: () => FetchResponse}
  if (!clone.clone) return undefined

  const text = await clone.clone().text()
  if (!text) return undefined

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}
