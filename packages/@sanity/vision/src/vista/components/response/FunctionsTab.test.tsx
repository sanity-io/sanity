import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {cleanup, fireEvent, render, screen, within} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {type VistaSavedFunction} from '../../store/types'
import {parseGroq, readQueryFunctions} from '../../util/groqFunctions'
import {FunctionsTab} from './FunctionsTab'

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

const QUERY = `fn ex::author($ref) = $ref->{name};
fn ex::tags($tags) = $tags[]->{title};
fn ex::slug($p) = $p{"slug": slug.current};

*[_type == "post"]{"author": ex::author(author), "tags": ex::tags(tags)}`

function renderTab(query: string, library: VistaSavedFunction[]) {
  const handlers = {onSave: vi.fn(), onRemove: vi.fn(), onEdit: vi.fn(), onReveal: vi.fn()}
  const declarations = readQueryFunctions(parseGroq(query), query).declarations
  render(
    <ThemeProvider theme={theme}>
      <LayerProvider>
        <FunctionsTab declarations={declarations} library={library} query={query} {...handlers} />
      </LayerProvider>
    </ThemeProvider>,
  )
  return {...handlers, declarations}
}

describe('FunctionsTab', () => {
  afterEach(() => cleanup())

  it('explains how to declare functions and what the library is for, while both are empty', () => {
    renderTab('*[_type == "post"]', [])
    expect(screen.getByText(/^vista\.functions\.query\.empty:/)).toBeTruthy()
    expect(screen.getByText('vista.functions.library.empty')).toBeTruthy()
    expect(screen.queryByTestId('vista-declared-function')).toBeNull()
  })

  it('saves a declared function to the library, or updates the one there', () => {
    const library = [
      // The same function, laid out by Prettify
      {id: 'ex::author', declaration: 'fn ex::author($ref) = $ref-> { name }'},
      {id: 'ex::tags', declaration: 'fn ex::tags($tags) = $tags[]->{title, slug}'},
    ]
    const {onSave, onReveal, declarations} = renderTab(QUERY, library)
    const [author, tags, slug] = screen.getAllByTestId('vista-declared-function')

    expect(within(author).getByTestId('vista-function-saved')).toBeTruthy()
    expect(within(tags).getByTestId('vista-function-save').textContent).toBe(
      'vista.functions.update',
    )
    fireEvent.click(within(slug).getByTestId('vista-function-save'))
    expect(onSave).toHaveBeenCalledWith({
      id: 'ex::slug',
      declaration: 'fn ex::slug($p) = $p{"slug": slug.current}',
    })

    expect(slug.textContent).toContain('ex::slug($p)')
    expect(slug.textContent).toContain('$p{"slug": slug.current}')
    fireEvent.click(within(slug).getByRole('button', {name: /vista\.functions\.reveal/}))
    expect(onReveal).toHaveBeenCalledWith(declarations[2].range)
  })

  it('adds library functions to the query, puts back a changed one, and removes them', () => {
    const library = [
      {id: 'ex::bio', declaration: 'fn ex::bio($p) = $p{bio}'},
      {id: 'ex::tags', declaration: 'fn ex::tags($tags) = $tags[]->{title, slug}'},
      {id: 'ex::author', declaration: 'fn ex::author($ref) = $ref->{name}'},
    ]
    const {onEdit, onRemove, declarations} = renderTab(QUERY, library)
    const [bio, tags, author] = screen.getAllByTestId('vista-library-function')

    fireEvent.click(within(bio).getByTestId('vista-function-add'))
    expect(onEdit).toHaveBeenLastCalledWith({
      from: QUERY.indexOf('\n\n'),
      to: QUERY.indexOf('\n\n'),
      insert: '\nfn ex::bio($p) = $p{bio};',
    })
    fireEvent.click(within(tags).getByTestId('vista-function-replace'))
    expect(onEdit).toHaveBeenLastCalledWith({
      ...declarations[1].range,
      insert: 'fn ex::tags($tags) = $tags[]->{title, slug}',
    })
    expect(within(author).getByTestId('vista-function-declared')).toBeTruthy()

    fireEvent.click(within(bio).getByTestId('vista-function-remove'))
    expect(onRemove).toHaveBeenCalledWith('ex::bio')
  })
})
