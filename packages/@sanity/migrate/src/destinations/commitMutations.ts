import {type MultipleMutationResult} from '@sanity/client'

import {fetchAsyncIterator, type FetchOptions} from '../fetch-utils/fetchStream'
import {concatStr} from '../it-utils/concatStr'
import {decodeText} from '../it-utils/decodeText'
import {parseJSON} from '../it-utils/json'
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
