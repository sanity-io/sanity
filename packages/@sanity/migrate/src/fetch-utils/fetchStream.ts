import {streamAsyncIterator} from '../utils/streamToAsyncIterator'

export interface FetchOptions {
  url: string | URL
  init: RequestInit
}
export async function fetchAsyncIterator({url, init}: FetchOptions) {
  const body = (await fetch(url, init)).body
  if (body === null) throw new Error('No response received')
  return streamAsyncIterator(body)
}
