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

function countsInMessage(message: string): {total: number; sourceSum: number} {
  const total = Number(message.match(/This tab has (\d+) open listeners/)?.[1])
  const sourceList = message.match(/by source: (.*?)\.(?: |$)/)?.[1] ?? ''
  const otherClients = Number(message.match(/other clients: (\d+)/)?.[1] ?? 0)
  const attributed = Array.from(sourceList.matchAll(/\((\d+)\)/g)).reduce(
    (sum, match) => sum + Number(match[1]),
    0,
  )
  return {total, sourceSum: attributed + otherClients}
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
  it('parses a Chrome frame with a function name', () => {
    const stack = [
      'Error',
      OWN_MODULE_FRAME,
      '    at Leaf (/plugins/listener-flood/ListenerFlood.tsx:12:34)',
      '    at commitHookEffectListMount (/node_modules/react-dom/cjs/react-dom-client.development.js:1234:5)',
    ].join('\n')

    expect(parseCallSite(stack)).toBe('/plugins/listener-flood/ListenerFlood.tsx:12')
  })

  it('parses an anonymous Chrome frame', () => {
    const stack = [
      'Error',
      OWN_MODULE_FRAME,
      '    at /plugins/listener-flood/ListenerFlood.tsx:12:34',
    ].join('\n')

    expect(parseCallSite(stack)).toBe('/plugins/listener-flood/ListenerFlood.tsx:12')
  })

  it('parses a Firefox/Safari frame', () => {
    const stack = [
      'captureStack@/packages/sanity/src/core/network/listenerCountWarning.ts:95:20',
      'Leaf@/plugins/listener-flood/ListenerFlood.tsx:12:34',
      'commitHookEffectListMount@/node_modules/react-dom/cjs/react-dom-client.development.js:1234:5',
    ].join('\n')

    expect(parseCallSite(stack)).toBe('/plugins/listener-flood/ListenerFlood.tsx:12')
  })

  it('strips the origin and the Vite cache-busting query string', () => {
    const stack = [
      'Error',
      OWN_MODULE_FRAME,
      '    at Leaf (http://localhost:3333/plugins/listener-flood/ListenerFlood.tsx?t=1700000000:12:34)',
    ].join('\n')

    expect(parseCallSite(stack)).toBe('/plugins/listener-flood/ListenerFlood.tsx:12')
  })

  it('parses a webpack-internal frame whose path itself contains parentheses', () => {
    const stack = [
      'Error',
      OWN_MODULE_FRAME,
      '    at Leaf (webpack-internal:///(app-pages-browser)/./components/Leaf.tsx:12:34)',
    ].join('\n')

    expect(parseCallSite(stack)).toBe('/(app-pages-browser)/components/Leaf.tsx:12')
  })

  it('parses a scoped node_modules frame without losing the package name (Chrome)', () => {
    const stack = [
      'Error',
      OWN_MODULE_FRAME,
      '    at Object.listen (/node_modules/@sanity/client/dist/index.js:123:9)',
    ].join('\n')

    expect(parseCallSite(stack, () => false)).toBe('/node_modules/@sanity/client/dist/index.js:123')
  })

  it('parses a scoped node_modules frame without losing the package name (Firefox/Safari)', () => {
    const stack = [
      'captureStack@/packages/sanity/src/core/network/listenerCountWarning.ts:95:20',
      'Object.listen@/node_modules/@sanity/client/dist/index.js:123:9',
    ].join('\n')

    expect(parseCallSite(stack, () => false)).toBe('/node_modules/@sanity/client/dist/index.js:123')
  })

  it('returns undefined when every frame is library code', () => {
    const stack = [
      'Error',
      '    at resolveListenerLabel (/packages/sanity/src/core/network/listenerCountWarning.ts:90:20)',
      '    at Object.listen (/node_modules/@sanity/client/dist/index.js:123:9)',
    ].join('\n')

    expect(parseCallSite(stack)).toBeUndefined()
  })

  it('drops the call site when bundling collapses it into the same file as this module', () => {
    const stack = [
      'Error',
      '    at resolveListenerLabel (http://localhost:3333/assets/index.js:4821:19)',
      '    at Leaf (http://localhost:3333/assets/index.js:9104:33)',
    ].join('\n')

    expect(parseCallSite(stack)).toBeUndefined()
  })

  it('treats bundled chunk frames as library code', () => {
    const stack = [
      'Error',
      OWN_MODULE_FRAME,
      '    at Leaf (http://localhost:3333/assets/source-COlqOjAG.js:61124:9)',
    ].join('\n')

    expect(parseCallSite(stack)).toBeUndefined()
  })

  it.each([
    '    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)',
    '    at processTicksAndRejections (internal/process/task_queues:65:5)',
  ])('treats the Node-internal frame %s as library code', (nodeFrame) => {
    const stack = ['Error', OWN_MODULE_FRAME, nodeFrame].join('\n')

    expect(parseCallSite(stack)).toBeUndefined()
  })

  it('uses a custom isLibraryFrame predicate when given one', () => {
    const stack = [
      'Error',
      OWN_MODULE_FRAME,
      '    at Leaf (/plugins/listener-flood/ListenerFlood.tsx:12:34)',
      '    at Root (/dev/test-studio/sanity.config.ts:5:1)',
    ].join('\n')

    expect(parseCallSite(stack, (frameUrl) => frameUrl.includes('/plugins/'))).toBe(
      '/dev/test-studio/sanity.config.ts:5',
    )
  })
})

