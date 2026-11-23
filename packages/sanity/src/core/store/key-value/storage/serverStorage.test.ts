import {createClient, type SanityClient} from '@sanity/client'
import {afterEach, describe, expect, test, vi} from 'vitest'

import {createServerStorage} from './serverStorage'

function attachRequest(client: SanityClient, requestImpl: SanityClient['request']): SanityClient {
  client.request = requestImpl
  const withConfig = client.withConfig.bind(client)
  client.withConfig = (config) => attachRequest(withConfig(config), requestImpl)
  return client
}

function createTestClient(requestImpl: SanityClient['request']) {
  return attachRequest(
    createClient({
      projectId: 'abc123',
      dataset: 'production',
      apiVersion: '2025-02-19',
      useCdn: false,
    }),
    requestImpl,
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('createServerStorage', () => {
  test('fetches a key from the user key-value endpoint and returns its value', async () => {
    const request = vi.fn().mockResolvedValue([{key: 'studio.layout', value: {pane: 'wide'}}])
    const store = createServerStorage({client: createTestClient(request)})

    await expect(store.getKey('studio.layout')).resolves.toEqual({pane: 'wide'})
    expect(request).toHaveBeenCalledTimes(1)
    expect(request).toHaveBeenCalledWith({url: '/users/me/keyvalue/studio.layout'})
  })

  test('batches concurrent gets into one comma-joined request', async () => {
    const request = vi.fn().mockResolvedValue([
      {key: 'studio.a', value: 1},
      {key: 'studio.b', value: 2},
    ])
    const store = createServerStorage({client: createTestClient(request)})

    const [a, b] = await Promise.all([store.getKey('studio.a'), store.getKey('studio.b')])

    expect(a).toBe(1)
    expect(b).toBe(2)
    expect(request).toHaveBeenCalledTimes(1)
    expect(request).toHaveBeenCalledWith({url: '/users/me/keyvalue/studio.a,studio.b'})
  })

  test('maps a missing key to null', async () => {
    const request = vi.fn().mockResolvedValue([{key: 'studio.other', value: true}])
    const store = createServerStorage({client: createTestClient(request)})

    await expect(store.getKey('studio.layout')).resolves.toBeNull()
  })

  test('maps a rejected fetch to null and logs the error', async () => {
    const request = vi.fn().mockRejectedValue(new Error('network down'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const store = createServerStorage({client: createTestClient(request)})

    await expect(store.getKey('studio.layout')).resolves.toBeNull()
    expect(errorSpy).toHaveBeenCalled()
  })

  test('treats a null response body as every requested key missing', async () => {
    const request = vi.fn().mockResolvedValue(null)
    const store = createServerStorage({client: createTestClient(request)})

    await expect(store.getKey('studio.layout')).resolves.toBeNull()
  })

  test('skips a pair with no key when mapping the batch', async () => {
    const request = vi
      .fn()
      .mockResolvedValue([{value: 'orphan'}, {key: 'studio.layout', value: 'ok'}])
    const store = createServerStorage({client: createTestClient(request)})

    await expect(store.getKey('studio.layout')).resolves.toBe('ok')
  })

  test('caches a successful get so a second read does not request', async () => {
    const request = vi.fn().mockResolvedValue([{key: 'studio.layout', value: {pane: 'wide'}}])
    const store = createServerStorage({client: createTestClient(request)})

    await expect(store.getKey('studio.layout')).resolves.toEqual({pane: 'wide'})
    request.mockClear()

    await expect(store.getKey('studio.layout')).resolves.toEqual({pane: 'wide'})
    expect(request).not.toHaveBeenCalled()
  })

  test('puts the pair and returns the stored value', async () => {
    const request = vi.fn().mockResolvedValue([{key: 'studio.layout', value: {pane: 'narrow'}}])
    const store = createServerStorage({client: createTestClient(request)})

    await expect(store.setKey('studio.layout', {pane: 'narrow'})).resolves.toEqual({pane: 'narrow'})
    expect(request).toHaveBeenCalledWith({
      method: 'PUT',
      url: '/users/me/keyvalue',
      body: [{key: 'studio.layout', value: {pane: 'narrow'}}],
    })
  })

  test('primes the loader so a get after set does not request', async () => {
    const request = vi.fn().mockResolvedValue([{key: 'studio.layout', value: {pane: 'narrow'}}])
    const store = createServerStorage({client: createTestClient(request)})

    await store.setKey('studio.layout', {pane: 'narrow'})
    request.mockClear()

    await expect(store.getKey('studio.layout')).resolves.toEqual({pane: 'narrow'})
    expect(request).not.toHaveBeenCalled()
  })

  test('maps a rejected set to null and leaves a prior get cache intact', async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce([{key: 'studio.layout', value: {pane: 'wide'}}])
      .mockRejectedValueOnce(new Error('write failed'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const store = createServerStorage({client: createTestClient(request)})

    await expect(store.getKey('studio.layout')).resolves.toEqual({pane: 'wide'})
    await expect(store.setKey('studio.layout', {pane: 'narrow'})).resolves.toBeNull()
    expect(errorSpy).toHaveBeenCalled()
    request.mockClear()

    await expect(store.getKey('studio.layout')).resolves.toEqual({pane: 'wide'})
    expect(request).not.toHaveBeenCalled()
  })

  test.fails('returns stored false, 0, and empty string instead of treating them as missing (SAPP-4836)', async () => {
    const values: Record<string, unknown> = {flag: false, count: 0, label: ''}
    const request = vi.fn().mockImplementation((opts: {url: string}) => {
      const key = opts.url.slice('/users/me/keyvalue/'.length)
      return Promise.resolve([{key, value: values[key]}])
    })
    const store = createServerStorage({client: createTestClient(request)})

    await expect(store.getKey('flag')).resolves.toBe(false)
    await expect(store.getKey('count')).resolves.toBe(0)
    await expect(store.getKey('label')).resolves.toBe('')
  })

  test.fails('does not throw when the PUT response has no pair (SAPP-4837)', async () => {
    const request = vi.fn().mockResolvedValue([])
    const store = createServerStorage({client: createTestClient(request)})

    await expect(store.setKey('studio.layout', {pane: 'wide'})).resolves.toBeNull()
  })
})
