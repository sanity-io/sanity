import {render, screen} from '@testing-library/react'
import {type ComponentType, type ReactNode} from 'react'
import {beforeAll, beforeEach, expect, it, vi} from 'vitest'
import {onLCP} from 'web-vitals/attribution'

import {stubMessageBusHost} from '../../../../../test/testUtils/stubMessageBusHost'
import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import type * as RenderingContextStoreModule from '../../../store/renderingContext/createRenderingContextStore'
import {PerformanceTelemetryTracker} from '../PerformanceTelemetry'

vi.mock('web-vitals/attribution', () => ({
  onCLS: vi.fn(),
  onFCP: vi.fn(),
  onINP: vi.fn(),
  onLCP: vi.fn(),
  onTTFB: vi.fn(),
}))

// The URL query the rendering context store reads, so a test can render Studio in the Dashboard.
let renderingContextSearch: string | undefined

vi.mock('../../../store/renderingContext/createRenderingContextStore', async (importOriginal) => {
  const actual = await importOriginal<typeof RenderingContextStoreModule>()
  return {
    ...actual,
    createRenderingContextStore: () => actual.createRenderingContextStore(renderingContextSearch),
  }
})

const CORE_UI_SEARCH = `?_context=${encodeURIComponent(
  JSON.stringify({mode: 'core-ui', env: 'test'}),
)}`

const observedEntryTypes: string[] = []

// jsdom has no PerformanceObserver, which the legacy INP measurement needs.
class RecordingPerformanceObserver {
  observe({type}: {type: string}) {
    observedEntryTypes.push(type)
  }
  disconnect() {}
}

let TestProvider: ComponentType<{children?: ReactNode}>

beforeAll(async () => {
  TestProvider = await createTestProvider()
})

beforeEach(() => {
  observedEntryTypes.length = 0
  renderingContextSearch = undefined
  vi.clearAllMocks()
  vi.stubGlobal('PerformanceObserver', RecordingPerformanceObserver)
  return () => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  }
})

function renderTracker() {
  render(
    <TestProvider>
      <PerformanceTelemetryTracker>
        <div data-testid="studio" />
      </PerformanceTelemetryTracker>
    </TestProvider>,
  )
  expect(screen.getByTestId('studio')).toBeInTheDocument()
}

it('measures the page without a message bus host', () => {
  renderTracker()

  expect(onLCP).toHaveBeenCalledTimes(1)
  expect(observedEntryTypes).toEqual(['event'])
})

it('leaves the page unmeasured with a message bus host, which shares it', () => {
  stubMessageBusHost()

  renderTracker()

  expect(onLCP).not.toHaveBeenCalled()
  expect(observedEntryTypes).toEqual([])
})

it('measures the page over Comlink, where Studio has a document of its own', () => {
  renderingContextSearch = CORE_UI_SEARCH
  // The Dashboard renders Studio in a frame.
  vi.spyOn(window, 'top', 'get').mockReturnValue(null)

  renderTracker()

  expect(onLCP).toHaveBeenCalledTimes(1)
  expect(observedEntryTypes).toEqual(['event'])
})
