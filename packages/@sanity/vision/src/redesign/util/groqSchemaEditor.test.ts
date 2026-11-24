import {
  CompletionContext,
  completionStatus,
  currentCompletions,
  startCompletion,
} from '@codemirror/autocomplete'
import {EditorSelection, EditorState} from '@codemirror/state'
import {EditorView} from '@codemirror/view'
import {groq} from '@sanity/lezer-groq'
import {Schema} from '@sanity/schema'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {
  type GroqEditorLabels,
  groqEditorLabels,
  queryParamValues,
  querySchema,
} from './groqEditorContext'
import {createGroqFunctionExtensions} from './groqFunctionEditor'
import {
  describeFieldType,
  schemaFieldCompletions,
  typeHoverAt,
  typeValueCompletions,
} from './groqSchemaEditor'
import {createQuerySchema, fieldsOf} from './schemaCheck'

const LABELS: GroqEditorLabels = {
  reference: 'Reference',
  apiVersion: (version) => `Needs ${version}`,
  deltaOnly: 'Delta only',
  declaredOn: (line) => `Line ${line}`,
  inLibrary: 'In library',
  completionDeclared: 'Declared',
  completionLibrary: 'Library',
  extract: 'Extract',
  addFromLibrary: 'Add',
  useSuggestion: (suggestion) => `Use ${suggestion}`,
  fieldOf: (types) => `Field of ${types}`,
  systemField: 'System field',
  documentType: 'Document type',
  operatorReference: 'Operators',
  paramValue: 'In params',
  paramNotSet: 'Not in params',
}

const schema = createQuerySchema(
  Schema.compile({
    name: 'test',
    types: [
      // The studio's own slug type, which the bare schema compiler does not have
      {name: 'slug', type: 'object', fields: [{name: 'current', type: 'string'}]},
      {
        name: 'author',
        title: 'Author',
        type: 'document',
        fields: [
          {name: 'name', type: 'string', description: 'Full name'},
          {name: 'bestFriend', type: 'reference', to: [{type: 'author'}]},
          {name: 'slug', type: 'slug'},
          {
            name: 'address',
            type: 'object',
            fields: [{name: 'city', type: 'string'}],
          },
        ],
      },
      {
        name: 'book',
        type: 'document',
        fields: [
          {name: 'title', type: 'string'},
          {name: 'author', type: 'reference', to: [{type: 'author'}]},
          {
            name: 'chapters',
            type: 'array',
            of: [{type: 'object', fields: [{name: 'heading', type: 'string'}]}],
          },
        ],
      },
      {
        name: 'pokemon',
        type: 'document',
        fields: [
          {name: 'isLegendary', type: 'boolean'},
          {name: 'trainers', type: 'array', of: [{type: 'reference', to: [{type: 'author'}]}]},
          {
            name: 'status',
            type: 'string',
            options: {list: [{title: 'Wild', value: 'wild'}, 'caught']},
          },
        ],
      },
    ],
  }),
)

/** `|` marks the cursor */
function stateOf(docWithCursor: string, params: Record<string, unknown> = {}) {
  const pos = docWithCursor.indexOf('|')
  const doc = docWithCursor.replace('|', '')
  const state = EditorState.create({
    doc,
    selection: EditorSelection.cursor(pos),
    extensions: [
      groq(),
      groqEditorLabels.of(LABELS),
      querySchema.of(schema),
      queryParamValues.of(params),
    ],
  })
  return {state, pos}
}

function fields(
  docWithCursor: string,
  params?: Record<string, unknown>,
  explicit = false,
): string[] | null {
  const {state, pos} = stateOf(docWithCursor, params)
  const result = schemaFieldCompletions(new CompletionContext(state, pos, explicit))
  return result ? result.options.map((option) => option.label) : null
}

const AUTHOR_FIELDS = ['name', 'bestFriend', 'slug', 'address']
const DOCUMENT_FIELDS = ['_id', '_type', '_createdAt', '_updatedAt', '_rev']

