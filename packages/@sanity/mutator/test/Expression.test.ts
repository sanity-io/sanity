import {expect, test} from 'vitest'

import {Expression} from '../src/jsonpath/Expression'
import {parseJsonPath} from '../src/jsonpath/parse'
import {PlainProbe} from '../src/jsonpath/PlainProbe'
import {type PathExpr, type UnionExpr} from '../src/jsonpath/types'

function parseAsPath(path: string): PathExpr | UnionExpr {
  const parsed = parseJsonPath(path)
  if (!('nodes' in parsed)) {
    throw new Error(`Expected parsed path to return "path" or "union", but got "${parsed.type}"`)
  }
  return parsed
}

test('Expression union', () => {
  const expression = new Expression(parseJsonPath('[1,2,3]'))
  expect(false).toEqual(expression.isPath())
  expect(true).toEqual(expression.isUnion())
  expect(true).toEqual(expression.isCollection())
  expect(false).toEqual(expression.isAttributeReference())
  expect(1).toEqual(expression.pathNodes().length)
})

test('Expression path', () => {
  const path1 = new Expression(parseJsonPath('a.b.c'))
  const path2 = new Expression(parseJsonPath('d.e.f'))
  const union = new Expression(parseJsonPath('[e,f]'))
  const simple = new Expression(parseJsonPath('a'))
  const concatCase = (a: Expression, b: Expression, expected: string) => {
    expect(a.concat(b).toString()).toEqual(expected)
  }
  concatCase(path1, path2, 'a.b.c.d.e.f')
  concatCase(union, path2, '[e,f].d.e.f')
  concatCase(simple, path2, 'a.d.e.f')
})

test('Expression constraints', () => {
  const selfCompare = new Expression(parseAsPath('[@ < 8]').nodes[0])
  expect(true).toEqual(selfCompare.constraintTargetIsSelf())
  expect(false).toEqual(selfCompare.constraintTargetIsAttribute())
  expect(true).toEqual(selfCompare.testConstraint(new PlainProbe(7)))
  expect(false).toEqual(selfCompare.testConstraint(new PlainProbe(8)))
  expect(false).toEqual(selfCompare.testConstraint(new PlainProbe({a: 7})))

  const attrCompare = new Expression(parseAsPath('[banana == "rotten"]').nodes[0])
  expect(false).toEqual(attrCompare.constraintTargetIsSelf())
  expect(true).toEqual(attrCompare.constraintTargetIsAttribute())
  expect(false).toEqual(attrCompare.testConstraint(new PlainProbe({banana: 'nice'})))
  expect(true).toEqual(attrCompare.testConstraint(new PlainProbe({banana: 'rotten'})))
  expect(false).toEqual(attrCompare.testConstraint(new PlainProbe(7)))

  const numCompare = new Expression(parseAsPath('[number == 123]').nodes[0])
  expect(false).toEqual(numCompare.constraintTargetIsSelf())
  expect(true).toEqual(numCompare.constraintTargetIsAttribute())
  expect(false).toEqual(numCompare.testConstraint(new PlainProbe({number: '123'})))
  expect(true).toEqual(numCompare.testConstraint(new PlainProbe({number: 123})))
  expect(false).toEqual(numCompare.testConstraint(new PlainProbe(7)))

  const strNumCompare = new Expression(parseAsPath('[number == "123"]').nodes[0])
  expect(false).toEqual(strNumCompare.constraintTargetIsSelf())
  expect(true).toEqual(strNumCompare.constraintTargetIsAttribute())
  expect(false).toEqual(strNumCompare.testConstraint(new PlainProbe({number: 123})))
  expect(true).toEqual(strNumCompare.testConstraint(new PlainProbe({number: '123'})))
  expect(false).toEqual(strNumCompare.testConstraint(new PlainProbe(7)))
})

test('Expression toIndicies', () => {
  const range = new Expression(parseAsPath('[2:5]').nodes[0])
  expect([2, 3, 4]).toEqual(
    range.toIndicies(new PlainProbe(['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a'])),
  )
  const index = new Expression(parseAsPath('[2]').nodes[0])
  expect([2]).toEqual(index.toIndicies(new PlainProbe(['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a'])))
})

// Regression for https://github.com/sanity-io/sanity/issues/5313.
//
// The parser used to only accept a single-attribute LHS in a filter, and the
// evaluator used to throw `Constraint target path not supported` for any
// non-attribute LHS. Both surfaces now accept a dotted-attribute LHS like
// `asset._ref`. These tests pin the runtime behaviour against `PlainProbe`,
// covering equality, deep paths, the existence operator (`?`), and the
// short-circuit cases (missing key, non-object container mid-walk).
test('Expression constraints with dotted-attribute LHS — issue #5313', () => {
  // `asset._ref == "image-abc"` — the exact shape the user reported.
  const refCompare = new Expression(parseAsPath('[asset._ref == "image-abc"]').nodes[0])
  expect(true).toEqual(refCompare.testConstraint(new PlainProbe({asset: {_ref: 'image-abc'}})))
  expect(false).toEqual(refCompare.testConstraint(new PlainProbe({asset: {_ref: 'image-xyz'}})))

  // Missing intermediate attribute short-circuits to false (does NOT throw).
  expect(false).toEqual(refCompare.testConstraint(new PlainProbe({asset: null})))
  expect(false).toEqual(refCompare.testConstraint(new PlainProbe({})))

  // Non-object container mid-walk short-circuits to false.
  expect(false).toEqual(refCompare.testConstraint(new PlainProbe({asset: 'not-an-object'})))

  // Deeper chains work just as well.
  const deep = new Expression(parseAsPath('[meta.author.name == "jane"]').nodes[0])
  expect(true).toEqual(deep.testConstraint(new PlainProbe({meta: {author: {name: 'jane'}}})))
  expect(false).toEqual(deep.testConstraint(new PlainProbe({meta: {author: {name: 'bob'}}})))
  expect(false).toEqual(deep.testConstraint(new PlainProbe({meta: {author: {}}})))

  // Existence constraint `?` over a dotted LHS — the leaf must exist and be
  // primitive for the constraint to be true.
  const exists = new Expression(parseAsPath('[asset._ref?]').nodes[0])
  expect(true).toEqual(exists.testConstraint(new PlainProbe({asset: {_ref: 'image-abc'}})))
  expect(false).toEqual(exists.testConstraint(new PlainProbe({asset: {}})))
  expect(false).toEqual(exists.testConstraint(new PlainProbe({})))
})
