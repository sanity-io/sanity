import {type ObservableSanityClient, type SanityClient} from '@sanity/client'
import {defer, finalize, from, switchMap, tap} from 'rxjs'

import {ConcurrencyLimiter} from '../../concurrency-limiter'

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
              const signal = args[2]?.signal
              await limiter.ready(signal)
              try {
                signal?.throwIfAborted()
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
            return (...args: Parameters<ObservableSanityClient['fetch']>) => {
              const signal = args[2]?.signal
              const ready = limiter.ready(signal)
              let acquired = false

              return from(ready).pipe(
                tap(() => {
                  acquired = true
                }),
                switchMap(() =>
                  defer(() => {
                    signal?.throwIfAborted()
                    return target.fetch(...args)
                  }),
                ),
                finalize(() => {
                  if (acquired) {
                    limiter.release()
                    return
                  }

                  void ready.then(limiter.release, () => undefined)
                }),
              )
            }
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
