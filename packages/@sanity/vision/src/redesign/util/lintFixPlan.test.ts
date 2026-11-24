import {describe, expect, it} from 'vitest'

import {type QueryLintFinding} from './groqLint'
import {
  applyParamFixes,
  applyQueryEdits,
  lintFixTarget,
  planLintFix,
  shiftFindings,
} from './lintFixPlan'

function finding(overrides: Partial<QueryLintFinding>): QueryLintFinding {
  return {
    from: 0,
    to: 1,
    line: 1,
    column: 1,
    severity: 'warning',
    message: 'Something',
    source: 'groq-lint/something',
    ...overrides,
  }
}

const paramFinding = (suggestion?: string) =>
  finding({
    source: 'vision/unknown-type',
    param: {name: 'type', path: [], value: 'athor', ...(suggestion ? {suggestion} : {})},
  })

describe('planLintFix', () => {
  it('sends query findings to the agent to fix in the query', () => {
    const query = finding({})
    expect(lintFixTarget(query)).toBe('query')
    expect(planLintFix([query])).toEqual({
      queryEdits: [],
      paramFixes: [],
      agent: {findings: [query], target: 'query'},
    })
  })

  it('sends param findings without a suggestion to the agent to fix in the params', () => {
    const param = paramFinding()
    expect(lintFixTarget(param)).toBe('params')
    expect(planLintFix([param]).agent).toEqual({findings: [param], target: 'params'})
  })

  it('fixes in both when the findings are in both', () => {
    const query = finding({})
    const param = paramFinding()
    expect(planLintFix([query, param]).agent).toEqual({findings: [query, param], target: 'both'})
  })

  it('writes the suggestions itself, without the agent', () => {
    const plan = planLintFix([
      paramFinding('author'),
      finding({from: 10, to: 14, fix: {from: 10, to: 14, insert: 'name'}}),
    ])
    expect(plan).toEqual({
      queryEdits: [{from: 10, to: 14, insert: 'name'}],
      paramFixes: [{name: 'type', path: [], value: 'athor', suggestion: 'author'}],
      agent: undefined,
    })
  })

  it('leaves the agent only what has no suggestion, told where it is', () => {
    const query = finding({message: 'Avoid joins'})
    const plan = planLintFix([paramFinding('author'), query])
    expect(plan.paramFixes).toHaveLength(1)
    expect(plan.agent).toEqual({findings: [query], target: 'query'})
  })

  it('keeps query edits in order, dropping one that overlaps another', () => {
    const plan = planLintFix([
      finding({fix: {from: 20, to: 24, insert: 'b'}}),
      finding({fix: {from: 2, to: 6, insert: 'a'}}),
      finding({fix: {from: 22, to: 23, insert: 'c'}}),
    ])
    expect(plan.queryEdits).toEqual([
      {from: 2, to: 6, insert: 'a'},
      {from: 20, to: 24, insert: 'b'},
    ])
  })
})

describe('applyQueryEdits', () => {
  it('makes every edit at its own offsets', () => {
    expect(
      applyQueryEdits('*[_type == "athor"]{nmae}', [
        {from: 11, to: 18, insert: '"author"'},
        {from: 20, to: 24, insert: 'name'},
      ]),
    ).toBe('*[_type == "author"]{name}')
  })
})

describe('applyParamFixes', () => {
  it('writes every suggestion, as a single change', () => {
    const raw = '{\n  "type": "athor",\n  "types": ["book", "athor"]\n}'
    const {text, changes} = applyParamFixes(raw, [
      {name: 'type', path: [], value: 'athor', suggestion: 'author'},
      {name: 'types', path: [1], value: 'athor', suggestion: 'author'},
    ])
    expect(text).toBe('{\n  "type": "author",\n  "types": ["book", "author"]\n}')
    expect(changes).toHaveLength(1)
    const [change] = changes
    expect(`${raw.slice(0, change.from)}${change.insert}${raw.slice(change.to)}`).toBe(text)
  })

  it('changes nothing when the values have changed since', () => {
    expect(
      applyParamFixes('{"type": "post"}', [
        {name: 'type', path: [], value: 'athor', suggestion: 'author'},
      ]),
    ).toEqual({text: '{"type": "post"}', changes: []})
  })
})

describe('shiftFindings', () => {
  it('moves the findings after the edits to their places in the edited query', () => {
    const query = '*[_type == "athor"]\n{nmae}[0...10] | order(x)'
    const edits = [{from: 11, to: 18, insert: '"author"'}]
    const edited = applyQueryEdits(query, edits)
    const sliceFrom = query.indexOf('[0...10]')
    const [moved, param] = shiftFindings(
      [
        finding({from: sliceFrom, to: sliceFrom + 8, line: 2, column: 7}),
        finding({param: {name: 'type', path: [], value: 'x'}}),
      ],
      edits,
      edited,
    )
    expect(edited.slice(moved.from, moved.to)).toBe('[0...10]')
    expect(moved).toMatchObject({line: 2, column: 7})
    expect(param.from).toBe(0)

    const sameLine = shiftFindings(
      [finding({from: 19, to: 20, line: 1, column: 20})],
      edits,
      edited,
    )
    expect(sameLine[0]).toMatchObject({from: 20, to: 21, line: 1, column: 21})
  })
})
