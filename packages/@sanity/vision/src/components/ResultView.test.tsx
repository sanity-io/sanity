import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {act, cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import {type ReactNode} from 'react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {ResultView, type ResultViewCopy} from './ResultView'

const intentClick = vi.fn((event: {preventDefault: () => void}) => event.preventDefault())

vi.mock('sanity', () => ({useDataset: () => 'test'}))
vi.mock('sanity/router', () => ({
  IntentLink: (props: {children: ReactNode}) => <a data-testid="intent-link">{props.children}</a>,
  useIntentLink: ({intent, params}: {intent: string; params: {id: string}}) => ({
    href: `/intent/${intent}/id=${params.id}`,
    onClick: intentClick,
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
const data = [
  {
    _id: 'drafts.a',
    author: {name: 'Ada'},
    related: {_ref: 'b', _type: 'reference'},
    legacy_id: 'x',
    count: 3,
  },
]

function renderResult(copy?: ResultViewCopy, datasetName = 'test') {
  return render(
    <ThemeProvider theme={theme}>
      <LayerProvider>
        <ResultView copy={copy} data={data} datasetName={datasetName} />
      </LayerProvider>
    </ThemeProvider>,
  )
}

function copyOf(onCopy = vi.fn(() => Promise.resolve(true))): ResultViewCopy {
  return {label: 'Copy value', onCopy}
}

/** The line of a property: its key, its value or summary, and its actions */
function line(container: HTMLElement, key: string): HTMLElement {
  const found = [...container.querySelectorAll<HTMLElement>('.json-inspector__line')].find(
    (element) => element.querySelector('.json-inspector__key')?.textContent?.startsWith(`${key}:`),
  )
  if (!found) throw new Error(`No line for ${key}`)
  return found
}

const copyButton = (lineElement: HTMLElement) =>
  within(lineElement).getByRole('button', {name: 'Copy value'})
const editButton = (lineElement: HTMLElement) =>
  within(lineElement).queryByRole('link', {name: 'vision.result.edit-document'})
const shownIcon = (element: HTMLElement) =>
  element.querySelector('[data-sanity-icon]')?.getAttribute('data-sanity-icon')

describe('ResultView', () => {
  afterEach(() => cleanup())

  it('puts the Copy button right after a value, and copies that value', async () => {
    const onCopy = vi.fn(() => Promise.resolve(true))
    const {container} = renderResult(copyOf(onCopy))

    const name = line(container, 'name')
    const button = copyButton(name)
    // In the value, after its text, rather than at the line's end
    expect(button.closest('.json-inspector__value')?.textContent).toBe('Ada')
    expect(shownIcon(button)).toBe('copy')

    await act(async () => {
      fireEvent.click(button)
    })
    expect(onCopy).toHaveBeenLastCalledWith('Ada', '0.author.name')
    // The copy icon turns into a checkmark where the click happened
    expect(shownIcon(copyButton(name))).toBe('checkmark')

    await act(async () => {
      fireEvent.click(copyButton(line(container, 'count')))
    })
    expect(onCopy).toHaveBeenLastCalledWith(3, '0.count')
  })

  it('copies an object from its line without collapsing it', async () => {
    const onCopy = vi.fn(() => Promise.resolve(true))
    const {container} = renderResult(copyOf(onCopy))

    const author = line(container, 'author')
    const leaf = author.closest('[aria-expanded]')
    expect(leaf?.getAttribute('aria-expanded')).toBe('true')
    await act(async () => {
      fireEvent.click(copyButton(author))
    })
    expect(onCopy).toHaveBeenLastCalledWith({name: 'Ada'}, '0.author')
    expect(leaf?.getAttribute('aria-expanded')).toBe('true')
  })

  it('leaves the checkmark out when the copy failed', async () => {
    const {container} = renderResult(copyOf(vi.fn(() => Promise.resolve(false))))
    const name = line(container, 'name')
    await act(async () => {
      fireEvent.click(copyButton(name))
    })
    expect(shownIcon(copyButton(name))).toBe('copy')
  })

  it('gives the root no actions, as the result has its own Copy button', () => {
    const {container} = renderResult(copyOf())
    const root = container.querySelector<HTMLElement>('.json-inspector__leaf_root > label')
    expect(root).not.toBeNull()
    expect(within(root!).queryByTestId('result-row-actions')).toBeNull()
  })

  it('opens an _id or _ref document from an Edit button next to Copy', () => {
    const {container} = renderResult(copyOf())

    const id = line(container, '_id')
    const edit = editButton(id)
    expect(edit?.getAttribute('href')).toBe('/intent/edit/id=drafts.a')
    expect(shownIcon(edit!)).toBe('launch')
    // Copy, then Edit, in one group after the value
    const actions = within(id).getByTestId('result-row-actions')
    expect([...actions.querySelectorAll('button, a')]).toEqual([copyButton(id), edit])

    fireEvent.click(edit!)
    expect(intentClick).toHaveBeenCalledTimes(1)

    expect(editButton(line(container, '_ref'))?.getAttribute('href')).toBe('/intent/edit/id=b')
    // Only the `_id` and `_ref` properties themselves name documents
    expect(editButton(line(container, 'legacy_id'))).toBeNull()
    expect(editButton(line(container, 'name'))).toBeNull()
    expect(screen.queryByTestId('intent-link')).toBeNull()
  })

  it('has no Edit button for a result from another dataset', () => {
    const {container} = renderResult(copyOf(), 'other')
    expect(editButton(line(container, '_id'))).toBeNull()
    expect(copyButton(line(container, '_id'))).toBeTruthy()
  })

  it('shows a tooltip naming the button it is focused on', async () => {
    const {container} = renderResult(copyOf())
    const id = line(container, '_id')

    act(() => copyButton(id).focus())
    await waitFor(() => expect(tooltipText()).toBe('Copy value'))

    act(() => editButton(id)!.focus())
    await waitFor(() => expect(tooltipText()).toBe('vision.result.edit-document'))
  })

  it('has no actions unless asked for, and still links document IDs', () => {
    renderResult()
    expect(screen.queryAllByRole('button', {name: 'Copy value'})).toHaveLength(0)
    expect(screen.queryByTestId('result-row-actions')).toBeNull()
    expect(screen.getAllByTestId('intent-link').length).toBeGreaterThan(0)
  })
})

/** The text of the open tooltip; closed ones stay mounted, hidden */
function tooltipText(): string | undefined {
  const open = [...document.querySelectorAll<HTMLElement>('[data-ui="Tooltip"]')].filter(
    (tooltip) => !tooltip.closest('[style*="display: none"]'),
  )
  return open.length === 1 ? open[0].textContent?.trim() : undefined
}
