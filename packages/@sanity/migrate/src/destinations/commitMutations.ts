import {MultipleMutationResult} from '@sanity/client'
import {fetchAsyncIterator, FetchOptions} from '../fetch-utils/fetchStream'
import {parseJSON} from '../it-utils/json'
import {decodeText} from '../it-utils/decodeText'
import {concatStr} from '../it-utils/concatStr'
import {lastValueFrom} from '../it-utils/lastValueFrom'
import {mapAsync} from '../it-utils/mapAsync'

export async function commitMutations(
  fetchOptions: AsyncIterableIterator<FetchOptions>,
  options: {concurrency: number},
) {
  return mapAsync(
    fetchOptions,
    async (opts): Promise<MultipleMutationResult> =>
      lastValueFrom(parseJSON(concatStr(decodeText(await fetchAsyncIterator(opts))))),
    options.concurrency,
  )
}
