import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {cleanup, fireEvent, render, screen} from '@testing-library/react'
import {useState} from 'react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {CollapsiblePanel, type CollapsiblePanelTab} from './CollapsiblePanel'

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
const TABS: CollapsiblePanelTab[] = [
  {id: 'response', label: 'Response', content: <div data-testid="response-content" />},
  {id: 'history', label: 'History', content: <div data-testid="history-content" />},
]

function Harness() {
  const [activeTabId, setActiveTabId] = useState('response')
  const [collapsed, setCollapsed] = useState(false)
  return (
    <ThemeProvider theme={theme}>
      <LayerProvider>
        <CollapsiblePanel
          activeTabId={activeTabId}
          collapsed={collapsed}
          id="vision-response"
          onTabChange={setActiveTabId}
          onToggle={() => setCollapsed((value) => !value)}
          tabs={TABS}
        />
      </LayerProvider>
    </ThemeProvider>
  )
}

afterEach(() => cleanup())

describe('CollapsiblePanel', () => {
  it('tells assistive technology whether the panel is expanded, and which panel it controls', () => {
    render(<Harness />)
    const toggle = screen.getByTestId('vision-response-panel-toggle')
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    expect(toggle.getAttribute('aria-controls')).toBe('vision-response-response-panel')
    expect(toggle.getAttribute('aria-label')).toBe('vision.panel.collapse')

    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(toggle.hasAttribute('aria-controls')).toBe(false)
    expect(toggle.getAttribute('aria-label')).toBe('vision.panel.expand')
    expect(screen.queryByTestId('response-content')).toBeNull()
  })

  it('keeps the same chevron in both states, so it can turn instead of being swapped', () => {
    render(<Harness />)
    const toggle = screen.getByTestId('vision-response-panel-toggle')
    const chevron = toggle.querySelector('svg')
    expect(chevron).not.toBeNull()
    fireEvent.click(toggle)
    expect(toggle.querySelector('svg')).toBe(chevron)
  })

  it('shows no tab as selected while collapsed, and keeps the open one as the tab stop', () => {
    render(<Harness />)
    const tab = (name: string) => screen.getByRole('tab', {name})
    expect(tab('Response').getAttribute('aria-selected')).toBe('true')
    expect(tab('Response').tabIndex).toBe(0)
    expect(tab('History').tabIndex).toBe(-1)

    fireEvent.click(screen.getByTestId('vision-response-panel-toggle'))
    for (const name of ['Response', 'History']) {
      expect(tab(name).getAttribute('aria-selected')).toBe('false')
      expect(tab(name).hasAttribute('data-selected')).toBe(false)
      // No panel to point at
      expect(tab(name).hasAttribute('aria-controls')).toBe(false)
    }
    expect(tab('Response').tabIndex).toBe(0)
    expect(tab('History').tabIndex).toBe(-1)
  })

  it('expands again on the picked tab when a tab is picked while collapsed', () => {
    render(<Harness />)
    fireEvent.click(screen.getByTestId('vision-response-panel-toggle'))
    fireEvent.click(screen.getByRole('tab', {name: 'History'}))
    const toggle = screen.getByTestId('vision-response-panel-toggle')
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByTestId('history-content')).toBeTruthy()
    expect(screen.getByRole('tab', {name: 'History'}).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('tab', {name: 'History'}).tabIndex).toBe(0)
  })
})

describe('CollapsiblePanel layout', () => {
  // The body's `display: flex` comes from the tab panel's own `display` prop, not from the
  // redesign's stylesheet: @sanity/ui's Box writes `.x:not([hidden]) {display: block}`, as
  // specific as a doubled class, and its runtime stylesheet follows the linked one in a built
  // studio, so a stylesheet rule tying with it lost there and the panel's scroll container, and
  // a graph filling it, got no height. jsdom resolves the runtime stylesheet and no CSS module,
  // so this asserts the prop's rule alone.
  it('stacks the toolbar over the scroll container through its own display rule', () => {
    render(<Harness />)
    const panel = screen.getByTestId('response-content').closest('[role="tabpanel"]')
    expect(panel).not.toBeNull()
    expect(getComputedStyle(panel!).display).toBe('flex')
  })
})
