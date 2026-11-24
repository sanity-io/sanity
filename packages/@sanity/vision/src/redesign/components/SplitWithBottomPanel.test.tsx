import {LayerProvider, ThemeProvider, useBoundaryElement} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {cleanup, render, screen} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {type VisionExperience, VisionExperienceContext} from '../store/VisionActorContext'
import {SplitWithBottomPanel} from './SplitWithBottomPanel'

vi.mock('sanity', () => ({
  defineLocalesResources: (_namespace: string, resources: unknown) => resources,
}))
vi.mock('sanity/i18n', () => ({
  defineLocaleResourceBundle: (bundle: unknown) => bundle,
  useTranslation: () => ({t: (key: string) => key}),
}))

// @sanity/ui's ThemeProvider reads the color scheme preference
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

vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    disconnect() {}
  },
)

const theme = buildTheme()
const EXPERIENCE: VisionExperience = {layout: 'columns', switchToClassic: () => {}}
const DEFAULT_BOTTOM_SIZE = {columns: 200, stacked: 160, mobile: 160}

/** Renders the test id of the boundary element its overlays would be kept inside */
function BoundaryProbe({testId}: {testId: string}) {
  const boundary = useBoundaryElement().element
  return <span data-boundary={boundary?.dataset.testid ?? 'none'} data-testid={testId} />
}

function Pane({name}: {name: string}) {
  return (
    <SplitWithBottomPanel
      defaultBottomSize={DEFAULT_BOTTOM_SIZE}
      footer={<BoundaryProbe testId={`${name}-footer-probe`} />}
      id={`vision-${name}`}
      tabs={[
        {id: 'first', label: 'First', content: <BoundaryProbe testId={`${name}-panel-probe`} />},
      ]}
      testId={`vision-${name}`}
    >
      <BoundaryProbe testId={`${name}-main-probe`} />
    </SplitWithBottomPanel>
  )
}

afterEach(() => {
  cleanup()
})

describe('SplitWithBottomPanel', () => {
  it('keeps the overlays of each pane inside that pane', () => {
    render(
      <ThemeProvider theme={theme}>
        <LayerProvider>
          <VisionExperienceContext value={EXPERIENCE}>
            <Pane name="request" />
            <Pane name="response" />
          </VisionExperienceContext>
        </LayerProvider>
      </ThemeProvider>,
    )

    for (const name of ['request', 'response']) {
      for (const region of ['main', 'panel', 'footer']) {
        expect(screen.getByTestId(`${name}-${region}-probe`).dataset.boundary).toBe(
          `vision-${name}`,
        )
      }
    }
  })
})
