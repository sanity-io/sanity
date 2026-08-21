import {type ListenEvent, type SanityClient} from '@sanity/client'
import {type CurrentUser} from '@sanity/types'
import {Observable, of} from 'rxjs'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {type ApiNetworkDiagnostic} from '../../network/isUsingLegacyHttp'
import {
  formatStudioDiagnostics,
  gatherStudioDiagnostics,
  type StudioDiagnosticsOptions,
} from './gatherStudioDiagnostics'

const mocks = vi.hoisted(() => ({
  getApiNetworkDiagnostic: vi.fn(),
}))

vi.mock('../../network/isUsingLegacyHttp', () => ({
  getApiNetworkDiagnostic: mocks.getApiNetworkDiagnostic,
}))

const protocolDiagnostic: ApiNetworkDiagnostic = {
  durationMs: 12,
  protocol: 'h2',
  status: 'success',
  timedOut: false,
}

const currentUser: CurrentUser = {
  email: 'test@example.com',
  id: 'user-1',
  name: 'Test User',
  provider: 'sanity',
  roles: [{description: 'Can edit', name: 'editor', title: 'Editor'}],
} as CurrentUser

afterEach(() => {
  mocks.getApiNetworkDiagnostic.mockReset()
  vi.restoreAllMocks()
})

describe('gatherStudioDiagnostics', () => {
  it('gathers support-ready details and keeps the first listener open during the second', async () => {
    mocks.getApiNetworkDiagnostic.mockReturnValue(of(protocolDiagnostic))
    const {client, getMaximumActiveListeners} = createClient()

    const diagnostics = await gatherStudioDiagnostics(createOptions(client))

    expect(diagnostics.network.protocol).toEqual(protocolDiagnostic)
    expect(diagnostics.network.listen.first).toMatchObject({
      path: '/listen?query=*',
      status: 'success',
      timedOut: false,
    })
    expect(diagnostics.network.listen.secondWhileFirstOpen).toMatchObject({
      path: '/listen?query=*',
      status: 'success',
      timedOut: false,
    })
    expect(getMaximumActiveListeners()).toBe(2)
    expect(diagnostics.network.requests).toEqual([
      expect.objectContaining({path: '/ping', status: 'success', timedOut: false}),
      expect.objectContaining({path: '/query?query=1', status: 'success', timedOut: false}),
      expect.objectContaining({
        path: '/query?query=*[0]._id',
        status: 'success',
        timedOut: false,
      }),
      expect.objectContaining({
        path: '/doc/<random-nonexistent-id>',
        status: 'success',
        timedOut: false,
      }),
    ])
    expect(diagnostics.browser.localStorage).toEqual({status: 'success'})
    expect(diagnostics.browser.maxTouchPoints).toBe(navigator.maxTouchPoints)
    expect(diagnostics.durationMs).toBeGreaterThanOrEqual(0)
    expect(diagnostics.startedAt).toBeTypeOf('string')
    expect(diagnostics.studio).toMatchObject({
      apiHost: 'https://api.sanity.test',
      dataset: 'production',
      projectId: 'project-id',
      uniqueTargetCount: 2,
      version: '4.0.0',
      workspaceCount: 2,
    })
    expect(diagnostics.schema).toEqual({documentTypes: 2, objectTypes: 3, primitiveTypes: 4})
    expect(diagnostics.user).toEqual({
      id: 'user-1',
      provider: 'sanity',
      roles: [{name: 'editor', title: 'Editor'}],
    })
    expect(diagnostics.user).not.toHaveProperty('email')
    expect(diagnostics.user).not.toHaveProperty('name')
    expect(formatStudioDiagnostics(diagnostics)).toBe(JSON.stringify(diagnostics, null, 2))
  })

  it('queues concurrent calls instead of running network passes together', async () => {
    const releases: (() => void)[] = []
    let probeStarts = 0
    mocks.getApiNetworkDiagnostic.mockImplementation(
      () =>
        new Observable<ApiNetworkDiagnostic>((subscriber) => {
          probeStarts += 1
          releases.push(() => {
            subscriber.next(protocolDiagnostic)
            subscriber.complete()
          })
        }),
    )
    const {client} = createClient()
    const options = createOptions(client)

    const first = gatherStudioDiagnostics(options)
    const second = gatherStudioDiagnostics(options)

    await vi.waitFor(() => expect(probeStarts).toBe(1))
    releases[0]()
    await first

    await vi.waitFor(() => expect(probeStarts).toBe(2))
    releases[1]()
    await second
  })

  it('uses diagnostic tags relative to the client request tag prefix', async () => {
    mocks.getApiNetworkDiagnostic.mockReturnValue(of(protocolDiagnostic))
    const {client} = createClient()

    await gatherStudioDiagnostics(createOptions(client))

    expect(client.listen).toHaveBeenCalledWith(
      '*',
      {},
      expect.objectContaining({tag: 'diagnostics.listen'}),
    )
    expect(client.request).toHaveBeenCalledWith(expect.objectContaining({tag: 'diagnostics.ping'}))
    expect(client.fetch).toHaveBeenCalledWith(
      '1',
      {},
      expect.objectContaining({tag: 'diagnostics.query-constant'}),
    )
    expect(client.fetch).toHaveBeenCalledWith(
      '*[0]._id',
      {},
      expect.objectContaining({tag: 'diagnostics.query-document'}),
    )
    expect(client.getDocument).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({tag: 'diagnostics.document'}),
    )
  })

  it('records listen and request timeouts without failing the report', async () => {
    mocks.getApiNetworkDiagnostic.mockReturnValue(of(protocolDiagnostic))
    const {client} = createClient({emitListenEvents: false, resolvePing: false})

    const diagnostics = await gatherStudioDiagnostics({
      ...createOptions(client),
      requestTimeout: 5,
    })

    expect(diagnostics.network.listen.first).toMatchObject({
      status: 'timeout',
      timedOut: true,
    })
    expect(diagnostics.network.listen.secondWhileFirstOpen).toMatchObject({
      status: 'timeout',
      timedOut: true,
    })
    expect(diagnostics.network.requests[0]).toMatchObject({
      path: '/ping',
      status: 'timeout',
      timedOut: true,
    })
    expect(diagnostics.network.requests.slice(1)).toEqual([
      expect.objectContaining({status: 'success'}),
      expect.objectContaining({status: 'success'}),
      expect.objectContaining({status: 'success'}),
    ])
  })

  it('records a local storage failure without failing the report', async () => {
    mocks.getApiNetworkDiagnostic.mockReturnValue(of(protocolDiagnostic))
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage is blocked', 'SecurityError')
    })
    const {client} = createClient()

    const diagnostics = await gatherStudioDiagnostics(createOptions(client))

    expect(diagnostics.browser.localStorage).toEqual({
      error: 'SecurityError: Storage is blocked',
      status: 'error',
    })
  })
})

