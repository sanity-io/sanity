import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {ToastProvider} from '@sanity/ui/toast'
import {cleanup, render, screen} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {type VisionResponseMeta} from '../../store/types'
import {ResponseMetaTab} from './ResponseMetaTab'

vi.mock('sanity', () => ({
  defineLocaleResourceBundle: (bundle: unknown) => bundle,
  defineLocalesResources: (_namespace: string, resources: unknown) => resources,
  useTranslation: () => ({
    t: (key: string) => key,
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
const queryUrl = 'https://example.api.sanity.io/v2025-02-19/data/query/test?query=*'

const meta: VisionResponseMeta = {
  url: queryUrl,
  method: 'GET',
  ms: 888,
  e2eMs: 1_170,
  payloadBytes: 354_000,
  syncTags: [],
  resultSourceMap: undefined,
  network: undefined,
}

function renderTab(props: {meta?: VisionResponseMeta; url?: string} = {meta, url: queryUrl}) {
  render(
    <ThemeProvider theme={theme}>
      <ToastProvider>
        <LayerProvider>
          <ResponseMetaTab meta={props.meta} url={props.url} />
        </LayerProvider>
      </ToastProvider>
    </ThemeProvider>,
  )
}

describe('ResponseMetaTab', () => {
  afterEach(() => cleanup())

  it('keeps a short duration in milliseconds and writes a longer one in seconds', () => {
    renderTab()
    expect(screen.getByTestId('vision-meta-execution').textContent).toBe('888ms')
    expect(screen.getByTestId('vision-meta-e2e').textContent).toBe('1.17s')
    expect(screen.getByTestId('vision-meta-payload').textContent).toBe('354 kB')
  })

  it('says when there is no response yet', () => {
    renderTab({url: queryUrl})
    expect(screen.getByTestId('vision-meta-execution').textContent).toBe(
      'result.timing-not-applicable',
    )
    expect(screen.getByTestId('vision-meta-e2e').textContent).toBe('result.timing-not-applicable')
    expect(screen.getByTestId('vision-meta-payload').textContent).toBe(
      'result.timing-not-applicable',
    )
  })
})
