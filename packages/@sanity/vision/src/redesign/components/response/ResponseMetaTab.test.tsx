import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {ToastProvider} from '@sanity/ui/toast'
import {act, cleanup, fireEvent, render, screen, within} from '@testing-library/react'
import {Activity} from 'react'
import {afterEach, describe, expect, it, onTestFinished, vi} from 'vitest'

import {encodeQueryString} from '../../../util/encodeQueryString'
import {encodedQuerySize, QUERY_URL_SIZE_LIMIT} from '../../../util/queryRequestMethod'
import {type VisionResponseMeta} from '../../store/types'
import {type QueryNetwork} from '../../util/queryNetwork'
import {ResponseMetaTab} from './ResponseMetaTab'

const cobe = vi.hoisted(() => {
  const update = vi.fn()
  const destroy = vi.fn()
  return {update, destroy, createGlobe: vi.fn(() => ({update, destroy}))}
})
vi.mock('cobe', () => ({default: cobe.createGlobe}))
// Wherever the tests run, the browser is in Oslo, unless a test says its time zone names no place
const zone = vi.hoisted(() => ({
  browser: {latitude: 59.91, longitude: 10.75} as {latitude: number; longitude: number} | undefined,
}))
vi.mock('../../util/timeZoneLocation', () => ({
  browserLocation: () => zone.browser,
  offsetLocation: () => ({latitude: 30, longitude: 0}),
}))

vi.mock('sanity', () => ({
  useNumberFormat: (options?: Intl.NumberFormatOptions) => new Intl.NumberFormat('en', options),
  defineLocalesResources: (_namespace: string, resources: unknown) => resources,
}))
vi.mock('sanity/i18n', () => ({
  defineLocaleResourceBundle: (bundle: unknown) => bundle,
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
}))

vi.stubGlobal(
  'matchMedia',
  vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
)

const theme = buildTheme()

function meta(
  network: QueryNetwork | undefined,
  url = 'https://abc.apicdn.sanity.io/v1/data/query/p?query=*',
): VisionResponseMeta {
  return {
    url,
    method: network?.method ?? 'GET',
    ms: 4,
    e2eMs: 90,
    payloadBytes: 10,
    syncTags: [],
    resultSourceMap: undefined,
    network,
  }
}

const cdnMiss: QueryNetwork = {
  method: 'GET',
  viaCdn: true,
  cacheHit: false,
  shard: 'gcp-eu-w1-01-prod-1028',
  traceId: 'trace-1',
  cacheControl: 'private, max-age=60',
}

async function renderTab(
  props: Partial<Parameters<typeof ResponseMetaTab>[0]> & {meta: VisionResponseMeta | undefined},
) {
  // The globe loads cobe with a dynamic import, which settles inside the act
  await act(async () => {
    render(
      <ThemeProvider theme={theme}>
        <ToastProvider>
          <LayerProvider>
            <ResponseMetaTab
              perspectiveName="published"
              resolved={{useCdn: true, isCdnBlockedByPerspective: false}}
              url={props.meta?.url}
              {...props}
            />
          </LayerProvider>
        </ToastProvider>
      </ThemeProvider>,
    )
  })
}

