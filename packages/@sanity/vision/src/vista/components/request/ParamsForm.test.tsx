import {Schema} from '@sanity/schema'
import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {cleanup, fireEvent, render, screen, within} from '@testing-library/react'
import JSON5 from 'json5'
import {useState} from 'react'
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
  defineLocaleResourceBundle: (bundle: unknown) => bundle,
  defineLocalesResources: (_namespace: string, resources: unknown) => resources,
  useSchema: () => schema,
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
function Harness({query, initial}: {query: string; initial: string}) {
  const [raw, setRaw] = useState(initial)
  return (
    <>
      <ParamsForm onChange={setRaw} params={toParams(raw)} query={query} />
      <output data-testid="raw">{raw}</output>
    </>
  )
}

function renderForm(query: string, initial = '{}') {
  render(
    <ThemeProvider theme={theme}>
      <LayerProvider>
        <Harness initial={initial} query={query} />
      </LayerProvider>
    </ThemeProvider>,
  )
  return {
    params: () => JSON.parse(screen.getByTestId('raw').textContent || '{}') as unknown,
    field: (name: string) => screen.getByTestId(`vista-params-form-${name}`),
    input: (name: string) =>
      within(screen.getByTestId(`vista-params-form-${name}`)).getByRole('textbox'),
  }
}

describe('ParamsForm', () => {
  afterEach(() => cleanup())

  it('has a field per param, typed from the schema and the query', () => {
    const {field} = renderForm(
      '*[_type == $type && status == $status && featured == $featured && _id != $id][0...$limit]{"extra": $extra}',
    )
    const types = ['type', 'status', 'featured', 'id', 'limit', 'extra'].map(
      (name) => screen.getByTestId(`vista-params-form-${name}-type`).textContent,
    )
    expect(types).toEqual([
      'vista.params-form.type.document-type',
      'vista.params-form.type.options:{"type":"vista.params-form.type.string","count":2}',
      'vista.params-form.type.boolean',
      'vista.params-form.type.document-id',
      'vista.params-form.type.integer',
      'vista.params-form.type.any',
    ])
    // The document types are suggested; the input points at the list
    const typeInput = within(field('type')).getByRole('combobox')
    const list = document.getElementById(typeInput.getAttribute('list') || '')
    expect([...(list?.querySelectorAll('option') ?? [])].map((option) => option.value)).toEqual([
      'author',
      'post',
    ])
    expect(within(field('type')).getByText('vista.params-form.missing')).toBeTruthy()
    expect(within(field('type')).getByText('_type == $type')).toBeTruthy()
  })

  it('writes what is typed into the params, and removes a param that is cleared', () => {
    const {field, params} = renderForm('*[_type == $type && title == $title]', '{"title": "x"}')
    const typeInput = within(field('type')).getByRole('combobox')
    fireEvent.change(typeInput, {target: {value: 'post'}})
    expect(params()).toEqual({title: 'x', type: 'post'})
    expect(within(field('type')).queryByTestId('vista-params-form-type-problem')).toBeNull()

    // Values the schema does not know are still sent, for testing
    fireEvent.change(typeInput, {target: {value: 'nope'}})
    expect(params()).toEqual({title: 'x', type: 'nope'})
    expect(within(field('type')).getByTestId('vista-params-form-type-problem').textContent).toBe(
      'vista.params-form.invalid.document-type',
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
    expect(within(field('limit')).getByTestId('vista-params-form-limit-problem').textContent).toBe(
      'vista.params-form.invalid.integer',
    )
    fireEvent.change(input('limit'), {target: {value: 'ten'}})
    expect(params()).toEqual({limit: 'ten'})
    expect(within(field('limit')).getByTestId('vista-params-form-limit-problem').textContent).toBe(
      'vista.params-form.invalid.number',
    )
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
  })

  it('edits a list param item by item', () => {
    const {field, params} = renderForm('*[_type in $types]')
    fireEvent.click(screen.getByTestId('vista-params-form-types-add'))
    fireEvent.click(screen.getByTestId('vista-params-form-types-add'))
    expect(params()).toEqual({types: ['', '']})

    const items = within(field('types')).getAllByRole('combobox')
    fireEvent.change(items[0], {target: {value: 'post'}})
    fireEvent.change(items[1], {target: {value: 'author'}})
    expect(params()).toEqual({types: ['post', 'author']})

    fireEvent.click(within(field('types')).getAllByLabelText('vista.params-form.remove-item')[0])
    expect(params()).toEqual({types: ['author']})
  })

  it('lists params the query does not use, to remove them', () => {
    const {params} = renderForm('*[_type == $type]', '{"type": "post", "stale": 1}')
    const unused = screen.getByTestId('vista-params-form-unused')
    expect(unused.textContent).toContain('$stale')
    fireEvent.click(within(unused).getByText('vista.params-form.remove'))
    expect(params()).toEqual({type: 'post'})
  })

  it('does not edit params that are not valid JSON', () => {
    renderForm('*[_type == $type]', '{"type": ')
    expect(screen.getByText('vista.params-form.invalid-json')).toBeTruthy()
    expect(screen.getByTestId('vista-params-form-type').querySelector('input')).toHaveProperty(
      'disabled',
      true,
    )
  })

  it('explains a query without params', () => {
    renderForm('*[_type == "post"]')
    expect(screen.getByText('vista.params-form.empty')).toBeTruthy()
  })
})
