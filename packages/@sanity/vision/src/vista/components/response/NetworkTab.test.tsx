import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {act, cleanup, render, screen} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {type VistaResponseMeta} from '../../store/types'
import {type QueryNetwork} from '../../util/queryNetwork'
import {NetworkTab} from './NetworkTab'

const cobe = vi.hoisted(() => {
  const update = vi.fn()
  const destroy = vi.fn()
  return {update, destroy, createGlobe: vi.fn(() => ({update, destroy}))}
})
vi.mock('cobe', () => ({default: cobe.createGlobe}))
// Wherever the tests run, the browser is in Oslo
vi.mock('../../util/timeZoneLocation', () => ({
  browserLocation: () => ({latitude: 59.91, longitude: 10.75}),
}))

vi.mock('sanity', () => ({
  defineLocaleResourceBundle: (bundle: unknown) => bundle,
  defineLocalesResources: (_namespace: string, resources: unknown) => resources,
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
): VistaResponseMeta {
  return {
    url,
    ms: 4,
    e2eMs: 90,
    payloadBytes: 10,
    syncTags: [],
    resultSourceMap: undefined,
    network,
  }
}

const cdnMiss: QueryNetwork = {
  viaCdn: true,
  cacheHit: false,
  shard: 'gcp-eu-w1-01-prod-1028',
  traceId: 'trace-1',
  cacheControl: 'private, max-age=60',
}

async function renderTab(
  props: Partial<Parameters<typeof NetworkTab>[0]> & {meta: VistaResponseMeta | undefined},
) {
  // The globe loads cobe with a dynamic import, which settles inside the act
  await act(async () => {
    render(
      <ThemeProvider theme={theme}>
        <LayerProvider>
          <NetworkTab resolved={{useCdn: true, isCdnBlockedByPerspective: false}} {...props} />
        </LayerProvider>
      </ThemeProvider>,
    )
  })
}

describe('NetworkTab', () => {
  afterEach(() => cleanup())

  it('says what it will show before there is a response', async () => {
    await renderTab({meta: undefined})
    expect(screen.getByText('vista.network.empty')).toBeTruthy()
  })

  it('shows a CDN miss, where the query ran, and draws the way there', async () => {
    await renderTab({meta: meta(cdnMiss)})
    expect(screen.getByTestId('vista-network-endpoint').textContent).toBe(
      'vista.network.endpoint.cdn',
    )
    expect(screen.getByTestId('vista-network-cache').textContent).toBe('vista.network.cache.miss')
    expect(screen.getByTestId('vista-network-region').textContent).toBe(
      'europe-west1 (St. Ghislain, Belgium)',
    )
    expect(screen.getByText('Cache-Control: private, max-age=60')).toBeTruthy()
    expect(screen.getByText('trace-1')).toBeTruthy()
    expect(cobe.createGlobe).toHaveBeenCalled()
    const [, options] = cobe.createGlobe.mock.lastCall as unknown[] as [unknown, {arcs: unknown[]}]
    expect(options.arcs).toHaveLength(1)
  })

  it('shows a CDN cache hit without a way to the API', async () => {
    await renderTab({meta: meta({...cdnMiss, cacheHit: true})})
    expect(screen.getByTestId('vista-network-cache').textContent).toBe('vista.network.cache.hit')
    expect(screen.getByText('vista.network.cache.hit-explained')).toBeTruthy()
    const [, options] = cobe.createGlobe.mock.lastCall as unknown[] as [unknown, {arcs: unknown[]}]
    expect(options.arcs).toHaveLength(0)
  })

  it('points at the option while queries go to the API, and says why when the perspective keeps them there', async () => {
    const api = meta(
      {
        viaCdn: false,
        cacheHit: false,
        shard: undefined,
        traceId: undefined,
        cacheControl: undefined,
      },
      'https://abc.api.sanity.io/v1/data/query/p?query=*',
    )
    await renderTab({meta: api, resolved: {useCdn: false, isCdnBlockedByPerspective: false}})
    expect(screen.getByTestId('vista-network-endpoint').textContent).toBe(
      'vista.network.endpoint.api',
    )
    expect(screen.getByTestId('vista-network-cache').textContent).toBe('vista.network.cache.none')
    expect(screen.getByTestId('vista-network-region').textContent).toBe(
      'vista.network.region.unknown',
    )
    expect(screen.getByTestId('vista-network-hint').textContent).toBe('vista.network.use-cdn-hint')

    cleanup()
    await renderTab({meta: api, resolved: {useCdn: false, isCdnBlockedByPerspective: true}})
    expect(screen.getByTestId('vista-network-hint').textContent).toBe(
      'vista.options.use-cdn.blocked-by-perspective',
    )
  })

  it('tells the CDN from the URL when the headers could not be read', async () => {
    await renderTab({meta: meta(undefined)})
    expect(screen.getByTestId('vista-network-endpoint').textContent).toBe(
      'vista.network.endpoint.cdn',
    )
  })
})