describe('ResponseMetaTab', () => {
  afterEach(() => cleanup())

  it('says when nothing has been fetched yet', async () => {
    await renderTab({meta: undefined})
    expect(screen.getByText('vision.response.empty')).toBeTruthy()
  })

  it('shows the URL of a fetch still in flight, without timings or the way it travelled', async () => {
    const url = 'https://abc.api.sanity.io/v1/data/query/p?query=*'
    await renderTab({meta: undefined, url})
    expect((screen.getByTestId('vision-query-url') as HTMLInputElement).value).toBe(url)
    expect(screen.getByTestId('vision-meta-execution').textContent).toBe(
      'result.timing-not-applicable',
    )
    expect(screen.getByTestId('vision-meta-e2e').textContent).toBe('result.timing-not-applicable')
    expect(screen.getByTestId('vision-meta-payload').textContent).toBe(
      'result.timing-not-applicable',
    )
    expect(screen.queryByTestId('vision-network-endpoint')).toBeNull()
    expect(screen.queryByTestId('vision-network-globe')).toBeNull()
  })

  it('shows a CDN miss, where the query ran, and draws the way there', async () => {
    await renderTab({meta: meta(cdnMiss)})
    expect(screen.getByTestId('vision-network-endpoint').textContent).toBe(
      'vision.network.endpoint.cdn',
    )
    expect(screen.getByTestId('vision-network-cache').textContent).toBe('vision.network.cache.miss')
    expect(screen.getByTestId('vision-network-region').textContent).toBe(
      'europe-west1 (St. Ghislain, Belgium)',
    )
    expect(screen.getByText('Cache-Control: private, max-age=60')).toBeTruthy()
    expect(screen.getByText('trace-1')).toBeTruthy()
    expect(cobe.createGlobe).toHaveBeenCalled()
    const [, options] = cobe.createGlobe.mock.lastCall as unknown[] as [unknown, {arcs: unknown[]}]
    expect(options.arcs).toHaveLength(1)
  })

  it('marks the globe ready once cobe has drawn it, so it fades in rather than popping in', async () => {
    await renderTab({meta: meta(cdnMiss)})
    const canvas = screen.getByTestId('vision-network-globe').querySelector('canvas')
    expect(canvas).not.toBeNull()
    expect(canvas?.hasAttribute('data-ready')).toBe(false)
    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve))
    })
    expect(cobe.update).toHaveBeenCalled()
    expect(canvas?.hasAttribute('data-ready')).toBe(true)
  })

  it('keeps the settled globe as a still picture when its tab is hidden and shown again', async () => {
    const drawImage = vi.fn()
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockImplementation(((type: string) => (type === '2d' ? {drawImage} : null)) as never)
    // The globe has finished turning by its first frame
    const frame = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => window.setTimeout(() => callback(1e9), 0))
    onTestFinished(() => {
      getContext.mockRestore()
      frame.mockRestore()
    })
    const ui = (mode: 'visible' | 'hidden') => (
      <ThemeProvider theme={theme}>
        <ToastProvider>
          <LayerProvider>
            <Activity mode={mode}>
              <ResponseMetaTab
                meta={meta(cdnMiss)}
                perspectiveName="published"
                resolved={{useCdn: true, isCdnBlockedByPerspective: false}}
                url={meta(cdnMiss).url}
              />
            </Activity>
          </LayerProvider>
        </ToastProvider>
      </ThemeProvider>
    )
    let view: ReturnType<typeof render> | undefined
    await act(async () => {
      view = render(ui('visible'))
    })
    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve))
    })
    const still = screen.getByTestId('vision-network-globe').querySelector('canvas')
    expect(drawImage).toHaveBeenCalledTimes(1)
    expect(still?.hasAttribute('data-ready')).toBe(true)
    // The WebGL globe is no longer needed once its picture is copied
    expect(cobe.destroy).toHaveBeenCalledTimes(1)
    expect(cobe.createGlobe).toHaveBeenCalledTimes(1)

    await act(async () => view?.rerender(ui('hidden')))
    await act(async () => view?.rerender(ui('visible')))
    expect(screen.getByTestId('vision-network-globe').querySelector('canvas')).toBe(still)
    expect(cobe.createGlobe).toHaveBeenCalledTimes(1)
  })

  it('settles the globe when its tab is hidden while it is still turning', async () => {
    const drawImage = vi.fn()
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockImplementation(((type: string) => (type === '2d' ? {drawImage} : null)) as never)
    onTestFinished(() => getContext.mockRestore())
    const ui = (mode: 'visible' | 'hidden') => (
      <ThemeProvider theme={theme}>
        <ToastProvider>
          <LayerProvider>
            <Activity mode={mode}>
              <ResponseMetaTab
                meta={meta(cdnMiss)}
                perspectiveName="published"
                resolved={{useCdn: true, isCdnBlockedByPerspective: false}}
                url={meta(cdnMiss).url}
              />
            </Activity>
          </LayerProvider>
        </ToastProvider>
      </ThemeProvider>
    )
    let view: ReturnType<typeof render> | undefined
    await act(async () => {
      view = render(ui('visible'))
    })
    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve))
    })
    expect(drawImage).not.toHaveBeenCalled()

    await act(async () => view?.rerender(ui('hidden')))
    expect(drawImage).toHaveBeenCalledTimes(1)
    const still = screen.getByTestId('vision-network-globe').querySelector('canvas')
    await act(async () => view?.rerender(ui('visible')))
    expect(screen.getByTestId('vision-network-globe').querySelector('canvas')).toBe(still)
    expect(cobe.createGlobe).toHaveBeenCalledTimes(1)
  })

  it('shows a CDN cache hit without a way to the API', async () => {
    await renderTab({meta: meta({...cdnMiss, cacheHit: true})})
    expect(screen.getByTestId('vision-network-cache').textContent).toBe('vision.network.cache.hit')
    expect(screen.getByText('vision.network.cache.hit-explained')).toBeTruthy()
    const [, options] = cobe.createGlobe.mock.lastCall as unknown[] as [unknown, {arcs: unknown[]}]
    expect(options.arcs).toHaveLength(0)
  })

  it('points at the option while queries go to the API, and says why when the perspective keeps them there', async () => {
    const api = meta(
      {
        method: 'GET',
        viaCdn: false,
        cacheHit: false,
        shard: undefined,
        traceId: undefined,
        cacheControl: undefined,
      },
      'https://abc.api.sanity.io/v1/data/query/p?query=*',
    )
    await renderTab({meta: api, resolved: {useCdn: false, isCdnBlockedByPerspective: false}})
    expect(screen.getByTestId('vision-network-endpoint').textContent).toBe(
      'vision.network.endpoint.api',
    )
    expect(screen.getByTestId('vision-network-cache').textContent).toBe('vision.network.cache.none')
    expect(screen.getByTestId('vision-network-region').textContent).toBe(
      'vision.network.region.unknown',
    )
    // The way to the CDN is behind an info button next to the endpoint, not spelled out
    expect(
      within(screen.getByTestId('vision-response-meta')).queryByText('vision.network.use-cdn-hint'),
    ).toBeNull()
    const info = screen.getByTestId('vision-network-endpoint-info')
    expect(info.getAttribute('aria-label')).toBe('vision.network.use-cdn-hint.label')
    await act(async () => {
      fireEvent.mouseEnter(info)
      await new Promise((resolve) => setTimeout(resolve, 600))
    })
    expect(screen.getByTestId('vision-network-endpoint-info-content').textContent).toBe(
      'vision.network.use-cdn-hint',
    )

    cleanup()
    await renderTab({
      meta: api,
      perspectiveName: 'Global (drafts)',
      resolved: {useCdn: false, isCdnBlockedByPerspective: true},
    })
    expect(screen.queryByTestId('vision-network-endpoint-info')).toBeNull()
    expect(screen.getByTestId('vision-network-cdn-blocked').textContent).toContain(
      'vision.options.use-cdn.blocked:{"perspective":"Global (drafts)"}',
    )
  })

  it('tells the CDN from the URL when the headers could not be read', async () => {
    await renderTab({meta: meta(undefined)})
    expect(screen.getByTestId('vision-network-endpoint').textContent).toBe(
      'vision.network.endpoint.cdn',
    )
  })

  it('shows the method, and explains a POST with the size the query and params came to', async () => {
    await renderTab({meta: meta(cdnMiss)})
    expect(screen.getByTestId('vision-network-method').textContent).toBe(
      'vision.network.method.get',
    )
    expect(screen.queryByTestId('vision-network-method-explained')).toBeNull()

    cleanup()
    // The URL Vision shows carries the query and params even when the client posted them
    const query = `*[_type == "author"] // ${'x'.repeat(QUERY_URL_SIZE_LIMIT)}`
    const url = `https://abc.apicdn.sanity.io/v1/data/query/p${encodeQueryString(query, {limit: 1})}&perspective=published`
    await renderTab({meta: meta({...cdnMiss, method: 'POST'}, url)})
    expect(screen.getByTestId('vision-network-method').textContent).toBe(
      'vision.network.method.post',
    )
    expect(screen.getByTestId('vision-network-method-explained').textContent).toBe(
      `vision.network.method.post-explained:${JSON.stringify({
        size: encodedQuerySize(query, {limit: 1}),
        limit: QUERY_URL_SIZE_LIMIT,
      })}`,
    )
  })

  it('keeps a short duration in milliseconds and writes a longer one in seconds', async () => {
    await renderTab({meta: {...meta(cdnMiss), ms: 888, e2eMs: 1_170, payloadBytes: 354_000}})
    expect(screen.getByTestId('vision-meta-execution').textContent).toBe('888ms')
    expect(screen.getByTestId('vision-meta-e2e').textContent).toBe('1.17s')
    expect(screen.getByTestId('vision-meta-payload').textContent).toBe('354 kB')
  })

  it('leaves the info button out once the CDN answers', async () => {
    await renderTab({
      meta: meta(cdnMiss),
      resolved: {useCdn: false, isCdnBlockedByPerspective: false},
    })
    expect(screen.queryByTestId('vision-network-endpoint-info')).toBeNull()
  })
  const wasmHit: QueryNetwork = {
    method: 'GET',
    viaCdn: true,
    cacheHit: false,
    shard: undefined,
    traceId: undefined,
    cacheControl: 'private, max-age=60',
    local: {
      documents: 51226,
      memoryBytes: 302841856,
      timings: [
        {name: 'wasm', dur: 1.84, desc: 'Query in WebAssembly'},
        {name: 'route', dur: 0.4, desc: 'Service worker to store and back'},
      ],
    },
    headersMs: 6.4,
  }

  it('shows an answer groq-store-wasm gave on this device, with a crab for you and no way anywhere', async () => {
    await renderTab({
      meta: meta(wasmHit),
      resolved: {useCdn: false, isCdnBlockedByPerspective: true},
    })
    expect(screen.getByTestId('vision-network-endpoint').textContent).toBe(
      'vision.network.endpoint.service-worker',
    )
    expect(screen.getByTestId('vision-network-region').textContent).toBe(
      'vision.network.region.local',
    )
    expect(screen.getByTestId('vision-network-local-copy').textContent).toBe(
      `vision.network.region.local-copy:${JSON.stringify({
        documents: '51K',
        memory: '303 MB',
      })}`,
    )
    expect(screen.getByTestId('vision-network-cache').textContent).toBe(
      'vision.network.cache.local',
    )
    expect(screen.queryByText('Cache-Control: private, max-age=60')).toBeNull()
    expect(screen.getByTestId('vision-network-timing').textContent).toBe(
      'vision.network.timing.local:{"e2e":"90.0ms"}',
    )
    expect(screen.getByTestId('vision-network-timing-wasm').textContent).toBe(
      'vision.network.timing.entry:{"label":"Query in WebAssembly","duration":"1.84ms"}',
    )
    expect(screen.getByTestId('vision-network-timing-route').textContent).toBe(
      'vision.network.timing.entry:{"label":"Service worker to store and back","duration":"400µs"}',
    )
    expect(screen.getByTestId('vision-network-timing-browser').textContent).toBe(
      'vision.network.timing.entry:{"label":"vision.network.timing.local-browser","duration":"6.00ms"}',
    )
    expect(screen.getByTestId('vision-network-timing-page').textContent).toBe(
      'vision.network.timing.entry:{"label":"vision.network.timing.local-page","duration":"83.6ms"}',
    )
    // The rows add up to the round trip: the query is inside the route that carried it
    expect(
      screen
        .getAllByTestId(/^vision-network-timing-/)
        .map((node) => node.dataset.testid?.replace('vision-network-timing-', '')),
    ).toEqual(['browser', 'route', 'wasm', 'page'])
    expect(screen.queryByTestId('vision-network-endpoint-info')).toBeNull()
    expect(screen.queryByTestId('vision-network-cdn-blocked')).toBeNull()
    expect(screen.getByTestId('vision-network-crab').textContent).toBe('🦀')
    expect(screen.queryByText('vision.network.you')).toBeNull()
    const [, options] = cobe.createGlobe.mock.lastCall as unknown[] as [
      unknown,
      {arcs: unknown[]; markers: unknown[]},
    ]
    expect(options.arcs).toHaveLength(0)
    expect(options.markers).toHaveLength(0)
  })

  it('shows a local answer from before groq-store-wasm reported its size and timings', async () => {
    await renderTab({meta: meta({...wasmHit, local: {timings: []}})})
    expect(screen.getByTestId('vision-network-endpoint').textContent).toBe(
      'vision.network.endpoint.service-worker',
    )
    expect(screen.queryByTestId('vision-network-local-copy')).toBeNull()
    expect(screen.queryByTestId('vision-network-timing-wasm')).toBeNull()
    expect(screen.getByTestId('vision-network-crab')).toBeTruthy()
  })

  it('still shows the crab when the time zone names no place, as on a machine set to UTC', async () => {
    zone.browser = undefined
    cobe.createGlobe.mockClear()
    try {
      await renderTab({meta: meta(wasmHit)})
      expect(screen.getByTestId('vision-network-crab').textContent).toBe('🦀')
      expect(cobe.createGlobe).toHaveBeenCalled()
    } finally {
      zone.browser = {latitude: 59.91, longitude: 10.75}
    }
  })

  it('keeps the blue dot for answers from the API', async () => {
    await renderTab({meta: meta(cdnMiss)})
    expect(screen.queryByTestId('vision-network-crab')).toBeNull()
    expect(screen.getByText('vision.network.you')).toBeTruthy()
    expect(screen.getByText('europe-west1')).toBeTruthy()
    const [, options] = cobe.createGlobe.mock.lastCall as unknown[] as [
      unknown,
      {markers: unknown[]},
    ]
    expect(options.markers).toHaveLength(2)
  })

  it('shows the measured WebAssembly execution time and local round trip', async () => {
    await renderTab({
      meta: {
        ...meta({
          ...wasmHit,
          local: {
            documents: 51226,
            timings: [{name: 'wasm', dur: 0.62, desc: 'Query in WebAssembly'}],
          },
        }),
        ms: 1,
        e2eMs: 12.43,
      },
      resolved: {useCdn: false, isCdnBlockedByPerspective: false},
    })
    expect(screen.getByTestId('vision-network-timing-wasm').textContent).toBe(
      'vision.network.timing.entry:{"label":"Query in WebAssembly","duration":"620µs"}',
    )
    expect(screen.getByTestId('vision-network-timing').textContent).toBe(
      'vision.network.timing.local:{"e2e":"12.4ms"}',
    )
    expect(screen.queryByTestId('vision-network-endpoint-info')).toBeNull()
  })
})
