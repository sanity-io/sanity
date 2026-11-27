import {LayerProvider, ThemeProvider, useBoundaryElement} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {cleanup, fireEvent, render, screen} from '@testing-library/react'
import {useState} from 'react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {type VisionExperience, VisionExperienceContext} from '../store/VisionActorContext'
import {PANEL_HEADER_HEIGHT} from './CollapsiblePanel'
import {MIN_PANEL_BODY_HEIGHT} from './panelSnapShut'
import {type BottomPanelState, SplitWithBottomPanel} from './SplitWithBottomPanel'

vi.mock('sanity', () => ({
  defineLocalesResources: (_namespace: string, resources: unknown) => resources,
}))
vi.mock('sanity/_dangerously_use_private_internals_that_do_not_follow_semver-1', () => ({
  STUDIO_RESIZE_TRANSITION_TYPE: 'sanity-studio-resize',
  STUDIO_SKIP_TRANSITION_TYPE: 'sanity-studio-skip',
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
const EXPERIENCE: VisionExperience = {layout: 'columns'}

/** Renders the test id of the boundary element its overlays would be kept inside */
function BoundaryProbe({testId}: {testId: string}) {
  const boundary = useBoundaryElement().element
  return <span data-boundary={boundary?.dataset.testid ?? 'none'} data-testid={testId} />
}

function Pane({name}: {name: 'request' | 'response'}) {
  return (
    <SplitWithBottomPanel
      column={name}
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
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )
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

function ControlledPane({minMainHeight}: {minMainHeight?: number}) {
  const [state, setState] = useState<BottomPanelState>({
    activeTabId: 'first',
    collapsed: false,
    bottomSizes: {columns: 200},
  })
  return (
    <SplitWithBottomPanel
      column="response"
      id="vision-response"
      minMainHeight={minMainHeight}
      onStateChange={setState}
      state={state}
      tabs={[
        {id: 'first', label: 'First', content: <div data-testid="first-content" />},
        {id: 'second', label: 'Second', content: <div data-testid="second-content" />},
      ]}
      testId="vision-response"
    >
      <div />
    </SplitWithBottomPanel>
  )
}

function renderPane({minMainHeight}: {minMainHeight?: number} = {}) {
  // Every box measures 800 × 600, so the split has room to resize
  vi.stubGlobal(
    'ResizeObserver',
    class implements ResizeObserver {
      constructor(private readonly callback: ResizeObserverCallback) {}
      observe() {
        const entry = {contentRect: DOMRect.fromRect({width: 800, height: 600})}
        this.callback([entry as ResizeObserverEntry], this)
      }
      unobserve() {}
      disconnect() {}
    },
  )
  render(
    <ThemeProvider theme={theme}>
      <LayerProvider>
        <VisionExperienceContext value={EXPERIENCE}>
          <ControlledPane minMainHeight={minMainHeight} />
        </VisionExperienceContext>
      </LayerProvider>
    </ThemeProvider>,
  )
  return {
    handle: screen.getByTestId('vision-response-split-handle'),
    toggle: screen.getByTestId('vision-response-panel-toggle'),
    size: () => Number(screen.getByTestId('vision-response-split-handle').ariaValueNow),
  }
}

describe('SplitWithBottomPanel resizing', () => {
  const snapBelow = PANEL_HEADER_HEIGHT + MIN_PANEL_BODY_HEIGHT

  it('snaps shut when a drag leaves less than a line of body, and reopens at the earlier height', () => {
    const {handle, toggle, size} = renderPane()
    fireEvent.pointerDown(handle, {button: 0, clientY: 400, pointerId: 1})
    fireEvent.pointerMove(handle, {clientY: 400 + 200 - snapBelow + 1})
    // Still open while the pointer is down
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    fireEvent.pointerUp(handle)
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(size()).toBe(PANEL_HEADER_HEIGHT)
    expect(screen.queryByTestId('first-content')).toBeNull()

    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    expect(size()).toBe(200)
  })

  it('stays open when a drag leaves at least a line of body', () => {
    const {handle, toggle, size} = renderPane()
    fireEvent.pointerDown(handle, {button: 0, clientY: 400, pointerId: 1})
    fireEvent.pointerMove(handle, {clientY: 400 + 200 - snapBelow})
    fireEvent.pointerUp(handle)
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    expect(size()).toBe(snapBelow)
  })

  it('reopens on the last tab at the earlier height when the divider of a panel that snapped shut is dragged open', () => {
    const {handle, toggle, size} = renderPane()
    fireEvent.click(screen.getByRole('tab', {name: 'Second'}))
    fireEvent.pointerDown(handle, {button: 0, clientY: 400, pointerId: 1})
    fireEvent.pointerMove(handle, {clientY: 600})
    fireEvent.pointerUp(handle)
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(handle.getAttribute('aria-disabled')).toBeNull()

    // Not far enough for a line of body: it stays shut
    fireEvent.pointerDown(handle, {button: 0, clientY: 600, pointerId: 1})
    fireEvent.pointerMove(handle, {clientY: 600 - MIN_PANEL_BODY_HEIGHT + 1})
    fireEvent.pointerUp(handle)
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(size()).toBe(PANEL_HEADER_HEIGHT)

    fireEvent.pointerDown(handle, {button: 0, clientY: 600, pointerId: 1})
    fireEvent.pointerMove(handle, {clientY: 600 - 80})
    // The panel follows the pointer open, on its last tab
    expect(size()).toBe(PANEL_HEADER_HEIGHT + 80)
    expect(screen.getByTestId('second-content')).toBeTruthy()
    fireEvent.pointerUp(handle)
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    expect(size()).toBe(200)
    expect(screen.getByRole('tab', {name: 'Second'}).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByTestId('second-content')).toBeTruthy()
  })

  it('keeps the main area at the height the column asks for', () => {
    const {handle, size} = renderPane({minMainHeight: 200})
    expect(handle.getAttribute('aria-valuemax')).toBe(String(600 - 200 - 1))
    handle.focus()
    fireEvent.keyDown(handle, {key: 'End'})
    expect(size()).toBe(600 - 200 - 1)
  })

  it('snaps shut from the keyboard, and hands focus to the toggle', () => {
    const {handle, toggle} = renderPane()
    handle.focus()
    fireEvent.keyDown(handle, {key: 'Home'})
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(toggle)
  })
})