describe('schemaFieldCompletions', () => {
  it('offers the fields of the type the filter pins, in projections and filters', () => {
    expect(fields('*[_type == "author"]{|}')).toEqual(
      expect.arrayContaining([...AUTHOR_FIELDS, ...DOCUMENT_FIELDS]),
    )
    expect(fields('*[_type == "author"]{name, |}')).toEqual(expect.arrayContaining(AUTHOR_FIELDS))
    expect(fields('*[_type == "author" && na|]')).toEqual(['name'])
    expect(fields('*[_type == "book"]{ti|}')).toEqual(['title'])
  })

  it('lists what starts with what is typed before what only contains it', () => {
    const labels = fields('*[_type == "book"]{a|}')
    expect(labels?.[0]).toBe('author')
    expect(labels).toContain('chapters')
    expect(fields('*[_type == "book"]{ap|}')).toEqual(['chapters'])
  })

  it('narrows `_type == $type` by the value in the params JSON', () => {
    expect(fields('*[_type == $type]{|}', {type: 'author'})).toEqual(
      expect.arrayContaining(AUTHOR_FIELDS),
    )
    expect(fields('*[_type == $type]{|}', {type: 'book'})).not.toContain('bestFriend')
    expect(fields('*[_type in $types]{|}', {types: ['author', 'book']})).toEqual(
      expect.arrayContaining([...AUTHOR_FIELDS, 'title', 'chapters']),
    )
  })

  it('offers nothing where the schema does not tell which documents these are', () => {
    expect(fields('*[_type == $type]{|}')).toBeNull()
    expect(fields('*[|]')).toBeNull()
    expect(fields('*{|}')).toBeNull()
  })

  it('follows references, objects and arrays after `->` and `.`', () => {
    expect(fields('*[_type == "book"]{author->|}')).toEqual(expect.arrayContaining(AUTHOR_FIELDS))
    expect(fields('*[_type == "book"]{"name": author->bestFriend->|}')).toEqual(
      expect.arrayContaining(AUTHOR_FIELDS),
    )
    expect(fields('*[_type == "author"]{address.|}')).toEqual(expect.arrayContaining(['city']))
    expect(fields('*[_type == "book"]{chapters[]{|}}')).toEqual(
      expect.arrayContaining(['heading', '_key']),
    )
    expect(fields('*[_type == "book"]{author.|}')).toEqual(expect.arrayContaining(['_ref']))
  })

  it('opens on its own only after a field opener or a typed name', () => {
    expect(fields('*[_type == "author" && |]')).toBeNull()
    expect(fields('*[_type == "author" && |]', {}, true)).toEqual(
      expect.arrayContaining(AUTHOR_FIELDS),
    )
    expect(fields('*[_type == "author"]{"x": $|}')).toBeNull()
    expect(fields('*[_type == "author"]{"x": "na|"}')).toBeNull()
  })

  it('describes each field by its schema type', () => {
    const {state, pos} = stateOf('*[_type == "book"]{|}')
    const result = schemaFieldCompletions(new CompletionContext(state, pos, false))
    const details = Object.fromEntries(
      (result?.options ?? []).map((option) => [option.label, option.detail]),
    )
    expect(details).toMatchObject({
      title: 'string',
      author: 'reference → author',
      chapters: 'array of object',
      _id: 'System field',
    })
  })
})

describe('typeValueCompletions', () => {
  function types(docWithCursor: string) {
    const {state, pos} = stateOf(docWithCursor)
    const result = typeValueCompletions(new CompletionContext(state, pos, false))
    return result ? {from: result.from, labels: result.options.map((o) => o.label)} : null
  }

  it('offers document type names in the string `_type` is compared to', () => {
    const doc = '*[_type == "au|"]'
    const result = types(doc)
    expect(result?.labels.slice(0, 2)).toEqual(['author', 'book'])
    expect(result?.from).toBe(doc.indexOf('"') + 1)
    expect(types('*[_type in ["author", "|"]]')?.labels).toContain('book')
    expect(types("*[_type != '|']")?.labels).toContain('author')
  })

  it('offers nothing in other strings', () => {
    expect(types('*[title == "|"]')).toBeNull()
    expect(types('*[_type == $|]')).toBeNull()
  })
})

/** The hover's text where `at` is in `doc`, or null when there is none */
function hoverText(
  doc: string,
  at: string,
  {params = {}, offset = 0}: {params?: Record<string, unknown>; offset?: number} = {},
): string | null {
  const state = EditorState.create({
    doc,
    extensions: [
      groq(),
      groqEditorLabels.of(LABELS),
      querySchema.of(schema),
      queryParamValues.of(params),
    ],
  })
  const tooltip = typeHoverAt(state, doc.indexOf(at) + offset, 1)
  return tooltip?.create(undefined as never).dom.textContent ?? null
}

