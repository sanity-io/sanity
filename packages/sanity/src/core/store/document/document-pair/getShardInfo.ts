import {type SanityClient} from '@sanity/client'
import {defer, type Observable, of} from 'rxjs'
import {catchError, shareReplay, startWith} from 'rxjs/operators'

import {memoize} from '../utils/createMemoizer'

/** Timeout on request that fetches shard name before reporting latency */
const FETCH_SHARD_TIMEOUT = 20_000

function readShard(url: string): Promise<string | undefined> {
  return fetch(url, {signal: AbortSignal.timeout(FETCH_SHARD_TIMEOUT)}).then(async (response) => {
    const shard = response.headers.get('X-Sanity-Shard') || undefined

    // The ping response is tiny; consuming it lets the browser finish the
    // H2/H3 stream cleanly and avoids long pending receive/cancel timing.
    await response.arrayBuffer().catch(() => undefined)
    return shard
  })
}

// One shared ping per URL for the life of the page. Memoizing the observable
// (not the settled value) means a second checkout joins the in-flight request.
// `refCount: false` keeps a successful execution after the first subscribers
// leave. A failed ping errors that execution: `shareReplay` drops it
// (`resetOnError` defaults to true), and `catchError` reports `undefined` to
// whoever was waiting so the next checkout starts a new request.
const shardInfoForUrl$ = memoize(
  function shardInfoForUrl$(url: string): Observable<string | undefined> {
    return defer(() => readShard(url)).pipe(
      startWith(undefined),
      shareReplay({bufferSize: 1, refCount: false}),
      catchError(() => of(undefined)),
    )
  },
  (url) => url,
)

export function getShardInfo$(client: SanityClient): Observable<string | undefined> {
  try {
    const url = client.getUrl(client.getDataUrl('ping'))
    return shardInfoForUrl$(url)
  } catch {
    return of(undefined)
  }
}
