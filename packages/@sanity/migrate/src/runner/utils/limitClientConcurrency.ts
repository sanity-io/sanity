// this is the number of requests allowed inflight at once. this is done to prevent
// the validation library from overwhelming our backend
import {type SanityClient} from '@sanity/client'
import {createClientConcurrencyLimiter} from '@sanity/util/client'

const MAX_FETCH_CONCURRENCY = 10

export const limitClientConcurrency: (input: SanityClient) => SanityClient =
  createClientConcurrencyLimiter(MAX_FETCH_CONCURRENCY)
