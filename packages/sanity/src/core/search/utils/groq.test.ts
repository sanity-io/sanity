import {describe, expect, it} from '@jest/globals'
import {type ExprNode, parse} from 'groq-js'

import {groqExpressionContainsType, groqExpressionIsTextSearchCompatible} from './groq'

describe('groqExpressionIsTextSearchCompatible', () => {
  it.each([
    {
      expression: 'fieldA',
      expected: true,
    },
    {
      expression: 'fieldA->fieldB',
      expected: false,
    },
    {
      expression: `{
        "documents": ^.documentReferences->
      }`,
      expected: false,
    },
    {
      expression: `{
        "count": count(fieldA->fieldB)
      }`,
      expected: false,
    },
    {
      expression: `{
        "value": {
          "innerValue": global::coalesce(fieldA->fieldB, fieldA)
        }.innerValue
      }`,
      expected: false,
    },
    {
      expression: `{
        "documents": *[_type == "type"]
      }`,
      expected: false,
    },
    {
      expression: `{
        "documents": *[_type == "type"] { _id }
      }`,
      expected: false,
    },
    {
      expression: `{
        "count": count(*[_type == "type"])
      }`,
      expected: false,
    },
    {
      expression: `{
        "value": {
          "innerValue": *[0...2]
        }.innerValue
      }`,
      expected: false,
    },
    {
      expression: `coalesce(null, true)`,
      expected: false,
    },
  ])(
    'identifies operations at any level that are incompatible with the Text Search API %#',
    ({expression, expected}) => {
      expect(groqExpressionIsTextSearchCompatible(parse(expression))).toBe(expected)
    },
  )
})

describe('groqExpressionContainsType', () => {
  it.each<{
    expression: string
    type: ExprNode['type'][]
    expected: boolean
  }>([
    {
      expression: 'fieldA->fieldB',
      type: ['Deref'],
      expected: true,
    },
    {
      expression: 'fieldA',
      type: ['Deref'],
      expected: false,
    },
    {
      expression: `{
        "array": ["a", "b", "c"]
      }`,
      type: ['Array'],
      expected: true,
    },
    {
      expression: `{
        "notArray": 1
      }`,
      type: ['Array'],
      expected: false,
    },
    {
      expression: `{
        "value": "a",
        "maybeValue": fieldA && fieldB
      }`,
      type: ['Value', 'And'],
      expected: true,
    },
    {
      expression: '*',
      type: ['Value', 'And'],
      expected: false,
    },
  ])('identifies specified types at any level %#', ({expression, type, expected}) => {
    expect(groqExpressionContainsType(parse(expression), type)).toBe(expected)
  })
})
