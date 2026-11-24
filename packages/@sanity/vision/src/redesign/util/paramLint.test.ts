import {describe, expect, it} from 'vitest'

import {
  applyParamSuggestion,
  type ParamLintFinding,
  paramLintLabel,
  paramsLintDiagnostics,
  paramValueRange,
  withParamSuggestion,
} from './paramLint'

function finding(param: ParamLintFinding['param']): ParamLintFinding {
  return {
    from: 0,
    to: 1,
    line: 1,
    column: 1,
    severity: 'warning',
    message: 'Did you mean `author`?',
    source: 'vision/unknown-type',
    param,
  }
}

const slice = (text: string, range: {from: number; to: number} | null) =>
  range ? text.slice(range.from, range.to) : null

describe('paramLintLabel', () => {
  it('names the param and the item in it', () => {
    expect(paramLintLabel({name: 'type', path: [], value: 'x'})).toBe('type')
    expect(paramLintLabel({name: 'types', path: [1], value: 'x'})).toBe('types[1]')
    expect(paramLintLabel({name: 'range', path: ['min'], value: 'x'})).toBe('range.min')
  })
})

describe('paramValueRange', () => {
  it('finds the value in JSON', () => {
    const text = '{\n  "limit": 10,\n  "type": "athor"\n}'
    expect(slice(text, paramValueRange(text, {name: 'type', path: []}))).toBe('"athor"')
    expect(slice(text, paramValueRange(text, {name: 'limit', path: []}))).toBe('10')
  })

  it('finds the value in JSON5, past comments and nested values', () => {
    const text = `{
  // the filter
  other: {a: [1, "}"], b: '{'},
  /* types */ 'types': ['book', /* typo */ 'athor'],
  range: {min: "athor"},
}`
    expect(slice(text, paramValueRange(text, {name: 'types', path: [1]}))).toBe("'athor'")
    expect(slice(text, paramValueRange(text, {name: 'types', path: [0]}))).toBe("'book'")
    expect(slice(text, paramValueRange(text, {name: 'range', path: ['min']}))).toBe('"athor"')
  })

  it('is null when the text does not have the value', () => {
    expect(paramValueRange('{"type": "x"}', {name: 'types', path: []})).toBeNull()
    expect(paramValueRange('{"types": ["x"]}', {name: 'types', path: [3]})).toBeNull()
    expect(paramValueRange('{"type": ', {name: 'type', path: []})).toBeNull()
    expect(paramValueRange('not json', {name: 'type', path: []})).toBeNull()
  })
})

describe('applyParamSuggestion', () => {
  it('writes the suggestion in place of the value, as JSON', () => {
    const text = "{type: 'athor', limit: 1}"
    expect(
      applyParamSuggestion(text, {name: 'type', path: [], value: 'athor', suggestion: 'author'}),
    ).toEqual({
      text: '{type: "author", limit: 1}',
      change: {from: 7, to: 14, insert: '"author"'},
    })
  })

  it('does nothing without a suggestion, or when the value has changed', () => {
    const text = '{"type": "athr"}'
    expect(applyParamSuggestion(text, {name: 'type', path: [], value: 'athor'})).toBeNull()
    expect(
      applyParamSuggestion(text, {name: 'type', path: [], value: 'athor', suggestion: 'author'}),
    ).toBeNull()
  })
})

describe('withParamSuggestion', () => {
  it('replaces the value at the path', () => {
    const target = {name: 'types', path: [1], value: 'athor', suggestion: 'author'}
    expect(withParamSuggestion(['book', 'athor'], target)).toEqual(['book', 'author'])
    expect(withParamSuggestion('athor', {...target, name: 'type', path: []})).toBe('author')
    expect(withParamSuggestion({min: 'athor'}, {...target, path: ['min']})).toEqual({
      min: 'author',
    })
  })

  it('leaves a value that has changed as it is', () => {
    const target = {name: 'types', path: [1], value: 'athor', suggestion: 'author'}
    expect(withParamSuggestion(['book', 'other'], target)).toEqual(['book', 'other'])
    expect(withParamSuggestion('athor', {...target, suggestion: undefined})).toBe('athor')
  })
})

describe('paramsLintDiagnostics', () => {
  const labels = {useSuggestion: (suggestion: string) => `Use ${suggestion}`}

  it('underlines the value, with the suggestion as its quick fix', () => {
    const text = '{"types": ["book", "athor"]}'
    const [diagnostic] = paramsLintDiagnostics(text, {
      ...labels,
      findings: [finding({name: 'types', path: [1], value: 'athor', suggestion: 'author'})],
    })
    expect(text.slice(diagnostic.from, diagnostic.to)).toBe('"athor"')
    expect(diagnostic).toMatchObject({severity: 'warning', source: 'vision/unknown-type'})
    expect(diagnostic.actions?.map((action) => action.name)).toEqual(['Use "author"'])
  })

  it('has no quick fix without a suggestion, and skips values that have changed', () => {
    const text = '{"type": "zzz", "other": "athr"}'
    const diagnostics = paramsLintDiagnostics(text, {
      ...labels,
      findings: [
        finding({name: 'type', path: [], value: 'zzz'}),
        finding({name: 'other', path: [], value: 'athor', suggestion: 'author'}),
      ],
    })
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0].actions).toBeUndefined()
  })
})
