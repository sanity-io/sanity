import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {cleanup, fireEvent, render, screen, within} from '@testing-library/react'
import {type ReactNode} from 'react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {ResultView} from './ResultView'

vi.mock('sanity', () => ({useDataset: () => 'test'}))
vi.mock('sanity/router', () => ({
  IntentLink: (props: {children: ReactNode}) => <a data-testid="intent-link">{props.children}</a>,
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
const data = [{_id: 'a', author: {name: 'Ada'}}]

function renderResult(copy?: {label: string; onCopy: (value: unknown, keypath: string) => void}) {
  return render(
    <ThemeProvider theme={theme}>
      <ResultView copy={copy} data={data} datasetName="test" />
    </ThemeProvider>,
  )
}

/** The key label of a property, which holds its copy button */
function keyLabel(container: HTMLElement, key: string): HTMLElement {
  const label = [...container.querySelectorAll<HTMLElement>('.json-inspector__key')].find(
    (element) => element.textContent?.startsWith(`${key}:`),
  )
  if (!label) throw new Error(`No key ${key}`)
  return label
}

describe('ResultView', () => {
  afterEach(() => cleanup())

  it('copies the value of the property a button sits next to, leaving the tree as it is', () => {
    const onCopy = vi.fn()
    const {container} = renderResult({label: 'Copy value', onCopy})

    fireEvent.click(within(keyLabel(container, 'name')).getByRole('button', {name: 'Copy value'}))
    expect(onCopy).toHaveBeenLastCalledWith('Ada', '0.author.name')

    const authorLeaf = keyLabel(container, 'author').closest('[aria-expanded]')
    expect(authorLeaf?.getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(within(keyLabel(container, 'author')).getByRole('button', {name: 'Copy value'}))
    expect(onCopy).toHaveBeenLastCalledWith({name: 'Ada'}, '0.author')
    // The button sits in the line that toggles the node; copying does not collapse it
    expect(authorLeaf?.getAttribute('aria-expanded')).toBe('true')

    fireEvent.click(within(keyLabel(container, 'root')).getByRole('button', {name: 'Copy value'}))
    expect(onCopy).toHaveBeenLastCalledWith(data, '')
  })

  it('has no copy buttons unless asked for, and still links document IDs', () => {
    renderResult()
    expect(screen.queryAllByRole('button', {name: 'Copy value'})).toHaveLength(0)
    expect(screen.getAllByTestId('intent-link')).toHaveLength(1)
  })
})
