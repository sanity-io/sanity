import parse from '../src/jsonpath/parse'
import Expression from '../src/jsonpath/Expression'
import PlainProbe from '../src/jsonpath/PlainProbe'

test('Expression union', () => {
  const expression = new Expression(parse('[1,2,3]'))
  expect(false).toEqual(expression.isPath())
  expect(true).toEqual(expression.isUnion())
  expect(true).toEqual(expression.isCollection())
  expect(false).toEqual(expression.isAttributeReference())
  expect(1).toEqual(expression.pathNodes().length)
})

test('Expression path', () => {
  const path1 = new Expression(parse('a.b.c'))
  const path2 = new Expression(parse('d.e.f'))
  const union = new Expression(parse('[e,f]'))
  const simple = new Expression(parse('a'))
  const concatCase = (a, b, expected) => {
    expect(a.concat(b).toString()).toEqual(expected)
  }
  concatCase(path1, path2, 'a.b.c.d.e.f')
  concatCase(union, path2, '[e,f].d.e.f')
  concatCase(simple, path2, 'a.d.e.f')
})

test('Expression constraints', () => {
  const selfCompare = new Expression(parse('[@ < 8]').nodes[0])
  expect(true).toEqual(selfCompare.constraintTargetIsSelf())
  expect(false).toEqual(selfCompare.constraintTargetIsAttribute())
  expect(true).toEqual(selfCompare.testConstraint(new PlainProbe(7)))
  expect(false).toEqual(selfCompare.testConstraint(new PlainProbe(8)))
  expect(false).toEqual(selfCompare.testConstraint(new PlainProbe({a: 7})))

  const attrCompare = new Expression(parse('[banana == "rotten"]').nodes[0])
  expect(false).toEqual(attrCompare.constraintTargetIsSelf())
  expect(true).toEqual(attrCompare.constraintTargetIsAttribute())
  expect(false).toEqual(attrCompare.testConstraint(new PlainProbe({banana: 'nice'})))
  expect(true).toEqual(attrCompare.testConstraint(new PlainProbe({banana: 'rotten'})))
  expect(false).toEqual(attrCompare.testConstraint(new PlainProbe(7)))

  const numCompare = new Expression(parse('[number == 123]').nodes[0])
  expect(false).toEqual(numCompare.constraintTargetIsSelf())
  expect(true).toEqual(numCompare.constraintTargetIsAttribute())
  expect(false).toEqual(numCompare.testConstraint(new PlainProbe({number: '123'})))
  expect(true).toEqual(numCompare.testConstraint(new PlainProbe({number: 123})))
  expect(false).toEqual(numCompare.testConstraint(new PlainProbe(7)))

  const strNumCompare = new Expression(parse('[number == "123"]').nodes[0])
  expect(false).toEqual(strNumCompare.constraintTargetIsSelf())
  expect(true).toEqual(strNumCompare.constraintTargetIsAttribute())
  expect(false).toEqual(strNumCompare.testConstraint(new PlainProbe({number: 123})))
  expect(true).toEqual(strNumCompare.testConstraint(new PlainProbe({number: '123'})))
  expect(false).toEqual(strNumCompare.testConstraint(new PlainProbe(7)))
})

test('Expression toIndicies', () => {
  const range = new Expression(parse('[2:5]').nodes[0])
  expect([2, 3, 4]).toEqual(
    range.toIndicies(new PlainProbe(['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a']))
  )
  const index = new Expression(parse('[2]').nodes[0])
  expect([2]).toEqual(index.toIndicies(new PlainProbe(['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a'])))
})
