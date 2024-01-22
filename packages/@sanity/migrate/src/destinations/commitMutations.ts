import {MultipleMutationResult} from '@sanity/client'
import {fetchAsyncIterator, FetchOptions} from '../fetch-utils/fetchStream'
import {parseJSON} from '../it-utils/json'
import {decodeText} from '../it-utils/decodeText'
import {concatStr} from '../it-utils/concatStr'
import {lastValueFrom} from '../it-utils/lastValueFrom'

export async function commitMutations(
  fetchOptions: AsyncIterableIterator<FetchOptions>,
  options: {concurrency: number},
) {
  // todo: convert to top level import when we can
  const {pMapIterable} = await import('p-map')

  return pMapIterable(
    fetchOptions,
    async (opts): Promise<MultipleMutationResult> =>
      lastValueFrom(parseJSON(concatStr(decodeText(await fetchAsyncIterator(opts))))),
    {concurrency: options.concurrency},
  )
}
