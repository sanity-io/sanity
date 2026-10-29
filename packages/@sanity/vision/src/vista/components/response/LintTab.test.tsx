import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {fireEvent, render, screen} from '@testing-library/react'
import {type ComponentProps} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {type QueryLintFinding} from '../../util/groqLint'
import {LintTab} from './LintTab'

vi.mock('sanity', () => ({
  defineLocaleResourceBundle: (bundle: unknown) => bundle,
  defineLocalesResources: (_namespace: string, resources: unknown) => resources,
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
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

const theme = buildTheme()

const findings: QueryLintFinding[] = [
  {
    from: 21,
    to: 29,
    line: 2,
    column: 6,
    severity: 'error',
    message: 'Avoid joins (`->`) inside filters.',
    source: 'groq-lint/join-in-filter',
  },
  {
    from: 40,
    to: 48,
    line: 3,
    column: 1,
    severity: 'warning',
    message: 'Fetching many results at once can be slow.',
    source: 'groq-lint/large-pages',
  },
]

function renderTab(props: Partial<ComponentProps<typeof LintTab>> = {}) {
  const onReveal = vi.fn()
  render(
    <ThemeProvider theme={theme}>
      <LayerProvider>
        <LintTab findings={findings} onReveal={onReveal} {...props} />
      </LayerProvider>
    </ThemeProvider>,
  )
  return {onReveal}
}

describe('LintTab', () => {
  it('explains itself while there is nothing to list', () => {
    renderTab({findings: []})
    expect(screen.getByText('vista.lint.empty')).toBeTruthy()
    expect(screen.queryByTestId('vista-lint-finding')).toBeNull()
  })

  it('lists each finding with its severity, position and rule, and reveals it on click', () => {
    const {onReveal} = renderTab()
    const rows = screen.getAllByTestId('vista-lint-finding')
    expect(rows).toHaveLength(2)

    expect(rows[0].textContent).toContain('vista.lint.severity.error')
    expect(rows[0].textContent).toContain('vista.lint.position:{"line":2,"column":6}')
    expect(rows[0].textContent).toContain('groq-lint/join-in-filter')
    // The backtick-quoted GROQ is set as code
    expect(rows[0].querySelector('code')?.textContent).toBe('->')
    expect(rows[1].textContent).toContain('vista.lint.severity.warning')

    fireEvent.click(rows[1])
    expect(onReveal).toHaveBeenCalledWith(findings[1])
  })
})
