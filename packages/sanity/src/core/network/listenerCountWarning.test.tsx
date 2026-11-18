import {type ClientConfig, type ObservableSanityClient, type SanityClient} from '@sanity/client'
import {render} from '@testing-library/react'
import {useEffect} from 'react'
import {Observable} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import type * as ListenerCountExports from './listenerCount'
import {
  formatListenerLabel,
  LISTENER_WARNING_THRESHOLD,
  parseCallSite,
} from './listenerCountWarning'
import type * as ListenerCountWarningExports from './listenerCountWarning'

const ABOVE_THRESHOLD = LISTENER_WARNING_THRESHOLD + 1
const REARM_THRESHOLD = LISTENER_WARNING_THRESHOLD / 2
const LISTEN_URL = 'https://project.api.sanity.io/v2025-02-07/data/listen/dataset'

type ListenerCountWarningModule = typeof ListenerCountWarningExports
type ListenerCountSubscriber = (counts: {open: number; peak: number}) => void
type OpenConnection = () => void

const OWN_MODULE_FRAME =
  '    at captureStack (/packages/sanity/src/core/network/listenerCountWarning.ts:95:20)'

const {subscribeListenerCountsMock} = vi.hoisted(() => {
  return {subscribeListenerCountsMock: vi.fn()}
})

vi.mock('./listenerCount', async (importOriginal) => ({
  ...(await importOriginal<typeof ListenerCountExports>()),
  subscribeListenerCounts: subscribeListenerCountsMock,
}))

function openImmediately(openConnection: OpenConnection): void {
  openConnection()
}

function createFakeListen(
  config: Partial<ClientConfig>,
  scheduleConnection: (openConnection: OpenConnection) => void,
): SanityClient['listen'] {
  return (() =>
    new Observable<never>(() => {
      const abortController = new AbortController()
      scheduleConnection(() => {
        void config.resolveFetch?.()(LISTEN_URL, {
          headers: {accept: 'text/event-stream'},
          signal: abortController.signal,
        })
      })
      return () => abortController.abort()
    })) as SanityClient['listen']
}

function createFakeObservableClient(
  config: Partial<ClientConfig> = {},
  scheduleConnection: (openConnection: OpenConnection) => void = openImmediately,
): ObservableSanityClient {
  return {
    listen: createFakeListen(config, scheduleConnection),
    withConfig: (newConfig) =>
      createFakeObservableClient({...config, ...newConfig}, scheduleConnection),
  } as ObservableSanityClient
}

function createFakeClient(
  config: Partial<ClientConfig> = {},
  scheduleConnection: (openConnection: OpenConnection) => void = openImmediately,
): SanityClient {
  return {
    listen: createFakeListen(config, scheduleConnection),
    withConfig: (newConfig) => createFakeClient({...config, ...newConfig}, scheduleConnection),
    observable: createFakeObservableClient(config, scheduleConnection),
  } as SanityClient
}

function getListenerCountSubscriber(): ListenerCountSubscriber {
  const subscriber = subscribeListenerCountsMock.mock.calls[0]?.[0] as
    | ListenerCountSubscriber
    | undefined
  if (subscriber === undefined) throw new Error('subscribeListenerCounts was not called')
  return subscriber
}

function Leaf({client}: {client: SanityClient}) {
  useEffect(() => {
    const subscription = client.listen('*').subscribe()
    return () => subscription.unsubscribe()
  }, [client])
  return null
}

function Parent({client}: {client: SanityClient}) {
  return <Leaf client={client} />
}

describe('parseCallSite', () => {
  it.each([
    ['a Chrome frame', '    at Leaf (/plugins/listener-flood/ListenerFlood.tsx:12:34)'],
    [
      'a Chrome frame with an origin and a Vite query string',
      '    at Leaf (http://localhost:3333/plugins/listener-flood/ListenerFlood.tsx?t=1700000000:12:34)',
    ],
    ['a Firefox/Safari frame', 'Leaf@/plugins/listener-flood/ListenerFlood.tsx:12:34'],
  ])('reads the caller from %s', (_description, callerFrame) => {
    const stack = ['Error', OWN_MODULE_FRAME, callerFrame].join('\n')

    expect(parseCallSite(stack)).toBe('/plugins/listener-flood/ListenerFlood.tsx:12')
  })

  it.each([
    '    at Leaf (http://localhost:3333/assets/source-COlqOjAG.js:61124:9)',
    '    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)',
    '    at processTicksAndRejections (internal/process/task_queues:65:5)',
  ])('treats %s as library code', (libraryFrame) => {
    const stack = ['Error', OWN_MODULE_FRAME, libraryFrame].join('\n')

    expect(parseCallSite(stack)).toBeUndefined()
  })
})

describe('formatListenerLabel', () => {
  const callSite = '/plugins/listener-flood/ListenerFlood.tsx:12'

  it.each([
    [{callSite, owner: 'Parent', tag: 'my-tag'}, callSite],
    [{callSite: undefined, owner: 'Parent', tag: 'my-tag'}, '<Parent> (tag "my-tag")'],
    [{callSite: undefined, owner: 'Parent', tag: undefined}, '<Parent>'],
    [{callSite: undefined, owner: undefined, tag: 'my-tag'}, 'listeners tagged "my-tag"'],
    [{callSite: undefined, owner: '_temp$13', tag: 'my-tag'}, 'listeners tagged "my-tag"'],
    [{callSite: undefined, owner: '_temp2', tag: undefined}, undefined],
    [{callSite: undefined, owner: undefined, tag: undefined}, undefined],
  ])('labels %o as %s', (parts, expectedLabel) => {
    expect(formatListenerLabel(parts)).toBe(expectedLabel)
  })
})

