import {Schema} from '@sanity/schema'
import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {cleanup, createEvent, fireEvent, render, screen, within} from '@testing-library/react'
import JSON5 from 'json5'
import {type ReactNode, useState} from 'react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {type Params} from '../../../components/VisionGui'
import {ParamsForm} from './ParamsForm'

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
      ],
    },
    {name: 'author', type: 'document', fields: [{name: 'name', type: 'string'}]},
  ],
})

vi.mock('sanity', () => ({
  defineLocalesResources: (_namespace: string, resources: unknown) => resources,
  useSchema: () => schema,
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
    // The document types are suggested; the input points at the list
    const typeInput = within(field('type')).getByRole('combobox')
    const list = document.getElementById(typeInput.getAttribute('list') || '')
    expect([...(list?.querySelectorAll('option') ?? [])].map((option) => option.value)).toEqual([
      'author',
      'post',
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

  it('sends numbers as numbers, keeping the text as typed, and other text as text', () => {
    const {field, input, params} = renderForm('*[_type == "post"][0...$limit]')
    fireEvent.change(input('limit'), {target: {value: '1.'}})
    expect(params()).toEqual({limit: 1})
    expect(input('limit')).toHaveProperty('value', '1.')
    fireEvent.change(input('limit'), {target: {value: '1.5'}})
    expect(params()).toEqual({limit: 1.5})
    expect(within(field('limit')).getByTestId('vision-params-form-limit-problem').textContent).toBe(
      'vision.params-form.invalid.integer',
    )
    fireEvent.change(input('limit'), {target: {value: 'ten'}})
    expect(params()).toEqual({limit: 'ten'})
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

  it('offers true and false for a boolean, and any JSON for an untyped param', () => {
    const {field, input, params} = renderForm(
      '*[_type == "post" && featured == $featured]{"extra": $extra}',
    )
    fireEvent.change(within(field('featured')).getByRole('combobox'), {target: {value: 'false'}})
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
      within(field('limit')).getByRole('textbox'),
      within(field('featured')).getByRole('combobox'),
      within(field('types')).getByRole('combobox'),
    ]
    for (const [index, target] of fields.entries()) {
      const enter = createEvent.keyDown(target, {key: 'Enter', keyCode: 13})
      fireEvent(target, enter)
      // No native form submission or select popup on top of the fetch
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

  it('explains a query without params', () => {
    renderForm('*[_type == "post"]')
    expect(screen.getByText('vision.params-form.empty')).toBeTruthy()
  })
})