describe('formatListenerLabel', () => {
  it('combines the call site and the owner when both are known', () => {
    const label = formatListenerLabel({
      callSite: '/plugins/listener-flood/ListenerFlood.tsx:12',
      owner: 'Parent',
      tag: undefined,
    })

    expect(label).toBe('/plugins/listener-flood/ListenerFlood.tsx:12 (under Parent)')
  })

  it('uses the call site alone when there is no owner', () => {
    const label = formatListenerLabel({
      callSite: '/plugins/listener-flood/ListenerFlood.tsx:12',
      owner: undefined,
      tag: undefined,
    })

    expect(label).toBe('/plugins/listener-flood/ListenerFlood.tsx:12')
  })

  it('uses the owner alone when there is no call site', () => {
    const label = formatListenerLabel({callSite: undefined, owner: 'Parent', tag: undefined})

    expect(label).toBe('under Parent')
  })

  it('adds the tag to the owner when there is no call site', () => {
    const label = formatListenerLabel({callSite: undefined, owner: 'Parent', tag: 'my-tag'})

    expect(label).toBe('under Parent, tag my-tag')
  })

  it('falls back to the tag when neither the call site nor the owner is known', () => {
    const label = formatListenerLabel({
      callSite: undefined,
      owner: undefined,
      tag: 'document.pair-listener',
    })

    expect(label).toBe('tag document.pair-listener')
  })

  it('falls back to unknown when nothing is known', () => {
    const label = formatListenerLabel({callSite: undefined, owner: undefined, tag: undefined})

    expect(label).toBe('unknown')
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

  it('logs once when the open count crosses the threshold, and not again while it stays above', () => {
    listenerCountWarning.attributeListeners(createFakeClient())
    const subscriber = getListenerCountSubscriber()

    subscriber({open: LISTENER_WARNING_THRESHOLD + 1, peak: LISTENER_WARNING_THRESHOLD + 1})
    expect(warnSpy).toHaveBeenCalledTimes(1)

    subscriber({open: LISTENER_WARNING_THRESHOLD + 11, peak: LISTENER_WARNING_THRESHOLD + 11})
    expect(warnSpy).toHaveBeenCalledTimes(1)
  })

  it('does not warn when the open count equals the threshold', () => {
    listenerCountWarning.attributeListeners(createFakeClient())
    const subscriber = getListenerCountSubscriber()

    subscriber({open: LISTENER_WARNING_THRESHOLD, peak: LISTENER_WARNING_THRESHOLD})

    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('names the owning component for a listen call made in an effect', () => {
    const attributedClient = listenerCountWarning.attributeListeners(createFakeClient())
    const subscriber = getListenerCountSubscriber()

    render(<Parent client={attributedClient} />)
    subscriber({open: LISTENER_WARNING_THRESHOLD + 1, peak: LISTENER_WARNING_THRESHOLD + 1})

    expect(warnSpy.mock.calls[0]?.[0]).toContain('under Parent (1)')
  })

  it('labels a listen call made outside React with its tag', () => {
    const attributedClient = listenerCountWarning.attributeListeners(createFakeClient())
    const subscriber = getListenerCountSubscriber()
    const subscription = attributedClient
      .listen('*', {}, {tag: 'document.pair-listener'})
      .subscribe()

    subscriber({open: LISTENER_WARNING_THRESHOLD + 1, peak: LISTENER_WARNING_THRESHOLD + 1})

    expect(warnSpy.mock.calls[0]?.[0]).toContain('tag document.pair-listener (1)')
    subscription.unsubscribe()
  })

  it('re-arms only once the open count falls to half the threshold', () => {
    listenerCountWarning.attributeListeners(createFakeClient())
    const subscriber = getListenerCountSubscriber()

    subscriber({open: ABOVE_THRESHOLD, peak: ABOVE_THRESHOLD})
    expect(warnSpy).toHaveBeenCalledTimes(1)

    subscriber({open: REARM_THRESHOLD + 1, peak: ABOVE_THRESHOLD})
    subscriber({open: ABOVE_THRESHOLD, peak: ABOVE_THRESHOLD})
    expect(warnSpy).toHaveBeenCalledTimes(1)

    subscriber({open: REARM_THRESHOLD, peak: ABOVE_THRESHOLD})
    subscriber({open: ABOVE_THRESHOLD, peak: ABOVE_THRESHOLD})
    expect(warnSpy).toHaveBeenCalledTimes(2)
  })

  it('drops an unsubscribed source from the next message, counting it among other clients', () => {
    const attributedClient = listenerCountWarning.attributeListeners(createFakeClient())
    const subscriber = getListenerCountSubscriber()
    const subscription = attributedClient.listen('*', {}, {tag: 'temporary-source'}).subscribe()

    subscriber({open: ABOVE_THRESHOLD, peak: ABOVE_THRESHOLD})
    expect(warnSpy.mock.calls[0]?.[0]).toContain('tag temporary-source (1)')
    expect(warnSpy.mock.calls[0]?.[0]).toContain(
      `Listeners from other clients: ${LISTENER_WARNING_THRESHOLD}`,
    )

    subscription.unsubscribe()

    subscriber({open: REARM_THRESHOLD, peak: ABOVE_THRESHOLD})
    subscriber({open: ABOVE_THRESHOLD, peak: ABOVE_THRESHOLD})

    expect(warnSpy).toHaveBeenCalledTimes(2)
    expect(warnSpy.mock.calls[1]?.[0]).not.toContain('temporary-source')
    expect(warnSpy.mock.calls[1]?.[0]).toContain(`Listeners from other clients: ${ABOVE_THRESHOLD}`)
  })

  it('attributes subscriptions on a client derived with withConfig', () => {
    const attributedClient = listenerCountWarning.attributeListeners(createFakeClient())
    const subscriber = getListenerCountSubscriber()
    const derivedClient = attributedClient.withConfig({apiVersion: '2025-02-07'})
    const subscription = derivedClient.listen('*', {}, {tag: 'derived-source'}).subscribe()

    subscriber({open: LISTENER_WARNING_THRESHOLD + 1, peak: LISTENER_WARNING_THRESHOLD + 1})

    expect(warnSpy.mock.calls[0]?.[0]).toContain('tag derived-source (1)')
    subscription.unsubscribe()
  })

  it('attributes subscriptions on a twice-derived observable client', () => {
    const attributedClient = listenerCountWarning.attributeListeners(createFakeClient())
    const subscriber = getListenerCountSubscriber()
    const derivedObservableClient = attributedClient.observable
      .withConfig({apiVersion: '2025-02-07'})
      .withConfig({apiVersion: '2025-06-01'})
    const subscription = derivedObservableClient
      .listen('*', {}, {tag: 'twice-derived-observable-source'})
      .subscribe()

    subscriber({open: LISTENER_WARNING_THRESHOLD + 1, peak: LISTENER_WARNING_THRESHOLD + 1})

    expect(warnSpy.mock.calls[0]?.[0]).toContain('tag twice-derived-observable-source (1)')
    subscription.unsubscribe()
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

    expect(subscribeListenerCountsMock).not.toHaveBeenCalled()
    expect(warnSpy).not.toHaveBeenCalled()
    warnSpy.mockRestore()
  })
})

describe('listener count warning against the real open count', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('breaks the total down into sources that sum to it while subscriptions wait to connect', async () => {
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

    const message = String(warnSpy.mock.calls[0]?.[0])
    expect(message).toContain(`This tab has ${ABOVE_THRESHOLD} open listeners`)
    const {total, sourceSum} = countsInMessage(message)
    expect(sourceSum).toBe(total)

    subscriptions.forEach((subscription) => subscription.unsubscribe())
    warnSpy.mockRestore()
  })
})