describe('typeHoverAt', () => {
  it('resolves `_type` in a projection to the types the filter pins', () => {
    const doc = '*[_type == "pokemon" && isLegendary == true] | order(_createdAt asc) { _type }'
    expect(hoverText(doc, '_type }')).toContain('_type: "pokemon"')
    expect(hoverText('*[_type in ["author", "book"]]{_type}', '_type}')).toContain(
      '_type: "author" | "book"',
    )
    expect(hoverText('*[_type == "book"]{author{_type}}', '_type}')).toContain('_type: "reference"')
  })

  it('shows a field type, description and the types that declare it', () => {
    const doc = '*[_type == $type]{name}'
    const text = hoverText(doc, 'name', {params: {type: 'author'}, offset: 1})
    expect(text).toContain('name: string')
    expect(text).toContain('Full name')
    expect(text).toContain('Field of author')
  })

  it('lists the values a field allows', () => {
    expect(hoverText('*[_type == "pokemon"]{status}', 'status')).toContain(
      'status: "wild" | "caught"',
    )
  })

  it('types system attributes, also of documents the query has not narrowed', () => {
    expect(hoverText('*[_type == "author"]{_createdAt}', '_createdAt')).toContain(
      '_createdAt: string',
    )
    expect(hoverText('*[_id == "x"]', '_id')).toContain('_id: string')
    expect(hoverText('*[_type == "book"]{"weak": author._weak}', '_weak')).toContain(
      '_weak: boolean',
    )
  })

  it('shows nothing for a field the schema does not declare', () => {
    expect(hoverText('*[_type == "author"]{nope}', 'nope')).toBeNull()
    expect(hoverText('*[_type == "author"]{_ref}', '_ref')).toBeNull()
  })

  it('shows a param by its value in the params, or the type the query expects of it', () => {
    expect(hoverText('*[_type == $type]', '$type', {params: {type: 'author'}})).toBe(
      '$type: "author"In params',
    )
    expect(
      hoverText('*[_type in $types]', '$types', {params: {types: ['author', 'book']}}),
    ).toContain('$types: ["author","book"]')
    expect(hoverText('*[_type == $type]', '$type')).toContain(
      '$type: "author" | "book" | "pokemon"',
    )
    expect(hoverText('*[_type == "author"][0...$limit]', '$limit')).toContain('$limit: integer')
    expect(hoverText('*[_type == "author"][0...$limit]', '$limit', {params: {limit: ''}})).toBe(
      '$limit: integerNot in params',
    )
  })

  it('resolves `*`, `@`, `^` and `->` to what they stand for', () => {
    expect(hoverText('*[_type == "book"]{title}', '*')).toContain('*: array of book')
    expect(hoverText('*[_type == "book"]{"me": @}', '@')).toContain('@: book')
    expect(hoverText('*[_type == "book"]{author->{"b": ^}}', '^')).toContain('^: book')
    expect(hoverText('*[_type == "book"]{author->{name}}', '->')).toContain('<reference> -> author')
    expect(hoverText('*[_type == "pokemon"]{"t": trainers[]->name}', '->')).toContain(
      '<reference> -> author',
    )
  })

  it('documents operators', () => {
    const doc = '*[_type == "book" && !defined(title) || title match "x*"]'
    expect(hoverText(doc, '==')).toContain('<any> == <any> <boolean>')
    expect(hoverText(doc, '&&')).toContain('True when both sides are true')
    expect(hoverText(doc, 'match')).toContain('Full-text match')
    expect(hoverText(doc, '&&')).toContain('Operators')
  })

  it('names the document type a string stands for', () => {
    expect(hoverText('*[_type == "author"]', '"author"', {offset: 1})).toBe(
      '"author"AuthorDocument type',
    )
    expect(hoverText('*[title == "x"]', '"x"', {offset: 1})).toBeNull()
  })
})

describe('describeFieldType', () => {
  it('names references by their targets', () => {
    const author = fieldsOf(schema.documents.get('book')!).find((field) => field.name === 'author')!
    expect(describeFieldType(author.type)).toBe('reference → author')
  })
})

describe('completion ranking', () => {
  const views: EditorView[] = []
  afterEach(() => {
    views.splice(0).forEach((view) => view.destroy())
  })

  /** The menu the editor opens at `|`, as the labels in the order it lists them */
  async function menu(docWithCursor: string, params: Record<string, unknown> = {}) {
    const {state: base, pos} = stateOf(docWithCursor, params)
    const state = EditorState.create({
      doc: base.doc,
      selection: EditorSelection.cursor(pos),
      extensions: [
        groq(),
        ...createGroqFunctionExtensions(LABELS),
        querySchema.of(schema),
        queryParamValues.of(params),
      ],
    })
    const view = new EditorView({state, parent: document.body})
    views.push(view)
    startCompletion(view)
    await vi.waitFor(() => expect(completionStatus(view.state)).toBe('active'))
    return currentCompletions(view.state).map((completion) => completion.label)
  }

  const isFunction = (label: string) => /^[a-z]+::[a-zA-Z]+$/.test(label) || label === 'count'

  it('lists the schema fields before the generic functions in a projection', async () => {
    const labels = await menu('*[_type == "author"]{|}')
    const lastField = Math.max(...AUTHOR_FIELDS.map((name) => labels.indexOf(name)))
    const firstFunction = labels.findIndex(isFunction)
    expect(lastField).toBeGreaterThan(-1)
    expect(firstFunction).toBeGreaterThan(lastField)
    expect(labels).toContain('text::semanticSimilarity')
    expect(labels).toContain('user::attributes')
  })

  it('lists the fields of a type a param pins before the functions too', async () => {
    const labels = await menu('*[_type == $type]{|}', {type: 'book'})
    expect(labels.slice(0, 3)).toEqual(['title', 'author', 'chapters'])
    expect(labels.indexOf('chapters')).toBeLessThan(labels.indexOf('text::semanticSimilarity'))
  })

  it('keeps the fields ahead of functions that match what is typed', async () => {
    const labels = await menu('*[_type == "book"]{c|}')
    expect(labels.indexOf('chapters')).toBe(0)
    expect(labels.findIndex(isFunction)).toBeGreaterThan(0)
    expect(labels).toContain('count')
  })

  it('lists the system fields after the fields the schema declares', async () => {
    const labels = await menu('*[_type == "book"]{|}')
    expect(labels.indexOf('chapters')).toBeLessThan(labels.indexOf('_id'))
    expect(labels.indexOf('_id')).toBeLessThan(labels.findIndex(isFunction))
  })
})
