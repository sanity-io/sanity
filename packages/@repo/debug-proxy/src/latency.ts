import {Subscription} from 'rxjs'

import {type ProxyHandler} from './createDebugProxy'

export interface LatencyOptions {
  /** Minimum delay per request, in milliseconds. */
  minMs: number
  /** Maximum delay per request, in milliseconds. Equal to minMs = fixed delay. */
  maxMs: number
}

/**
 * Wrap a handler so each request is held back by a random delay in
 * [minMs, maxMs] before being forwarded upstream — simulating a slow network
 * at the request level (time to first byte). For per-event latency on a live
 * SSE stream, see `randomLatency` in the scenarios module.
 */
export function withLatency(handler: ProxyHandler, {minMs, maxMs}: LatencyOptions): ProxyHandler {
  return (req, res, target) => {
    const subscription = new Subscription()
    const delay = Math.round(minMs + Math.random() * (maxMs - minMs))
    const timeout = setTimeout(() => {
      // The client may have given up while we were sitting on the request
      if (!res.destroyed) {
        subscription.add(handler(req, res, target))
      }
    }, delay)
    subscription.add(() => clearTimeout(timeout))
    return subscription
  }
}
