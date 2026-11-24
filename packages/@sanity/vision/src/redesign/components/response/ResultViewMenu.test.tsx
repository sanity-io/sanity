import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import {useState} from 'react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {type ResultViewOption, ResultViewMenu} from './ResultViewMenu'

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

type View = 'json' | 'tree' | 'documents'

const VIEWS: ResultViewOption<View>[] = [
  {id: 'json', label: 'JSON'},
  {id: 'tree', label: 'Tree'},
  {id: 'documents', label: 'Documents'},
]

function Harness({onChange}: {onChange: (view: View) => void}) {
  const [view, setView] = useState<View>('json')
  return (
    <ThemeProvider theme={theme}>
      <LayerProvider>
        <ResultViewMenu
          controls="result"
          id="result-view"
          onChange={(next) => {
            onChange(next)
            setView(next)
          }}
          value={view}
          views={VIEWS}
        />
        <div id="result" />
      </LayerProvider>
    </ThemeProvider>
  )
}

async function openMenu() {
  fireEvent.click(screen.getByTestId('vision-result-view-button'))
  let menu: HTMLElement | undefined
  await waitFor(() => {
    menu = screen
      .getAllByTestId('vision-result-view-menu')
      .find((candidate) => !candidate.closest('[style*="display: none"]'))
    expect(menu).toBeTruthy()
  })
  return menu as HTMLElement
}

describe('ResultViewMenu', () => {
  afterEach(cleanup)

  it('names the shown view, and lists every view it is given, the shown one checked', async () => {
    render(<Harness onChange={vi.fn()} />)
    const button = screen.getByTestId('vision-result-view-button')
    expect(button.textContent).toBe('JSON')
    expect(button.getAttribute('aria-controls')).toBe('result')

    const items = within(await openMenu()).getAllByRole('menuitemradio', {hidden: true})
    expect(items.map((item) => item.textContent)).toEqual(['JSON', 'Tree', 'Documents'])
    expect(items.map((item) => item.getAttribute('aria-checked'))).toEqual([
      'true',
      'false',
      'false',
    ])
  })

  it('switches to the view picked from the menu', async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    fireEvent.click(within(await openMenu()).getByTestId('vision-result-view-documents'))
    expect(onChange).toHaveBeenCalledWith('documents')
    expect(screen.getByTestId('vision-result-view-button').textContent).toBe('Documents')
  })
})
