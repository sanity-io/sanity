import {parseJsonPath} from '../src/jsonpath/parse'
import {Expression} from '../src/jsonpath/Expression'
import {PlainProbe} from '../src/jsonpath/PlainProbe'
import {PathExpr, UnionExpr} from '../src/jsonpath/types'

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
