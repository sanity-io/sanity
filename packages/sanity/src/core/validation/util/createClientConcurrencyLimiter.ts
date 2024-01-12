import type {SanityClient, ObservableSanityClient} from '@sanity/client'
import {from, switchMap, finalize} from 'rxjs'

/**
 * ConcurrencyLimiter manages the number of concurrent operations that can be performed.
 * It ensures that the number of operations does not exceed a specified maximum limit.
 */
export class ConcurrencyLimiter {
  current = 0
  resolvers: Array<() => void> = []
  constructor(public max: number) {}

  /**
   * Indicates when a slot for a new operation is ready.
   * If under the limit, it resolves immediately; otherwise, it waits until a slot is free.
   */
  ready = (): Promise<void> => {
    if (this.current < this.max) {
      this.current++
      return Promise.resolve()
    }

    return new Promise<void>((resolve) => {
      this.resolvers.push(resolve)
    })
  }

  /**
   * Releases a slot, decrementing the current count of operations if nothing is in the queue.
   * If there are operations waiting, it allows the next one in the queue to proceed.
   */
  release = (): void => {
    const nextResolver = this.resolvers.shift()
    if (nextResolver) {
      nextResolver()
      return
    }

    this.current = Math.max(0, this.current - 1)
  }
}

/**
 * Decorates a sanity client to limit the concurrency of `client.fetch`
 * requests. Keeps the concurrency limit state and returns wrapped clients with
 * that same state if the `clone` `config` or `withConfig` methods are called.
 */
export function createClientConcurrencyLimiter(
  maxConcurrency: number,
): (input: SanityClient) => SanityClient {
  const limiter = new ConcurrencyLimiter(maxConcurrency)

  function wrapClient(client: SanityClient): SanityClient {
    return new Proxy(client, {
      get: (target, property) => {
        switch (property) {
          case 'fetch': {
            return async (...args: Parameters<SanityClient['fetch']>) => {
              await limiter.ready()
              try {
                // note we want to await before we return so the finally block
                // will run after the promise has been fulfilled or rejected
                return await target.fetch(...args)
              } finally {
                limiter.release()
              }
            }
          }
          case 'clone': {
            return (...args: Parameters<SanityClient['clone']>) => {
              return wrapClient(target.clone(...args))
            }
          }
          case 'config': {
            return (...args: Parameters<SanityClient['config']>) => {
              const result = target.config(...args)

              // if there is a config, it returns a client so we need to wrap again
              if (args[0]) return wrapClient(result)
              return result
            }
          }
          case 'withConfig': {
            return (...args: Parameters<SanityClient['withConfig']>) => {
              return wrapClient(target.withConfig(...args))
            }
          }
          case 'observable': {
            return wrapObservableClient(target.observable)
          }
          default: {
            return target[property as keyof SanityClient]
          }
        }
      },
    })
  }

  function wrapObservableClient(
    observableSanityClient: ObservableSanityClient,
  ): ObservableSanityClient {
    return new Proxy(observableSanityClient, {
      get: (target, property) => {
        switch (property) {
          case 'fetch': {
            return (...args: Parameters<ObservableSanityClient['fetch']>) =>
              from(limiter.ready()).pipe(
                switchMap(() => target.fetch(...args)),
                finalize(() => limiter.release()),
              )
          }
          case 'clone': {
            return (...args: Parameters<ObservableSanityClient['clone']>) => {
              return wrapObservableClient(target.clone(...args))
            }
          }
          case 'config': {
            return (...args: Parameters<ObservableSanityClient['config']>) => {
              const result = target.config(...args)

              // if there is a config, it returns a client so we need to wrap again
              if (args[0]) return wrapObservableClient(result)
              return result
            }
          }
          case 'withConfig': {
            return (...args: Parameters<ObservableSanityClient['withConfig']>) => {
              return wrapObservableClient(target.withConfig(...args))
            }
          }
          default: {
            return target[property as keyof ObservableSanityClient]
          }
        }
      },
    })
  }

  return wrapClient
}
