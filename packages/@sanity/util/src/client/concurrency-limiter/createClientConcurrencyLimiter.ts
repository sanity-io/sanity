import {type ObservableSanityClient, type SanityClient} from '@sanity/client'
import {defer, finalize, Observable, switchMap} from 'rxjs'

import {ConcurrencyLimiter} from '../../concurrency-limiter'
import {anySignal} from './anySignal'

const noop = () => {}

function acquireSlot(limiter: ConcurrencyLimiter, signal?: AbortSignal): Observable<() => void> {
  return new Observable((subscriber) => {
    const subscriptionController = new AbortController()
    const waitSignal = anySignal([signal, subscriptionController.signal])

    void limiter
      .ready(waitSignal)
      .then(
        () => {
          if (subscriber.closed) {
            limiter.release()
            return
          }

          subscriber.next(limiter.release)
          subscriber.complete()
        },
        (error) => subscriber.error(error),
      )
      // the wait is over either way, so stop listening to the caller's signal
      .finally(() => waitSignal.clear())

    return () => subscriptionController.abort()
  })
}

function runObservable<T>(
  limiter: ConcurrencyLimiter,
  work: () => Observable<T>,
  signal?: AbortSignal,
): Observable<T> {
  return acquireSlot(limiter, signal).pipe(
    switchMap((release) =>
      defer(() => {
        signal?.throwIfAborted()
        return work()
      }).pipe(finalize(release)),
    ),
  )
}

/**
 * Decorates a sanity client to limit the concurrency of `client.fetch`
 * requests. Keeps the concurrency limit state and returns wrapped clients with
 * that same state if the `clone` `config` or `withConfig` methods are called.
 */
export function createClientConcurrencyLimiter(
  maxConcurrency: number,
  defaultSignal?: AbortSignal,
): (input: SanityClient) => SanityClient {
  const limiter = new ConcurrencyLimiter(maxConcurrency)

  /**
   * Returns the signal a fetch should run with, plus a `release` callback to invoke once the
   * fetch has settled. When the fetch signal has to be combined with the default signal,
   * `release` removes the combined signal's listeners from both sources.
   */
  function resolveSignal(signal?: AbortSignal): {
    signal: AbortSignal | undefined
    release: () => void
  } {
    if (!defaultSignal || !signal || defaultSignal === signal) {
      return {signal: signal || defaultSignal, release: noop}
    }
    const combined = anySignal([defaultSignal, signal])
    return {signal: combined, release: () => combined.clear()}
  }

  function wrapClient(client: SanityClient): SanityClient {
    return new Proxy(client, {
      get: (target, property) => {
        switch (property) {
          case 'fetch': {
            return (...args: Parameters<SanityClient['fetch']>) => {
              const {signal, release} = resolveSignal(args[2]?.signal)
              if (signal !== args[2]?.signal) args[2] = {...args[2], signal}
              return limiter.run(() => target.fetch(...args), signal).finally(release)
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
              const fetchSignal = args[2]?.signal
              // combine per subscription: a combined signal is released when the subscription
              // ends, so a shared one would be dead by the time the Observable is re-subscribed
              return defer(() => {
                const {signal, release} = resolveSignal(fetchSignal)
                const fetchArgs: typeof args = [...args]
                if (signal !== fetchSignal) fetchArgs[2] = {...fetchArgs[2], signal}
                return runObservable(limiter, () => target.fetch(...fetchArgs), signal).pipe(
                  finalize(release),
                )
              })
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
