import {streamAsyncIterator} from '../utils/streamToAsyncIterator'

export interface FetchOptions {
  url: string | URL
  init: RequestInit
}
export interface HTTPError extends Error {
  statusCode: number
}

export async function assert2xx(res: Response): Promise<void> {
  if (res.status < 200 || res.status > 299) {
    const response = await res.json()

    const message = response.error
      ? response.error.description
      : `HTTP Error ${res.status}: ${res.statusText}`

    const err = new Error(message) as HTTPError
    err.statusCode = res.status
    throw err
  }
}

export async function fetchAsyncIterator({url, init}: FetchOptions) {
  const response = await fetch(url, init)
  await assert2xx(response)
  if (response.body === null) throw new Error('No response received')
  return streamAsyncIterator(response.body)
}