describe('listener count warning', () => {
  let listenerCountWarning: ListenerCountWarningModule
  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(async () => {
    vi.resetModules()
    vi.stubGlobal('fetch', () => new Promise<never>(() => undefined))
    listenerCountWarning = await import('./listenerCountWarning')
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    warnSpy.mockRestore()
    vi.unstubAllGlobals()
  })

  it('warns once when the open count goes past the threshold, and not again while it stays above', () => {
    listenerCountWarning.attributeListeners(createFakeClient())
    const subscriber = getListenerCountSubscriber()

    subscriber({open: LISTENER_WARNING_THRESHOLD, peak: LISTENER_WARNING_THRESHOLD})
    expect(warnSpy).toHaveBeenCalledTimes(0)

    subscriber({open: ABOVE_THRESHOLD, peak: ABOVE_THRESHOLD})
    subscriber({open: ABOVE_THRESHOLD + 10, peak: ABOVE_THRESHOLD + 10})
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy.mock.calls[0]?.[0]).toBe(
      `[sanity] This tab has ${ABOVE_THRESHOLD} open listeners. A Studio tab usually has about 12. Too many can stall requests in every open Studio tab.`,
    )
  })

  it('re-arms only once the open count falls to half the threshold', () => {
    listenerCountWarning.attributeListeners(createFakeClient())
    const subscriber = getListenerCountSubscriber()

    subscriber({open: ABOVE_THRESHOLD, peak: ABOVE_THRESHOLD})
    subscriber({open: REARM_THRESHOLD + 1, peak: ABOVE_THRESHOLD})
    subscriber({open: ABOVE_THRESHOLD, peak: ABOVE_THRESHOLD})
    expect(warnSpy).toHaveBeenCalledTimes(1)

    subscriber({open: REARM_THRESHOLD, peak: ABOVE_THRESHOLD})
    subscriber({open: ABOVE_THRESHOLD, peak: ABOVE_THRESHOLD})
    expect(warnSpy).toHaveBeenCalledTimes(2)
  })

  it('names the owning component for a listen call made in an effect', () => {
    const attributedClient = listenerCountWarning.attributeListeners(createFakeClient())
    const subscriber = getListenerCountSubscriber()

    render(<Parent client={attributedClient} />)
    subscriber({open: ABOVE_THRESHOLD, peak: ABOVE_THRESHOLD})

    expect(warnSpy.mock.calls[0]?.[0]).toContain('and 1 of them come from <Parent>.')
  })

  it('attributes subscriptions on a derived observable client', () => {
    const attributedClient = listenerCountWarning.attributeListeners(createFakeClient())
    const subscriber = getListenerCountSubscriber()
    const subscription = attributedClient.observable
      .withConfig({apiVersion: '2025-02-07'})
      .withConfig({apiVersion: '2025-06-01'})
      .listen('*', {}, {tag: 'derived-source'})
      .subscribe()

    subscriber({open: ABOVE_THRESHOLD, peak: ABOVE_THRESHOLD})

    expect(warnSpy.mock.calls[0]?.[0]).toContain(
      'and 1 of them come from listeners tagged "derived-source".',
    )
    subscription.unsubscribe()
  })

  it('returns a client without observable.withConfig unchanged', () => {
    const partialClient = {
      listen: createFakeClient().listen,
      withConfig: () => partialClient,
      observable: {listen: createFakeObservableClient().listen},
    } as SanityClient
    const {listen} = partialClient

    expect(listenerCountWarning.attributeListeners(partialClient)).toBe(partialClient)
    expect(partialClient.listen).toBe(listen)
    expect(subscribeListenerCountsMock).toHaveBeenCalledTimes(0)
  })

  it('falls back to the original listen when withConfig returns the same client', () => {
    const selfConfiguringClient = createFakeClient()
    selfConfiguringClient.withConfig = () => selfConfiguringClient
    const attributedClient = listenerCountWarning.attributeListeners(selfConfiguringClient)

    expect(attributedClient.withConfig({})).toBe(attributedClient)
    attributedClient.listen('*').subscribe().unsubscribe()
  })
})

describe('listener count warning in production', () => {
  afterEach(() => {
    vi.doUnmock('../environment')
  })

  it('never logs, since the watcher only starts in dev', async () => {
    vi.resetModules()
    vi.doMock('../environment', () => ({isDev: false, isProd: true}))

    const listenerCountWarning: ListenerCountWarningModule = await import('./listenerCountWarning')
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    listenerCountWarning.attributeListeners(createFakeClient())

    expect(subscribeListenerCountsMock).toHaveBeenCalledTimes(0)
    expect(warnSpy).toHaveBeenCalledTimes(0)
    warnSpy.mockRestore()
  })
})

describe('listener count warning against the real open count', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('attributes every open listener to its source while subscriptions wait to connect', async () => {
    vi.resetModules()
    vi.doUnmock('./listenerCount')
    vi.stubGlobal('fetch', () => new Promise<never>(() => undefined))
    const listenerCountWarning: ListenerCountWarningModule = await import('./listenerCountWarning')
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const pendingConnections: OpenConnection[] = []
    const attributedClient = listenerCountWarning.attributeListeners(
      createFakeClient({}, (openConnection) => pendingConnections.push(openConnection)),
    )

    const subscriptions = Array.from({length: ABOVE_THRESHOLD + 10}, () =>
      attributedClient.listen('*', {}, {tag: 'flood'}).subscribe(),
    )
    pendingConnections.forEach((openConnection) => openConnection())

    expect(warnSpy.mock.calls[0]?.[0]).toContain(
      `This tab has ${ABOVE_THRESHOLD} open listeners, and ${ABOVE_THRESHOLD} of them come from listeners tagged "flood".`,
    )

    subscriptions.forEach((subscription) => subscription.unsubscribe())
    warnSpy.mockRestore()
  })
})
