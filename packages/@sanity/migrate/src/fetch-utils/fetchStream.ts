import {streamToAsyncIterator} from '../utils/streamToAsyncIterator'

export interface FetchOptions {
  url: string | URL
  init: RequestInit
}
export class HTTPError extends Error {
  statusCode: number

  constructor(statusCode: number, message: string) {
    super(message)
    this.name = 'HTTPError'
    this.statusCode = statusCode
  }
}

export async function assert2xx(res: Response): Promise<void> {
  if (res.status < 200 || res.status > 299) {
    const jsonResponse = await res.json().catch(() => null)

    let message: string

    if (jsonResponse?.error) {
      if (jsonResponse?.error?.description) {
        message = `${jsonResponse?.error?.type || res.status}: ${jsonResponse.error.description}`
      } else {
        message = `${jsonResponse.error}: ${jsonResponse.message}`
      }
    } else {
      message = `HTTP Error ${res.status}: ${res.statusText}`
    }

    throw new HTTPError(res.status, message)
  }
}

export async function fetchStream({url, init}: FetchOptions) {
  const response = await fetch(url, init)
  await assert2xx(response)
  if (response.body === null) throw new Error('No response received')
  return response.body
}

export async function fetchAsyncIterator(options: FetchOptions) {
  return streamToAsyncIterator(await fetchStream(options))
}
