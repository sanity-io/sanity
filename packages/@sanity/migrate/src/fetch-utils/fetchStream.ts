import {streamAsyncIterator} from '../utils/streamToAsyncIterator'

export interface FetchOptions {
  url: string | URL
  init: RequestInit
}
export interface HTTPError extends Error {
  statusCode: number
}

export function assert2xx(res: Response) {
  if (res.status < 200 || res.status > 299) {
    const err = new Error(`HTTP Error ${res.status}: ${res.statusText}`) as HTTPError
    err.statusCode = res.status
    throw err
  }
}

export async function fetchAsyncIterator({url, init}: FetchOptions) {
  const response = await fetch(url, init)
  assert2xx(response)
  if (response.body === null) throw new Error('No response received')
  return streamAsyncIterator(response.body)
}
