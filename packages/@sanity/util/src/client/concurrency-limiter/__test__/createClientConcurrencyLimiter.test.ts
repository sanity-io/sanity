import {types} from 'node:util'

import {createClient, type SanityClient} from '@sanity/client'
import {firstValueFrom, from, NEVER, Observable, of} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {createClientConcurrencyLimiter} from '../createClientConcurrencyLimiter'

const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('createConcurrencyLimitedClient', () => {
  it('returns a wrapped client that limits the concurrency of client.fetch', async () => {
    const deferredPromise = (() => {
      let resolve!: () => void
      const promise = new Promise<void>((thisResolve) => (resolve = thisResolve))
      return Object.assign(promise, {resolve})
    })()

    const mockClient = {
      fetch: vi.fn(() => deferredPromise),
    } as unknown as SanityClient

    const limitConcurrency = createClientConcurrencyLimiter(1)
    const client = limitConcurrency(mockClient)
    const allDone = Promise.all([client.fetch('foo'), client.fetch('bar')])
    await tick()

    // even though we called client.fetch twice, the underlying client fetch
    // should only be called once
    expect(mockClient.fetch).toHaveBeenCalledTimes(1)
    deferredPromise.resolve()

    await tick()
    await allDone

    expect(mockClient.fetch).toHaveBeenCalledTimes(2)
  })

  it('returns a wrapped client that limits the concurrency of client.observable.fetch', async () => {
    const deferredPromise = (() => {
      let resolve!: () => void
      const promise = new Promise<void>((thisResolve) => (resolve = thisResolve))
      return Object.assign(promise, {resolve})
    })()

    const mockClient = {
      observable: {
        fetch: vi.fn(() => from(deferredPromise)),
      },
    } as unknown as SanityClient

    const limitConcurrency = createClientConcurrencyLimiter(1)
    const client = limitConcurrency(mockClient)
    const allDone = Promise.all([
      firstValueFrom(client.observable.fetch('foo')),
      firstValueFrom(client.observable.fetch('bar')),
    ])
    await tick()

    // even though we called client.fetch twice, the underlying client fetch
    // should only be called once
    expect(mockClient.observable.fetch).toHaveBeenCalledTimes(1)
    deferredPromise.resolve()

    await tick()
    await allDone

    expect(mockClient.observable.fetch).toHaveBeenCalledTimes(2)
  })

  it('does not acquire an observable slot before subscription', async () => {
    const mockClient = {
      observable: {fetch: vi.fn(() => of('result'))},
    } as unknown as SanityClient
    const client = createClientConcurrencyLimiter(1)(mockClient)
    const controller = new AbortController()

    void client.observable.fetch('unused')
    const active = firstValueFrom(
      client.observable.fetch('active', {}, {signal: controller.signal}),
    )
    const outcome = await Promise.race([active, tick().then(() => 'timed out')])

    controller.abort()
    await active.catch(() => undefined)

    expect(outcome).toBe('result')
    expect(mockClient.observable.fetch).toHaveBeenCalledOnce()
    expect(mockClient.observable.fetch).toHaveBeenCalledWith(
      'active',
      {},
      {
        signal: controller.signal,
      },
    )
  })

  it('returns a wrapped client that limits the observable client fetch', () => {
    const mockClient = createClient({
      projectId: 'project-id',
      dataset: 'test',
      apiVersion: '1',
      useCdn: false,
    })
    const limitConcurrency = createClientConcurrencyLimiter(1)
    const client = limitConcurrency(mockClient)

    expect(types.isProxy(client))
    expect(types.isProxy(client.clone().clone()))
    expect(types.isProxy(client.withConfig().withConfig()))
    expect(types.isProxy(client.config({}).config({})))

    expect(types.isProxy(client.observable))
    expect(types.isProxy(client.observable.clone().clone()))
    expect(types.isProxy(client.observable.withConfig().withConfig()))
    expect(types.isProxy(client.observable.config({}).config({})))
  })

  it('releases an observable slot when unsubscribed before the fetch starts', async () => {
    const mockClient = {
      observable: {fetch: vi.fn(() => of('result'))},
    } as unknown as SanityClient
    const client = createClientConcurrencyLimiter(1)(mockClient)

    const cancelled = client.observable.fetch('cancelled').subscribe()
    cancelled.unsubscribe()

    await expect(firstValueFrom(client.observable.fetch('next'))).resolves.toBe('result')
    expect(mockClient.observable.fetch).toHaveBeenCalledOnce()
    expect(mockClient.observable.fetch).toHaveBeenCalledWith('next')
  })

  it('does not start a queued fetch after its signal is aborted', async () => {
    const deferredPromise = (() => {
      let resolve!: () => void
      const promise = new Promise<void>((thisResolve) => (resolve = thisResolve))
      return Object.assign(promise, {resolve})
    })()
    const mockClient = {fetch: vi.fn(() => deferredPromise)} as unknown as SanityClient
    const client = createClientConcurrencyLimiter(1)(mockClient)
    const controller = new AbortController()
    const reason = new Error('cancelled')

    const active = client.fetch('active')
    const queued = client.fetch('queued', {}, {signal: controller.signal})
    await tick()
    controller.abort(reason)

    await expect(queued).rejects.toBe(reason)
    deferredPromise.resolve()
    await active
    expect(mockClient.fetch).toHaveBeenCalledTimes(1)
  })

  it('releases an active Observable fetch when its signal is aborted', async () => {
    const controller = new AbortController()
    const reason = new Error('cancelled')
    const unsubscribe = vi.fn()
    const mockClient = {
      observable: {
        fetch: vi
          .fn()
          .mockImplementationOnce(
            (_query: string, _params: object, {signal}: {signal: AbortSignal}) =>
              new Observable((subscriber) => {
                const onAbort = () => subscriber.error(signal.reason)
                signal.addEventListener('abort', onAbort, {once: true})
                return () => {
                  signal.removeEventListener('abort', onAbort)
                  unsubscribe()
                }
              }),
          )
          .mockImplementationOnce(() => of('next')),
      },
    } as unknown as SanityClient
    const client = createClientConcurrencyLimiter(1)(mockClient)
    const active = firstValueFrom(
      client.observable.fetch('active', {}, {signal: controller.signal}),
    )
    await vi.waitFor(() => expect(mockClient.observable.fetch).toHaveBeenCalledOnce())

    controller.abort(reason)

    await expect(active).rejects.toBe(reason)
    await expect(firstValueFrom(client.observable.fetch('next'))).resolves.toBe('next')
    expect(unsubscribe).toHaveBeenCalledOnce()
  })

  it('releases an active Observable fetch when unsubscribed', async () => {
    const fetch = vi
      .fn()
      .mockImplementationOnce(() => NEVER)
      .mockImplementationOnce(() => of('next'))
    const client = createClientConcurrencyLimiter(1)({
      observable: {fetch},
    } as unknown as SanityClient)
    const active = client.observable.fetch('active').subscribe()
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce())

    active.unsubscribe()

    await expect(firstValueFrom(client.observable.fetch('next'))).resolves.toBe('next')
  })

  it('adds a default signal to promise and Observable fetches', async () => {
    const controller = new AbortController()
    const mockClient = {
      fetch: vi.fn(async () => 'promise result'),
      observable: {fetch: vi.fn(() => of('observable result'))},
    } as unknown as SanityClient
    const client = createClientConcurrencyLimiter(1, controller.signal)(mockClient)

    await expect(client.fetch('promise')).resolves.toBe('promise result')
    await expect(firstValueFrom(client.observable.fetch('observable'))).resolves.toBe(
      'observable result',
    )

    expect(mockClient.fetch).toHaveBeenCalledWith(
      'promise',
      undefined,
      expect.objectContaining({signal: controller.signal}),
    )
    expect(mockClient.observable.fetch).toHaveBeenCalledWith(
      'observable',
      undefined,
      expect.objectContaining({signal: controller.signal}),
    )
  })

  it('combines a default signal with a fetch signal', async () => {
    const defaultController = new AbortController()
    const fetchController = new AbortController()
    const reason = new Error('validation cancelled')
    const mockClient = {
      fetch: vi.fn(
        (_query: string, _params: object, {signal}: {signal: AbortSignal}) =>
          new Promise((_resolve, reject) => {
            signal.addEventListener('abort', () => reject(signal.reason), {once: true})
          }),
      ),
    } as unknown as SanityClient
    const client = createClientConcurrencyLimiter(1, defaultController.signal)(mockClient)
    const result = client.fetch('query', {}, {signal: fetchController.signal})
    await vi.waitFor(() => expect(mockClient.fetch).toHaveBeenCalledOnce())

    defaultController.abort(reason)

    await expect(result).rejects.toBe(reason)
    expect(fetchController.signal.aborted).toBe(false)
  })

  it('combines a default signal with an Observable fetch signal', async () => {
    const defaultController = new AbortController()
    const fetchController = new AbortController()
    const reason = new Error('validation cancelled')
    const unsubscribe = vi.fn()
    const mockClient = {
      observable: {
        fetch: vi.fn(
          (_query: string, _params: object, {signal}: {signal: AbortSignal}) =>
            new Observable((subscriber) => {
              const onAbort = () => subscriber.error(signal.reason)
              signal.addEventListener('abort', onAbort, {once: true})
              return () => {
                signal.removeEventListener('abort', onAbort)
                unsubscribe()
              }
            }),
        ),
      },
    } as unknown as SanityClient
    const client = createClientConcurrencyLimiter(1, defaultController.signal)(mockClient)
    const result = firstValueFrom(
      client.observable.fetch('query', {}, {signal: fetchController.signal}),
    )
    await vi.waitFor(() => expect(mockClient.observable.fetch).toHaveBeenCalledOnce())

    defaultController.abort(reason)

    await expect(result).rejects.toBe(reason)
    expect(fetchController.signal.aborted).toBe(false)
    expect(unsubscribe).toHaveBeenCalledOnce()
  })
})
