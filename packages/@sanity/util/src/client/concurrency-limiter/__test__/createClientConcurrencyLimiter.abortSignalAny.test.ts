import {type SanityClient} from '@sanity/client'
import {firstValueFrom, Observable} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createClientConcurrencyLimiter} from '../createClientConcurrencyLimiter'

const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((thisResolve) => (resolve = thisResolve))
  return Object.assign(promise, {resolve})
}

function abortableFetch() {
  return vi.fn(
    (_query: string, _params: object, {signal}: {signal: AbortSignal}) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(signal.reason), {once: true})
      }),
  )
}

function abortableObservableFetch() {
  return vi.fn(
    (_query: string, _params: object, {signal}: {signal: AbortSignal}) =>
      new Observable((subscriber) => {
        const onAbort = () => subscriber.error(signal.reason)
        signal.addEventListener('abort', onAbort, {once: true})
        return () => signal.removeEventListener('abort', onAbort)
      }),
  )
}

const nativeAbortSignalAny = AbortSignal.any

function describeSignalCombination() {
  it('aborts a fetch when the default signal aborts', async () => {
    const defaultController = new AbortController()
    const fetchController = new AbortController()
    const reason = new Error('validation cancelled')
    const mockClient = {fetch: abortableFetch()} as unknown as SanityClient
    const client = createClientConcurrencyLimiter(1, defaultController.signal)(mockClient)

    const result = client.fetch('query', {}, {signal: fetchController.signal})
    await vi.waitFor(() => expect(mockClient.fetch).toHaveBeenCalledOnce())
    defaultController.abort(reason)

    await expect(result).rejects.toBe(reason)
    expect(fetchController.signal.aborted).toBe(false)
  })

  it('aborts a fetch when the fetch signal aborts', async () => {
    const defaultController = new AbortController()
    const fetchController = new AbortController()
    const reason = new Error('fetch cancelled')
    const mockClient = {fetch: abortableFetch()} as unknown as SanityClient
    const client = createClientConcurrencyLimiter(1, defaultController.signal)(mockClient)

    const result = client.fetch('query', {}, {signal: fetchController.signal})
    await vi.waitFor(() => expect(mockClient.fetch).toHaveBeenCalledOnce())
    fetchController.abort(reason)

    await expect(result).rejects.toBe(reason)
    expect(defaultController.signal.aborted).toBe(false)
  })

  it('rejects a fetch immediately when the default signal is already aborted', async () => {
    const defaultController = new AbortController()
    const reason = new Error('already cancelled')
    defaultController.abort(reason)
    const mockClient = {fetch: vi.fn(async () => 'result')} as unknown as SanityClient
    const client = createClientConcurrencyLimiter(1, defaultController.signal)(mockClient)

    await expect(client.fetch('query', {}, {signal: new AbortController().signal})).rejects.toBe(
      reason,
    )
    expect(mockClient.fetch).not.toHaveBeenCalled()
  })

  it('aborts an Observable fetch when the default signal aborts', async () => {
    const defaultController = new AbortController()
    const fetchController = new AbortController()
    const reason = new Error('validation cancelled')
    const mockClient = {
      observable: {fetch: abortableObservableFetch()},
    } as unknown as SanityClient
    const client = createClientConcurrencyLimiter(1, defaultController.signal)(mockClient)

    const result = firstValueFrom(
      client.observable.fetch('query', {}, {signal: fetchController.signal}),
    )
    await vi.waitFor(() => expect(mockClient.observable.fetch).toHaveBeenCalledOnce())
    defaultController.abort(reason)

    await expect(result).rejects.toBe(reason)
    expect(fetchController.signal.aborted).toBe(false)
  })

  it('drops a queued Observable fetch when its signal aborts', async () => {
    const pending = deferred()
    const fetchController = new AbortController()
    const reason = new Error('queued fetch cancelled')
    const fetch = vi
      .fn()
      .mockImplementationOnce(
        () => new Observable<void>((subscriber) => void pending.then(() => subscriber.complete())),
      )
      .mockImplementationOnce(() => {
        throw new Error('the aborted fetch must never start')
      })
    const client = createClientConcurrencyLimiter(1)({
      observable: {fetch},
    } as unknown as SanityClient)

    const active = client.observable.fetch('active').subscribe()
    const queued = firstValueFrom(
      client.observable.fetch('queued', {}, {signal: fetchController.signal}),
    )
    await tick()
    expect(fetch).toHaveBeenCalledOnce()

    fetchController.abort(reason)
    await expect(queued).rejects.toBe(reason)

    pending.resolve()
    await tick()
    active.unsubscribe()
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('drops a queued Observable fetch when unsubscribed', async () => {
    const pending = deferred()
    const fetchController = new AbortController()
    const fetch = vi
      .fn()
      .mockImplementationOnce(
        () => new Observable<void>((subscriber) => void pending.then(() => subscriber.complete())),
      )
      .mockImplementationOnce(() => {
        throw new Error('the unsubscribed fetch must never start')
      })
    const client = createClientConcurrencyLimiter(1)({
      observable: {fetch},
    } as unknown as SanityClient)

    const active = client.observable.fetch('active').subscribe()
    const queued = client.observable
      .fetch('queued', {}, {signal: fetchController.signal})
      .subscribe()
    await tick()
    queued.unsubscribe()

    pending.resolve()
    await tick()
    active.unsubscribe()
    expect(fetch).toHaveBeenCalledOnce()
    expect(fetchController.signal.aborted).toBe(false)
  })

  it('combines the signals again when an Observable fetch is re-subscribed', async () => {
    const defaultController = new AbortController()
    const fetchController = new AbortController()
    const reason = new Error('validation cancelled')
    const mockClient = {
      observable: {fetch: abortableObservableFetch()},
    } as unknown as SanityClient
    const client = createClientConcurrencyLimiter(1, defaultController.signal)(mockClient)
    const fetch$ = client.observable.fetch('query', {}, {signal: fetchController.signal})

    const first = fetch$.subscribe()
    await vi.waitFor(() => expect(mockClient.observable.fetch).toHaveBeenCalledOnce())
    first.unsubscribe()

    const second = firstValueFrom(fetch$)
    await vi.waitFor(() => expect(mockClient.observable.fetch).toHaveBeenCalledTimes(2))
    defaultController.abort(reason)

    await expect(second).rejects.toBe(reason)
  })
}

describe('createClientConcurrencyLimiter signal combination', () => {
  afterEach(() => {
    AbortSignal.any = nativeAbortSignalAny
  })

  describe('without native AbortSignal.any (Safari 17.0 – 17.3)', () => {
    beforeEach(() => {
      Reflect.deleteProperty(AbortSignal, 'any')
      expect(AbortSignal.any).toBeUndefined()
    })

    describeSignalCombination()
  })

  describe('with native AbortSignal.any (Safari 17.4+ and other modern runtimes)', () => {
    beforeEach(() => {
      expect(typeof AbortSignal.any).toBe('function')
    })

    describeSignalCombination()

    it('does not depend on the native static even when it exists', async () => {
      const spy = vi.spyOn(AbortSignal, 'any')
      const defaultController = new AbortController()
      const mockClient = {fetch: vi.fn(async () => 'result')} as unknown as SanityClient
      const client = createClientConcurrencyLimiter(1, defaultController.signal)(mockClient)

      await expect(client.fetch('query', {}, {signal: new AbortController().signal})).resolves.toBe(
        'result',
      )

      expect(spy).not.toHaveBeenCalled()
    })
  })
})
