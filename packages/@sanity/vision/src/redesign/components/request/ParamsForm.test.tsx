import {Schema} from '@sanity/schema'
import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {
  act,
  cleanup,
  createEvent,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import JSON5 from 'json5'
import {type ReactNode, useState} from 'react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {type Params} from '../../../util/parseParams'
import * as fieldGrid from '../fieldGrid.module.css'
import {ObjectParamInput} from './ObjectParamInput'
import {ParamsForm} from './ParamsForm'

const {createSearch, useValuePreview, searchClient} = vi.hoisted(() => {
  const client = {
    config: () => ({perspective: 'published' as const}),
    withConfig() {
      return this
    },
    observable: {fetch: vi.fn()},
  }
  return {
    searchClient: client,
    createSearch: vi.fn(),
    useValuePreview: vi.fn((_props: {value: {_id: string}}) => ({
      isLoading: false,
      value: {title: 'Ash'},
    })),
  }
})

vi.mock('sanity/_dangerously_use_private_internals_that_do_not_follow_semver', () => ({
  DEFAULT_STUDIO_CLIENT_OPTIONS: {apiVersion: '2025-02-19'},
  DatePicker: () => null,
  getCalendarLabels: () => ({}),
  createSearch: (types: {name: string}[], client: unknown, options: unknown) =>
    createSearch(types, client, options),
  useValuePreview: (props: {value: {_id: string}}) => useValuePreview(props),
  useSchema: () => schema,
  isDraftId: (id: string) => id.startsWith('drafts.'),
  getVersionFromId: (id: string) => {
    const match = /^versions\.([^.]+)\./.exec(id)
    return match ? match[1] : undefined
  },
  SanityDefaultPreview: ({title, subtitle}: {title?: string; subtitle?: string}) => (
    <span>
      {title}
      {subtitle ? ` ${subtitle}` : ''}
    </span>
  ),
}))

const schema = Schema.compile({
  name: 'test',
  types: [
    {
      name: 'post',
      type: 'document',
      fields: [
        {name: 'title', type: 'string'},
        {name: 'status', type: 'string', options: {list: ['draft', 'published']}},
        {name: 'featured', type: 'boolean'},
        {name: 'rating', type: 'number'},
        {name: 'tags', type: 'array', of: [{type: 'string'}]},
      ],
    },
    {name: 'author', type: 'document', fields: [{name: 'name', type: 'string'}]},
  ],
})

vi.mock('sanity', () => ({
  defineLocalesResources: (_namespace: string, resources: unknown) => resources,
  useClient: () => searchClient,
}))
vi.mock('sanity/i18n', () => ({
  defineLocaleResourceBundle: (bundle: unknown) => bundle,
  InlineCode: ({children}: {children?: ReactNode}) => <code>{children}</code>,
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

/** The options of the open autocomplete, which jsdom reports as clipped and so hidden */
function optionTexts() {
  return screen
    .queryAllByRole('listbox', {hidden: true})
    .filter((listbox) => !(listbox instanceof HTMLDataListElement))
    .flatMap((listbox) => within(listbox).queryAllByRole('option', {hidden: true}))
    .map((option) => option.textContent)
}

function toParams(raw: string): Params {
  try {
    const parsed: unknown = JSON5.parse(raw)
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? {raw, parsed: parsed as Record<string, unknown>, valid: true, error: undefined}
      : {raw, parsed: undefined, valid: false, error: 'not an object'}
  } catch (error) {
    return {raw, parsed: undefined, valid: false, error: String(error)}
  }
}

// Holds the params text like the tab does, so typing round-trips through the parsed params
function Harness(props: {query: string; initial: string; onSubmit: () => void}) {
  const {query, initial, onSubmit} = props
  const [raw, setRaw] = useState(initial)
  return (
    <>
      <ParamsForm onChange={setRaw} onSubmit={onSubmit} params={toParams(raw)} query={query} />
      <output data-testid="raw">{raw}</output>
    </>
  )
}

function renderForm(query: string, initial = '{}') {
  const onSubmit = vi.fn()
  render(
    <ThemeProvider theme={theme}>
      <LayerProvider>
        <Harness initial={initial} onSubmit={onSubmit} query={query} />
      </LayerProvider>
    </ThemeProvider>,
  )
  return {
    onSubmit,
    params: () => JSON.parse(screen.getByTestId('raw').textContent || '{}') as unknown,
    field: (name: string) => screen.getByTestId(`vision-params-form-${name}`),
    input: (name: string) =>
      within(screen.getByTestId(`vision-params-form-${name}`)).getByRole('textbox'),
  }
}

describe('ParamsForm', () => {
  afterEach(() => cleanup())

  beforeEach(() => {
    createSearch.mockReset()
    useValuePreview.mockClear()
    createSearch.mockImplementation((types: {name: string}[]) => (query: string) => ({
      subscribe(observer: {next?: (value: unknown) => void}) {
        const typeName = types[0]?.name ?? 'author'
        observer.next?.({
          hits: [{hit: {_id: `${typeName}-1`, _type: typeName}, score: query.length}],
        })
        return {unsubscribe: () => undefined}
      },
    }))
  })

  it('has a field per param, typed from the schema and the query', () => {
    const {field} = renderForm(
      '*[_type == $type && status == $status && featured == $featured && _id != $id][0...$limit]{"extra": $extra}',
    )
    const types = ['type', 'status', 'featured', 'id', 'limit', 'extra'].map(
      (name) => screen.getByTestId(`vision-params-form-${name}-type`).textContent,
    )
    expect(types).toEqual(
      [
        'vision.params-form.type.document-type',
        'vision.params-form.type.options:{"type":"vision.params-form.type.string","count":2}',
        'vision.params-form.type.boolean',
        'vision.params-form.type.document-id',
        'vision.params-form.type.integer',
        'vision.params-form.type.any',
      ].map((type) => `vision.params-form.type-detail:${JSON.stringify({type})}`),
    )
    // The document types are listed by an autocomplete, the options of a string by its suggestions
    fireEvent.focus(within(field('type')).getByRole('combobox'))
    fireEvent.click(within(field('type')).getByLabelText('Open'))
    expect(optionTexts()).toEqual(['author', 'post'])
    const statusInput = within(field('status')).getByRole('combobox')
    const list = document.getElementById(statusInput.getAttribute('list') || '')
    expect([...(list?.querySelectorAll('option') ?? [])].map((option) => option.value)).toEqual([
      'draft',
      'published',
    ])
    // The details live in the info icon's tooltip, the missing value is flagged like a required field
    expect(
      within(screen.getByTestId('vision-params-form-type-details-content')).getByText(
        '_type == $type',
      ),
    ).toBeTruthy()
    expect(within(field('type')).getByTestId('vision-params-form-type-required')).toBeTruthy()
    expect(
      (within(field('type')).getByRole('combobox') as HTMLInputElement).validationMessage,
    ).toBe('vision.params-form.required')
  })

  it('stops flagging a param once it has a value', () => {
    const {field} = renderForm('*[_type == "post" && title == $title]')
    expect(within(field('title')).getByTestId('vision-params-form-title-required')).toBeTruthy()
    fireEvent.change(within(field('title')).getByRole('textbox'), {target: {value: 'x'}})
    expect(within(field('title')).queryByTestId('vision-params-form-title-required')).toBeNull()
    expect((within(field('title')).getByRole('textbox') as HTMLInputElement).validity.valid).toBe(
      true,
    )
  })

  it('writes what is typed into the params, and removes a param that is cleared', () => {
    const {field, params} = renderForm('*[_type == $type && title == $title]', '{"title": "x"}')
    const typeInput = within(field('type')).getByRole('combobox')
    fireEvent.change(typeInput, {target: {value: 'post'}})
    expect(params()).toEqual({title: 'x', type: 'post'})
    expect(within(field('type')).queryByTestId('vision-params-form-type-problem')).toBeNull()

    // Values the schema does not know are still sent, for testing
    fireEvent.change(typeInput, {target: {value: 'nope'}})
    expect(params()).toEqual({title: 'x', type: 'nope'})
    expect(within(field('type')).getByTestId('vision-params-form-type-problem').textContent).toBe(
      'vision.params-form.invalid.document-type',
    )

    fireEvent.change(typeInput, {target: {value: ''}})
    expect(params()).toEqual({title: 'x'})
  })

  it('narrows the document types to what is typed, and picks one from the list', async () => {
    const {field, params} = renderForm('*[_type == $type]')
    const typeInput = within(field('type')).getByRole('combobox')
    fireEvent.focus(typeInput)
    fireEvent.change(typeInput, {target: {value: 'AU'}})
    expect(optionTexts()).toEqual(['author'])
    expect(params()).toEqual({type: 'AU'})

    fireEvent.keyDown(typeInput, {key: 'ArrowDown'})
    const [listbox] = screen
      .getAllByRole('listbox', {hidden: true})
      .filter((element) => !(element instanceof HTMLDataListElement))
    fireEvent.keyDown(within(listbox).getByRole('option', {hidden: true}), {key: 'Enter'})
    await waitFor(() => expect(params()).toEqual({type: 'author'}))
    expect(typeInput).toHaveProperty('value', 'author')
    expect(typeInput.getAttribute('aria-expanded')).toBe('false')
  })

  it('lists every document type when a filled value opens the list', () => {
    const {field} = renderForm('*[_type == $type]', '{"type": "post"}')
    const typeInput = within(field('type')).getByRole('combobox')
    fireEvent.focus(typeInput)
    fireEvent.click(within(field('type')).getByLabelText('Open'))
    expect(optionTexts()).toEqual(['author', 'post'])
    expect(typeInput).toHaveProperty('value', 'post')
  })

  it('searches the type the query constrains and fills the picked document id', async () => {
    const {field, params} = renderForm('*[_type == "author" && _id == $authorId]')
    const input = within(field('authorId')).getByRole('combobox')
    fireEvent.change(input, {target: {value: 'ash'}})
    expect(params()).toEqual({authorId: 'ash'})
    await waitFor(() => expect(createSearch).toHaveBeenCalled())
    const types = createSearch.mock.calls.at(-1)?.[0] as {name: string}[]
    expect(types.map((type) => type.name)).toEqual(['author'])
    expect(createSearch.mock.calls.at(-1)?.[2]).toEqual({tag: 'vision.document-id'})
    fireEvent.click(within(field('authorId')).getByLabelText('Open'))
    await waitFor(() => expect(optionTexts()).toEqual(['Ash author-1']))

    fireEvent.keyDown(input, {key: 'ArrowDown'})
    const [listbox] = screen
      .getAllByRole('listbox', {hidden: true})
      .filter((element) => !(element instanceof HTMLDataListElement))
    fireEvent.keyDown(within(listbox).getByRole('option', {hidden: true}), {key: 'Enter'})
    await waitFor(() => expect(params()).toEqual({authorId: 'author-1'}))
  })

  it('searches every document type when the query does not name one', async () => {
    const {field} = renderForm('*[references($id)]')
    fireEvent.change(within(field('id')).getByRole('combobox'), {target: {value: 'a'}})
    await waitFor(() => expect(createSearch).toHaveBeenCalled())
    const types = createSearch.mock.calls.at(-1)?.[0] as {name: string}[]
    expect(types.map((type) => type.name)).toEqual(['author', 'post'])
  })

  it('drops a document search that a newer query has replaced', async () => {
    const held: {next?: (value: unknown) => void}[] = []
    createSearch.mockImplementation(() => () => ({
      subscribe(observer: {next?: (value: unknown) => void}) {
        held.push(observer)
        return {unsubscribe: () => undefined}
      },
    }))
    const {field} = renderForm('*[_type == "author" && _id == $authorId]')
    const input = within(field('authorId')).getByRole('combobox')
    fireEvent.change(input, {target: {value: 'a'}})
    await waitFor(() => expect(held).toHaveLength(1))
    fireEvent.change(input, {target: {value: 'ad'}})
    await waitFor(() => expect(held).toHaveLength(2))
    act(() => {
      held[1]?.next?.({hits: [{hit: {_id: 'author-2', _type: 'author'}}]})
    })
    fireEvent.click(within(field('authorId')).getByLabelText('Open'))
    await waitFor(() => expect(optionTexts()).toEqual(['Ash author-2']))
    act(() => {
      held[0]?.next?.({hits: [{hit: {_id: 'author-1', _type: 'author'}}]})
    })
    expect(optionTexts()).toEqual(['Ash author-2'])
  })

  it('keeps a typed document id, null and a cleared field', () => {
    const {field, params} = renderForm('*[!defined($id) || _id == $id]')
    const input = within(field('id')).getByRole('combobox')
    fireEvent.change(input, {target: {value: 'not-a-hit'}})
    expect(params()).toEqual({id: 'not-a-hit'})

    fireEvent.click(within(field('id')).getByTestId('vision-params-form-id-clear'))
    expect(params()).toEqual({id: null})
    expect(input).toHaveProperty('value', '')

    fireEvent.change(input, {target: {value: 'still-text'}})
    expect(params()).toEqual({id: 'still-text'})
    // The field's own clear sends an empty string, which removes the param
    fireEvent.change(input, {target: {value: ''}})
    expect(params()).toEqual({})
  })

  it('takes numbers in a number input and sends them as JSON numbers', () => {
    const {field, params} = renderForm('*[_type == "post" && rating > $rating][0...$limit]')
    const rating = within(field('rating')).getByRole('spinbutton')
    expect(rating).toHaveProperty('type', 'number')
    // Any number, like a Studio number field without rules
    expect(rating.getAttribute('step')).toBe('any')
    expect(rating.getAttribute('min')).toBeNull()
    fireEvent.change(rating, {target: {value: '-2.5'}})
    expect(params()).toEqual({rating: -2.5})

    // A slice bound steps in whole numbers, and a fraction is still sent, with its note
    const limit = within(field('limit')).getByRole('spinbutton')
    expect(limit.getAttribute('step')).toBe('1')
    fireEvent.change(limit, {target: {value: '1.5'}})
    expect(params()).toEqual({rating: -2.5, limit: 1.5})
    expect(within(field('limit')).getByTestId('vision-params-form-limit-problem').textContent).toBe(
      'vision.params-form.invalid.integer',
    )
    fireEvent.change(limit, {target: {value: ''}})
    expect(params()).toEqual({rating: -2.5})
  })

  it('bounds counts and rounding places to whole numbers from 0', () => {
    const {field, params} = renderForm(
      '*[_type == "post" && count(tags) >= $minimum]{"r": round(rating, $precision)}',
    )
    for (const name of ['minimum', 'precision']) {
      const input = within(field(name)).getByRole('spinbutton')
      expect([input.getAttribute('min'), input.getAttribute('step')]).toEqual(['0', '1'])
      expect(input).toHaveProperty('inputMode', 'numeric')
      expect(screen.getByTestId(`vision-params-form-${name}-type`).textContent).toBe(
        `vision.params-form.type-detail:${JSON.stringify({
          type: `vision.params-form.type.min:${JSON.stringify({type: 'vision.params-form.type.integer', min: 0})}`,
        })}`,
      )
    }
    fireEvent.change(within(field('minimum')).getByRole('spinbutton'), {target: {value: '-1'}})
    expect(params()).toEqual({minimum: -1})
    expect(
      within(field('minimum')).getByTestId('vision-params-form-minimum-problem').textContent,
    ).toBe('vision.params-form.invalid.min:{"min":0}')
  })

  it('shows a number param that holds something else as text, with its note', () => {
    const {field, input} = renderForm('*[_type == "post"][0...$limit]', '{"limit": "ten"}')
    expect(input('limit')).toHaveProperty('value', 'ten')
    expect(within(field('limit')).getByTestId('vision-params-form-limit-problem').textContent).toBe(
      'vision.params-form.invalid.number',
    )
  })

  it('sends what is typed into a text field as text, "null" included', () => {
    const {field, input, params} = renderForm('*[_type == "post" && title == $title]')
    fireEvent.change(input('title'), {target: {value: 'null'}})
    expect(params()).toEqual({title: 'null'})
    expect(input('title')).toHaveProperty('value', 'null')
    expect(within(field('title')).queryByTestId('vision-params-form-title-problem')).toBeNull()
    // Only params the query treats as optional can be set to null
    expect(within(field('title')).queryByTestId('vision-params-form-title-clear')).toBeNull()
  })

  it('sets a param the query treats as optional to null, and back to text when typed', () => {
    const {field, input, params} = renderForm(
      '*[_type == "post" && (!defined($title) || title == $title)]',
      '{"title": "null"}',
    )
    const clear = within(field('title')).getByTestId('vision-params-form-title-clear')
    expect(clear.getAttribute('aria-label')).toBe('vision.params-form.clear:{"name":"title"}')
    fireEvent.click(clear)
    expect(params()).toEqual({title: null})
    // Null is the placeholder, not text, and is not flagged
    expect(input('title')).toHaveProperty('value', '')
    expect(input('title')).toHaveProperty('placeholder', 'vision.params-form.null')
    expect(within(field('title')).queryByTestId('vision-params-form-title-problem')).toBeNull()
    expect(within(field('title')).queryByTestId('vision-params-form-title-required')).toBeNull()
    expect(clear).toHaveProperty('disabled', true)

    fireEvent.change(input('title'), {target: {value: 'null'}})
    expect(params()).toEqual({title: 'null'})
    expect(input('title')).toHaveProperty('value', 'null')
    expect(clear).toHaveProperty('disabled', false)
  })

  it('offers the null control for every way a query makes a param optional', () => {
    const {field} = renderForm(
      '*[_type == "post" && ($a == null || title == $a) && (!$b || title == $b) && title == coalesce($c, title) && title == $d]',
    )
    for (const name of ['a', 'b', 'c']) {
      expect(within(field(name)).getByTestId(`vision-params-form-${name}-clear`)).toBeTruthy()
    }
    expect(within(field('d')).queryByTestId('vision-params-form-d-clear')).toBeNull()
  })

  it('shows null as the placeholder of an untyped optional param too', () => {
    const {input} = renderForm('*[defined($g)]', '{"g": null}')
    expect(input('g')).toHaveProperty('value', '')
    expect(input('g')).toHaveProperty('placeholder', 'vision.params-form.null')
  })

  it('forwards focus and blur from a number input and a switch to the form', () => {
    const onFocus = vi.fn()
    const onBlur = vi.fn()
    const {field} = renderForm('*[_type == "post" && rating > $rating && featured == $featured]')
    const form = screen.getByTestId('vision-params-form')
    form.addEventListener('focusin', onFocus)
    form.addEventListener('focusout', onBlur)
    for (const input of [
      within(field('rating')).getByRole('spinbutton'),
      within(field('featured')).getByRole('checkbox'),
    ]) {
      input.focus()
      expect(document.activeElement).toBe(input)
      input.blur()
    }
    expect(onFocus).toHaveBeenCalledTimes(2)
    expect(onBlur).toHaveBeenCalledTimes(2)
  })

  it('toggles a boolean with a switch, not set until it is switched', () => {
    const {field, params} = renderForm('*[_type == "post" && featured == $featured]')
    const toggle = within(field('featured')).getByRole('checkbox') as HTMLInputElement
    expect(toggle.indeterminate).toBe(true)
    expect(within(field('featured')).getByText('vision.params-form.not-set')).toBeTruthy()
    // The field label points at the switch
    expect(within(field('featured')).getByLabelText('$featured')).toBe(toggle)

    fireEvent.click(toggle)
    expect(params()).toEqual({featured: true})
    expect(toggle.indeterminate).toBe(false)
    expect(toggle.checked).toBe(true)
    fireEvent.click(toggle)
    expect(params()).toEqual({featured: false})
    expect(toggle.checked).toBe(false)
    expect(within(field('featured')).getByText('false')).toBeTruthy()
  })

  it('switches a boolean that holds something else to a boolean, with a note until then', () => {
    const {field, params} = renderForm(
      '*[_type == "post" && $includeSummary]',
      '{"includeSummary": "yes"}',
    )
    const toggle = within(field('includeSummary')).getByRole('checkbox') as HTMLInputElement
    expect(toggle.indeterminate).toBe(true)
    expect(
      within(field('includeSummary')).getByTestId('vision-params-form-includeSummary-problem'),
    ).toBeTruthy()
    fireEvent.click(toggle)
    expect(params()).toEqual({includeSummary: true})
  })

  it('edits number list items in number inputs', () => {
    const {field, params} = renderForm('*[_type == "post" && rating in $ratings]')
    fireEvent.click(screen.getByTestId('vision-params-form-ratings-add'))
    expect(params()).toEqual({ratings: [0]})
    fireEvent.change(within(field('ratings')).getByRole('spinbutton'), {target: {value: '4'}})
    expect(params()).toEqual({ratings: [4]})
  })

  it('offers any JSON for an untyped param next to a boolean', () => {
    const {field, input, params} = renderForm(
      '*[_type == "post" && featured == $featured]{"extra": $extra}',
    )
    fireEvent.click(within(field('featured')).getByRole('checkbox'))
    fireEvent.click(within(field('featured')).getByRole('checkbox'))
    expect(params()).toEqual({featured: false})

    fireEvent.change(input('extra'), {target: {value: '{a: [1, 2]}'}})
    expect(params()).toEqual({featured: false, extra: {a: [1, 2]}})
    expect(input('extra')).toHaveProperty('value', '{a: [1, 2]}')
    fireEvent.change(input('extra'), {target: {value: 'plain text'}})
    expect(params()).toEqual({featured: false, extra: 'plain text'})
    // Typed text is never null, even where JSON is parsed
    fireEvent.change(input('extra'), {target: {value: 'null'}})
    expect(params()).toEqual({featured: false, extra: 'null'})
    expect(input('extra')).toHaveProperty('value', 'null')
  })

  it('edits a list param item by item', () => {
    const {field, params} = renderForm('*[_type in $types]')
    fireEvent.click(screen.getByTestId('vision-params-form-types-add'))
    fireEvent.click(screen.getByTestId('vision-params-form-types-add'))
    expect(params()).toEqual({types: ['', '']})

    const items = within(field('types')).getAllByRole('combobox')
    fireEvent.change(items[0], {target: {value: 'post'}})
    fireEvent.change(items[1], {target: {value: 'author'}})
    expect(params()).toEqual({types: ['post', 'author']})

    fireEvent.click(within(field('types')).getAllByLabelText('vision.params-form.remove-item')[0])
    expect(params()).toEqual({types: ['author']})
  })

  it('shows only the first 100 items of a huge list param', () => {
    const ids = Array.from({length: 250}, (_, index) => `id-${index}`)
    const {field} = renderForm('*[_id in $ids]', JSON.stringify({ids}))
    expect(within(field('ids')).getAllByRole('combobox')).toHaveLength(100)
    expect(screen.getByTestId('vision-params-form-ids-truncated').textContent).toContain('250')
    expect(screen.getByTestId('vision-params-form-ids-add')).toHaveProperty('disabled', true)
  })

  it('sends the items of a boolean list as booleans', () => {
    const {field, params} = renderForm('*[_type == "post" && featured in $flags]')
    fireEvent.click(screen.getByTestId('vision-params-form-flags-add'))
    fireEvent.click(screen.getByTestId('vision-params-form-flags-add'))
    const items = within(field('flags')).getAllByRole('textbox')
    fireEvent.change(items[0], {target: {value: 'true'}})
    fireEvent.change(items[1], {target: {value: 'false'}})
    expect(params()).toEqual({flags: [true, false]})
    // Other text is still sent, as text, with its note
    fireEvent.change(items[1], {target: {value: 'maybe'}})
    expect(params()).toEqual({flags: [true, 'maybe']})
    expect(within(field('flags')).getByTestId('vision-params-form-flags-problem')).toBeTruthy()
  })

  it('lists params the query does not use, to remove them', () => {
    const {params} = renderForm('*[_type == $type]', '{"type": "post", "stale": 1}')
    const unused = screen.getByTestId('vision-params-form-unused')
    expect(unused.textContent).toContain('$stale')
    fireEvent.click(within(unused).getByText('vision.params-form.remove'))
    expect(params()).toEqual({type: 'post'})
  })

  it('removes every param the query does not use at once', () => {
    const {params} = renderForm('*[_type == $type]', '{"type": "post", "a": 1, "b": [2]}')
    fireEvent.click(screen.getByTestId('vision-params-form-remove-all'))
    expect(params()).toEqual({type: 'post'})
    expect(screen.queryByTestId('vision-params-form-unused')).toBeNull()
  })

  it('does not edit params that are not valid JSON', () => {
    renderForm('*[_type == $type]', '{"type": ')
    expect(screen.getByText('vision.params-form.invalid-json')).toBeTruthy()
    expect(screen.getByTestId('vision-params-form-type').querySelector('input')).toHaveProperty(
      'disabled',
      true,
    )
  })

  it('submits on Enter in any field, keeping Enter for compositions, buttons and the shortcut', () => {
    const {field, input, onSubmit} = renderForm(
      '*[_type == "post" && title match $title && featured == $featured && _type in $types][0...$limit]',
    )
    fireEvent.click(screen.getByTestId('vision-params-form-types-add'))
    const fields = [
      input('title'),
      within(field('limit')).getByRole('spinbutton'),
      within(field('featured')).getByRole('checkbox'),
      within(field('types')).getByRole('combobox'),
    ]
    for (const [index, target] of fields.entries()) {
      const enter = createEvent.keyDown(target, {key: 'Enter', keyCode: 13})
      fireEvent(target, enter)
      // No native form submission or toggle on top of the fetch
      expect(enter.defaultPrevented).toBe(true)
      expect(onSubmit).toHaveBeenCalledTimes(index + 1)
    }
    onSubmit.mockClear()

    fireEvent.keyDown(input('title'), {key: 'Enter', isComposing: true})
    fireEvent.keyDown(input('title'), {key: 'Enter', keyCode: 229})
    fireEvent.keyDown(input('title'), {key: 'Enter', ctrlKey: true})
    fireEvent.keyDown(input('title'), {key: 'Enter', metaKey: true})
    fireEvent.keyDown(input('title'), {key: 'a'})
    fireEvent.keyDown(screen.getByTestId('vision-params-form-types-add'), {key: 'Enter'})
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('renders a semantic similarity query as a textarea that spans two columns', () => {
    const {field, input, onSubmit, params} = renderForm(
      '*[_type == "post" && title match $title] | score(text::semanticSimilarity($search))',
      '{"search": "a short query", "title": "hello"}',
    )
    const search = input('search')
    const title = input('title')
    expect(search.tagName).toBe('TEXTAREA')
    expect(title.tagName).toBe('INPUT')
    expect(field('search').classList.contains(fieldGrid.wide)).toBe(true)
    expect(field('title').classList.contains(fieldGrid.wide)).toBe(false)
    expect(search.classList.contains(fieldGrid.queryText)).toBe(true)
    expect(screen.getByTestId('vision-params-form-search-type').textContent).toContain(
      'vision.params-form.type.string',
    )

    fireEvent.change(search, {target: {value: 'a yellow mouse\nwith a lightning tail'}})
    expect(params()).toEqual({search: 'a yellow mouse\nwith a lightning tail', title: 'hello'})

    // Plain Enter is a newline, the same as any multiline field. Fetch stays on mod+Enter.
    const enter = createEvent.keyDown(search, {key: 'Enter', keyCode: 13})
    fireEvent(search, enter)
    expect(enter.defaultPrevented).toBe(false)
    expect(onSubmit).not.toHaveBeenCalled()
    fireEvent.keyDown(search, {key: 'Enter', ctrlKey: true, keyCode: 13})
    fireEvent.keyDown(search, {key: 'Enter', metaKey: true, keyCode: 13})
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('explains a query without params', () => {
    renderForm('*[_type == "post"]')
    expect(screen.getByText('vision.params-form.empty')).toBeTruthy()
  })
  it('edits an object param key by key in a dialog, from a one-line preview', () => {
    const {field, params} = renderForm(
      '*[_type == "post" && count(tags) >= $countRange.min && count(tags) <= $countRange.max]',
      '{"countRange": {"min": 0, "max": 10000}}',
    )
    expect(screen.getByTestId('vision-params-form-countRange-type').textContent).toBe(
      `vision.params-form.type-detail:${JSON.stringify({type: 'vision.params-form.type.object'})}`,
    )
    expect(screen.getByTestId('vision-params-form-countRange-object-preview').textContent).toBe(
      'min: 0, max: 10000',
    )
    // No raw JSON input in the grid
    expect(within(field('countRange')).queryByRole('textbox')).toBeNull()
    expect(screen.queryByTestId('vision-params-form-countRange-dialog')).toBeNull()

    fireEvent.click(screen.getByTestId('vision-params-form-countRange-object'))
    const dialog = screen.getByTestId('vision-params-form-countRange-dialog')
    const minField = within(dialog).getByTestId('vision-params-form-countRange.min')
    const min = within(minField).getByRole('spinbutton')
    // Compared with count(), so a whole number from 0, like the same comparison on its own
    expect(min).toHaveProperty('type', 'number')
    expect([min.getAttribute('min'), min.getAttribute('step')]).toEqual(['0', '1'])
    expect(min).toHaveProperty('value', '0')
    fireEvent.change(min, {target: {value: '5'}})
    expect(params()).toEqual({countRange: {min: 5, max: 10000}})
    expect(screen.getByTestId('vision-params-form-countRange-object-preview').textContent).toBe(
      'min: 5, max: 10000',
    )

    // An emptied key is removed; the query reads it as null, so it is not flagged as required
    fireEvent.change(min, {target: {value: ''}})
    expect(params()).toEqual({countRange: {max: 10000}})
    expect(within(dialog).queryByTestId('vision-params-form-countRange.min-required')).toBeNull()
  })

  it('creates an object param from its first key, and keeps keys the query does not read', () => {
    const {params} = renderForm('*[featured == $filter.featured]', '{"filter": {"label": "x"}}')
    fireEvent.click(screen.getByTestId('vision-params-form-filter-object'))
    const dialog = screen.getByTestId('vision-params-form-filter-dialog')
    expect(within(dialog).getByTestId('vision-params-form-filter.label')).toBeTruthy()
    const featured = within(
      within(dialog).getByTestId('vision-params-form-filter.featured'),
    ).getByRole('checkbox') as HTMLInputElement
    expect(featured.indeterminate).toBe(true)
    fireEvent.click(featured)
    expect(featured.checked).toBe(true)
    expect(params()).toEqual({filter: {label: 'x', featured: true}})
  })

  it('opens nested objects in their own dialog', () => {
    const {params} = renderForm('*[rating > $range.limits.low]')
    expect(screen.getByTestId('vision-params-form-range-object-preview').textContent).toBe(
      'vision.params-form.not-set',
    )
    fireEvent.click(screen.getByTestId('vision-params-form-range-object'))
    fireEvent.click(screen.getByTestId('vision-params-form-range.limits-object'))
    const nested = screen.getByTestId('vision-params-form-range.limits-dialog')
    const low = within(within(nested).getByTestId('vision-params-form-range.limits.low')).getByRole(
      'spinbutton',
    )
    // A number with no rules: any step, and still sent as a JSON number
    expect(low).toHaveProperty('type', 'number')
    expect(low.getAttribute('step')).toBe('any')
    fireEvent.change(low, {target: {value: '3'}})
    expect(params()).toEqual({range: {limits: {low: 3}}})
    expect(screen.getByTestId('vision-params-form-range-object-preview').textContent).toBe(
      'limits: {low: 3}',
    )
  })
  it('forwards focus and blur from the object preview, and from the fields in its dialog', () => {
    const onFocus = vi.fn()
    const onBlur = vi.fn()
    const onFieldFocus = vi.fn()
    render(
      <ThemeProvider theme={theme}>
        <LayerProvider>
          <div onFocus={onFieldFocus}>
            <ObjectParamInput
              disabled={false}
              id="range"
              label="$range"
              onBlur={onBlur}
              onChange={vi.fn()}
              onFocus={onFocus}
              param={{
                name: 'range',
                node: {
                  type: 'object',
                  attributes: {min: {type: 'objectAttribute', value: {type: 'number'}}},
                },
                type: {kind: 'any', array: false},
                usages: [],
                fields: [
                  {
                    name: 'min',
                    node: {type: 'number'},
                    type: {kind: 'number', array: false},
                    usages: [],
                  },
                ],
              }}
              renderField={(field) => <input aria-label={field.name} />}
              value={{min: 1}}
            />
          </div>
        </LayerProvider>
      </ThemeProvider>,
    )
    const preview = screen.getByTestId('vision-params-form-range-object')
    fireEvent.focus(preview)
    fireEvent.blur(preview)
    expect(onFocus).toHaveBeenCalledTimes(1)
    expect(onBlur).toHaveBeenCalledTimes(1)

    // The dialog is portalled, but its focus events still reach the field through React
    fireEvent.click(preview)
    onFieldFocus.mockClear()
    fireEvent.focus(screen.getByLabelText('min'))
    expect(onFieldFocus).toHaveBeenCalledTimes(1)
  })
})
