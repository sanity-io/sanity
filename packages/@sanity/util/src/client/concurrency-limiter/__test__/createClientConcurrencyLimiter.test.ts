import {types} from 'node:util'

import {createClient, type SanityClient} from '@sanity/client'
import {firstValueFrom, from} from 'rxjs'
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
})
