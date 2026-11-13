import {CompletionContext} from '@codemirror/autocomplete'
import {EditorSelection, EditorState} from '@codemirror/state'
import {groq} from '@sanity/lezer-groq'
import {describe, expect, it} from 'vitest'

import {paramCompletions, queryParamNames} from './groqParamCompletions'

function complete(doc: string, names: readonly string[], pos = doc.length) {
  const state = EditorState.create({
    doc,
    selection: EditorSelection.cursor(pos),
    extensions: [groq(), queryParamNames.of(names)],
  })
  return paramCompletions(new CompletionContext(state, pos, false))
}

function labels(doc: string, names: readonly string[], pos = doc.length): string[] | null {
  const result = complete(doc, names, pos)
  return result ? result.options.map((option) => option.label) : null
}

describe('paramCompletions', () => {
  it('offers every params JSON name when $ is typed', () => {
    expect(labels('*[_type == $', ['foo', 'limit'])).toEqual(['$foo', '$limit'])
  })

  it('narrows to names that start with what follows $', () => {
    expect(labels('*[_type == $f', ['foo', 'limit'])).toEqual(['$foo'])
  })

  it('offers nothing without a $, without names, or inside a string', () => {
    expect(labels('*[_type == "author"]', ['foo'])).toBeNull()
    expect(labels('*[_type == $', [])).toBeNull()
    const doc = '*["$foo"]'
    expect(labels(doc, ['foo'], doc.indexOf('$') + 1)).toBeNull()
  })

  it('replaces from the $ so accepting $foo writes the whole param', () => {
    const doc = '*[_type == $f'
    const result = complete(doc, ['foo'])
    expect(result?.from).toBe(doc.lastIndexOf('$'))
    expect(result?.options[0]?.label).toBe('$foo')
  })
})
