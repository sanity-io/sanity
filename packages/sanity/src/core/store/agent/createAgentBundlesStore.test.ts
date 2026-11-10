import {createClient} from '@sanity/client'
import {of} from 'rxjs'
import {afterEach, describe, expect, test, vi} from 'vitest'

import {createAgentBundlesStore} from './createAgentBundlesStore'

const {connections, FakeEventSource} = vi.hoisted(() => {
  const opened: {init: EventSourceInit & {headers?: Record<string, string>}; polyfill: boolean}[] =
    []

  const createFake = (polyfill: boolean) =>
    class {
      constructor(_url: string, init: EventSourceInit & {headers?: Record<string, string>}) {
        opened.push({init, polyfill})
      }
      addEventListener() {}
      close() {}
    }

  return {
    connections: opened,
    FakeEventSource: {native: createFake(false), polyfill: createFake(true)},
  }
})

vi.mock('@sanity/eventsource', () => ({default: FakeEventSource.polyfill}))

async function openConnection(clientConfig: {token?: string; withCredentials?: boolean}) {
  vi.stubGlobal('EventSource', FakeEventSource.native)
  const client = createClient({
    apiVersion: '2025-02-19',
    ignoreBrowserTokenWarning: true,
    projectId: 'abc123',
    useCdn: false,
    ...clientConfig,
  })
  const {state$} = createAgentBundlesStore({client, organizationId$: of('org-1')})
  const subscription = state$.subscribe()

  await vi.waitFor(() => expect(connections).toHaveLength(1))
  subscription.unsubscribe()

  return connections[0]
}

afterEach(() => {
  connections.length = 0
  vi.unstubAllGlobals()
})

describe('createAgentBundlesStore', () => {
  test('authenticates a token client with the token alone, without cookies', async () => {
    const {init, polyfill} = await openConnection({token: 'sk-token'})

    expect(polyfill).toBe(true)
    expect(init.headers).toEqual({Authorization: 'Bearer sk-token'})
    expect(init.withCredentials).toBeUndefined()
  })

  test('sends cookies when the client is configured with credentials', async () => {
    const {init, polyfill} = await openConnection({withCredentials: true})

    expect(polyfill).toBe(false)
    expect(init.withCredentials).toBe(true)
    expect(init.headers).toBeUndefined()
  })
})
