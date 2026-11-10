import {Schema} from '@sanity/schema'
import {describe, expect, it} from 'vitest'

import {evaluateQueryType} from './evaluateQueryType'
import {printTypeScript} from './printTypeScript'

const schema = Schema.compile({
  name: 'test',
  types: [
    {
      name: 'author',
      type: 'document',
      fields: [
        {name: 'name', type: 'string'},
        {name: 'age', type: 'number'},
      ],
    },
  ],
})

describe('evaluateQueryType', () => {
  it('evaluates against the workspace schema like typegen', () => {
    const evaluation = evaluateQueryType({
      query: '*[_type == "author"]{_id, name}',
      params: {},
      schema,
      hasResult: false,
      result: undefined,
    })
    expect(evaluation.source).toBe('schema')
    if (evaluation.source !== 'schema') throw new Error('expected schema evaluation')
    expect(printTypeScript(evaluation.node, {typeName: 'Authors', schema: evaluation.schema})).toBe(
      ['export type Authors = Array<{', '  _id: string;', '  name: string | null;', '}>;'].join(
        '\n',
      ),
    )
  })

  it('falls back to the result when the query cannot be evaluated', () => {
    const evaluation = evaluateQueryType({
      query: '*[_type == "author" && _id == $id]{name',
      params: {},
      schema,
      hasResult: true,
      result: [{name: 'x'}],
    })
    expect(evaluation.source).toBe('result')
    if (evaluation.source !== 'result') throw new Error('expected result inference')
    expect(evaluation.schemaError).toBeInstanceOf(Error)
    expect(evaluation.node).toEqual({
      type: 'array',
      of: {type: 'object', attributes: {name: {type: 'objectAttribute', value: {type: 'string'}}}},
    })
  })

  it('reports when there is nothing to derive a type from', () => {
    const evaluation = evaluateQueryType({
      query: '',
      params: {},
      schema: undefined,
      hasResult: false,
      result: undefined,
    })
    expect(evaluation).toEqual({source: 'none', schemaError: undefined})
  })
})
