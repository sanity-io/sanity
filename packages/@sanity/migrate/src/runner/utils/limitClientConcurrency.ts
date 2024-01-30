// this is the number of requests allowed inflight at once. this is done to prevent
// the validation library from overwhelming our backend
import {createClientConcurrencyLimiter} from './client-concurrency-limiter/createClientConcurrencyLimiter'

const MAX_FETCH_CONCURRENCY = 10

export const limitClientConcurrency = createClientConcurrencyLimiter(MAX_FETCH_CONCURRENCY)