function createOptions(client: SanityClient): StudioDiagnosticsOptions {
  return {
    client,
    schema: {documentTypes: 2, objectTypes: 3, primitiveTypes: 4},
    studio: {
      basePath: '/',
      dataset: 'production',
      projectId: 'project-id',
      reactVersion: '19.2.0',
      uniqueTargetCount: 2,
      version: '4.0.0',
      workspaceCount: 2,
      workspaceName: 'default',
      workspaceTitle: 'Default',
    },
    user: currentUser,
  }
}

function createClient(options: {emitListenEvents?: boolean; resolvePing?: boolean} = {}): {
  client: SanityClient
  getMaximumActiveListeners: () => number
} {
  const {emitListenEvents = true, resolvePing = true} = options
  let activeListeners = 0
  let maximumActiveListeners = 0

  const client = {
    config: () => ({
      apiHost: 'https://api.sanity.test',
      apiVersion: '2025-02-19',
    }),
    fetch: vi.fn(async (query: string) => (query === '1' ? 1 : 'document-id')),
    getDocument: vi.fn(async () => undefined),
    listen: vi.fn(
      () =>
        new Observable<ListenEvent>((subscriber) => {
          activeListeners += 1
          maximumActiveListeners = Math.max(maximumActiveListeners, activeListeners)
          if (emitListenEvents) {
            queueMicrotask(() => {
              subscriber.next({type: 'open'})
              subscriber.next({listenerName: 'diagnostics', type: 'welcome'})
            })
          }
          return () => {
            activeListeners -= 1
          }
        }),
    ),
    request: vi.fn(() => (resolvePing ? Promise.resolve('pong') : new Promise(() => undefined))),
    withConfig: vi.fn(() => client),
  } as unknown as SanityClient

  return {
    client,
    getMaximumActiveListeners: () => maximumActiveListeners,
  }
}
