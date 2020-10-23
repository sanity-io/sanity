import {test} from 'tap'
import parse from '../src/jsonpath/parse'
import Expression from '../src/jsonpath/Expression'
import PlainProbe from '../src/jsonpath/PlainProbe'

test('Expression union', (tap) => {
  const expression = new Expression(parse('[1,2,3]'))
  tap.equal(false, expression.isPath())
  tap.equal(true, expression.isUnion())
  tap.equal(true, expression.isCollection())
  tap.equal(false, expression.isAttributeReference())
  tap.equal(1, expression.pathNodes().length)
  tap.end()
})

test('Expression path', (tap) => {
  const path1 = new Expression(parse('a.b.c'))
  const path2 = new Expression(parse('d.e.f'))
  const union = new Expression(parse('[e,f]'))
  const simple = new Expression(parse('a'))
  const concatCase = (a, b, expect) => {
    tap.equal(a.concat(b).toString(), expect, `concat ${a} ${b}`)
  }
  concatCase(path1, path2, 'a.b.c.d.e.f')
  concatCase(union, path2, '[e,f].d.e.f')
  concatCase(simple, path2, 'a.d.e.f')
  tap.end()
})

test('Expression constraints', (tap) => {
  const selfCompare = new Expression(parse('[@ < 8]').nodes[0])
  tap.equal(true, selfCompare.constraintTargetIsSelf())
  tap.equal(false, selfCompare.constraintTargetIsAttribute())
  tap.equal(true, selfCompare.testConstraint(new PlainProbe(7)))
  tap.equal(false, selfCompare.testConstraint(new PlainProbe(8)))
  tap.equal(false, selfCompare.testConstraint(new PlainProbe({a: 7})))

  const attrCompare = new Expression(parse('[banana == "rotten"]').nodes[0])
  tap.equal(false, attrCompare.constraintTargetIsSelf())
  tap.equal(true, attrCompare.constraintTargetIsAttribute())
  tap.equal(false, attrCompare.testConstraint(new PlainProbe({banana: 'nice'})))
  tap.equal(true, attrCompare.testConstraint(new PlainProbe({banana: 'rotten'})))
  tap.equal(false, attrCompare.testConstraint(new PlainProbe(7)))

  const numCompare = new Expression(parse('[number == 123]').nodes[0])
  tap.equal(false, numCompare.constraintTargetIsSelf())
  tap.equal(true, numCompare.constraintTargetIsAttribute())
  tap.equal(false, numCompare.testConstraint(new PlainProbe({number: '123'})))
  tap.equal(true, numCompare.testConstraint(new PlainProbe({number: 123})))
  tap.equal(false, numCompare.testConstraint(new PlainProbe(7)))

  const strNumCompare = new Expression(parse('[number == "123"]').nodes[0])
  tap.equal(false, strNumCompare.constraintTargetIsSelf())
  tap.equal(true, strNumCompare.constraintTargetIsAttribute())
  tap.equal(false, strNumCompare.testConstraint(new PlainProbe({number: 123})))
  tap.equal(true, strNumCompare.testConstraint(new PlainProbe({number: '123'})))
  tap.equal(false, strNumCompare.testConstraint(new PlainProbe(7)))

  tap.end()
})

test('Expression toIndicies', (tap) => {
  const range = new Expression(parse('[2:5]').nodes[0])
  tap.same([2, 3, 4], range.toIndicies(new PlainProbe(['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a'])))
  const index = new Expression(parse('[2]').nodes[0])
  tap.same([2], index.toIndicies(new PlainProbe(['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a'])))
  tap.end()
})
