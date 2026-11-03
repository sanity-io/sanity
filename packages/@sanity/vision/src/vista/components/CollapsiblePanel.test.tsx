import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {cleanup, fireEvent, render, screen} from '@testing-library/react'
import {useState} from 'react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {CollapsiblePanel, type CollapsiblePanelTab} from './CollapsiblePanel'

vi.mock('sanity', () => ({
  defineLocaleResourceBundle: (bundle: unknown) => bundle,
  defineLocalesResources: (_namespace: string, resources: unknown) => resources,
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
          id="vista-response"
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
    const toggle = screen.getByTestId('vista-response-panel-toggle')
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    expect(toggle.getAttribute('aria-controls')).toBe('vista-response-response-panel')
    expect(toggle.getAttribute('aria-label')).toBe('vista.panel.collapse')

    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(toggle.hasAttribute('aria-controls')).toBe(false)
    expect(toggle.getAttribute('aria-label')).toBe('vista.panel.expand')
    expect(screen.queryByTestId('response-content')).toBeNull()
  })

  it('keeps the same chevron in both states, so it can turn instead of being swapped', () => {
    render(<Harness />)
    const toggle = screen.getByTestId('vista-response-panel-toggle')
    const chevron = toggle.querySelector('svg')
    expect(chevron).not.toBeNull()
    fireEvent.click(toggle)
    expect(toggle.querySelector('svg')).toBe(chevron)
  })

  it('expands again on the picked tab when a tab is picked while collapsed', () => {
    render(<Harness />)
    fireEvent.click(screen.getByTestId('vista-response-panel-toggle'))
    fireEvent.click(screen.getByRole('tab', {name: 'History'}))
    const toggle = screen.getByTestId('vista-response-panel-toggle')
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByTestId('history-content')).toBeTruthy()
  })
})
