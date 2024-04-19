import {vercelStegaSplit} from '@vercel/stega'

/**
 * This is a duplicate code from `@sanity/client/stega`
 * Unfortunately, as it stands, the e2e process is pulling in the node version of `@sanity/client` and so we don't have access to the utility as it stands
 * @todo remove once this utility is available in `@vercel/stega`
 *
 * Can take a `result` JSON from a `const {result} = client.fetch(query, params, {filterResponse: false})`
 * and remove all stega-encoded data from it.
 * @alpha
 * @hidden
 */
export function vercelStegaCleanAll<Result = unknown>(result: Result): Result {
  try {
    return JSON.parse(
      JSON.stringify(result, (key, value) => {
        if (typeof value !== 'string') return value
        return vercelStegaSplit(value).cleaned
      }),
    )
  } catch {
    return result
  }
}
