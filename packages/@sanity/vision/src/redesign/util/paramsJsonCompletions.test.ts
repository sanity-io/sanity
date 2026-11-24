import {CompletionContext} from '@codemirror/autocomplete'
import {javascriptLanguage} from '@codemirror/lang-javascript'
import {EditorSelection, EditorState} from '@codemirror/state'
import {EditorView} from '@codemirror/view'
import {describe, expect, it} from 'vitest'

import {inferQueryParams} from './paramInference'
import {
  paramsJsonCompletions,
  paramsJsonInferredParams,
  paramValueOptions,
  suggestedParamValue,
} from './paramsJsonCompletions'

const NOW = new Date('2026-01-02T03:04:05.000Z')
const now = () => NOW

/** `|` in `marked` is the cursor; without one it is at the end */
function setup(marked: string, query: string, {explicit = false} = {}) {
  const pos = marked.includes('|') ? marked.indexOf('|') : marked.length
  const doc = marked.replace('|', '')
  const {params} = inferQueryParams(query)
  const state = EditorState.create({
    doc,
    selection: EditorSelection.cursor(pos),
    extensions: [javascriptLanguage, paramsJsonInferredParams.of(params)],
  })
  const result = paramsJsonCompletions(new CompletionContext(state, pos, explicit), now)
  return {state, result}
}

function labels(doc: string, query: string, options?: {explicit?: boolean}) {
  const {result} = setup(doc, query, options)
  return result ? result.options.map((option) => option.label) : null
}

/** Accepts the completion with `label` and returns the document */
function accept(doc: string, query: string, label: string): string {
  const {state, result} = setup(doc, query)
  const completion = result?.options.find((option) => option.label === label)
  if (!completion || typeof completion.apply !== 'function') {
    throw new Error(`No completion ${label}`)
  }
  const view = new EditorView({state})
  completion.apply(view, completion, result!.from, result!.to ?? result!.from)
  const text = view.state.doc.toString()
  view.destroy()
  return text
}

const QUERY = '*[_type == "movie" && $year > 1900 && popularity > $min && defined($extra)]'

describe('paramsJsonCompletions', () => {
  it('offers the params the query uses that the JSON has no key for', () => {
    expect(labels('{\n  "year": 1999,\n  m', QUERY)).toEqual(['min', 'extra'])
    expect(labels('{\n  "', QUERY)).toEqual(['year', 'min', 'extra'])
  })

  it('writes the key with a value the query accepts', () => {
    expect(accept('{\n  y|\n}', QUERY, 'year')).toBe('{\n  "year": 0\n}')
    expect(accept('{\n  "y|"\n}', QUERY, 'year')).toBe('{\n  "year": 0\n}')
  })

  it('writes null for a param whose value cannot be inferred', () => {
    expect(accept('{\n  e|\n}', QUERY, 'extra')).toBe('{\n  "extra": null\n}')
  })

  it('adds a comma when another key follows', () => {
    expect(accept('{\n  e|\n  "year": 1\n}', QUERY, 'extra')).toBe(
      '{\n  "extra": null,\n  "year": 1\n}',
    )
  })

  it('offers the values the query accepts after a key', () => {
    const query = '*[$featured && published]'
    expect(labels('{"featured": ', query)).toEqual(['false', 'true'])
    expect(labels('{"featured": t', query)).toEqual(['false', 'true'])
    expect(accept('{"featured": t|}', query, 'true')).toBe('{"featured": true}')
    expect(labels('{"unknown": ', '*[x == $unknown]')).toEqual(['null'])
  })

  it('offers the literals the query compares a param with', () => {
    const query = '*[$kind == "movie" || $kind == "show" || $tier in [1, 2]]'
    expect(labels('{"kind": ', query)).toEqual(['"movie"', '"show"'])
    expect(labels('{"tier": ', query)).toEqual(['1', '2'])
    expect(accept('{\n  k|\n}', query, 'kind')).toBe('{\n  "kind": "movie"\n}')
  })

  it('offers nothing outside the root object or when nothing is missing', () => {
    expect(labels('{"year": [m', QUERY)).toBeNull()
    expect(labels('{"year": 1, "min": 2, "extra": 3, x', QUERY)).toBeNull()
    expect(labels('{\n  ', QUERY)).toBeNull()
    expect(labels('{\n  ', QUERY, {explicit: true})).toEqual(['year', 'min', 'extra'])
  })
})

describe('suggestedParamValue', () => {
  it('picks a value of the inferred type', () => {
    expect(suggestedParamValue({kind: 'string', array: false})).toBe('')
    expect(suggestedParamValue({kind: 'string', array: false, options: ['b', 'a']})).toBe('b')
    expect(suggestedParamValue({kind: 'string', array: false, format: 'datetime'}, now)).toBe(
      NOW.toISOString(),
    )
    expect(suggestedParamValue({kind: 'integer', array: false})).toBe(0)
    expect(suggestedParamValue({kind: 'boolean', array: false})).toBe(false)
    expect(suggestedParamValue({kind: 'string', array: true})).toEqual([])
    expect(suggestedParamValue({kind: 'any', array: false})).toBeNull()
  })

  it('lists literal options and null for a nullable param', () => {
    expect(
      paramValueOptions({
        name: 'kind',
        type: {kind: 'string', array: false, options: ['a', 'b']},
        usages: [],
        nullable: true,
      }),
    ).toEqual(['a', 'b', null])
  })
})
