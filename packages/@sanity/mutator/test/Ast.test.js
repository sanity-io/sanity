import {test} from 'tap'
import parse from '../src/jsonpath/parse'
import Ast from '../src/jsonpath/Ast'
import PlainProbe from '../src/jsonpath/PlainProbe'

test('Ast union', tap => {
  let ast = new Ast(parse("[1,2,3]"))
  tap.equal(false, ast.isPath())
  tap.equal(true, ast.isUnion())
  tap.equal(true, ast.isCollection())
  tap.equal(false, ast.isAttributeReference())
  tap.equal(1, ast.pathNodes().length)
  tap.end()
})

test('Ast path', tap => {
  let path1 = new Ast(parse('a.b.c'))
  let path2 = new Ast(parse('d.e.f'))
  let union = new Ast(parse('[e,f]'))
  let simple = new Ast(parse('a'))
  const concatCase = (a, b, expect) => {
    tap.equal(a.concat(b).toString(), expect,
      `concat ${a} ${b}`)
  }
  concatCase(path1, path2, 'a.b.c.d.e.f')
  concatCase(union, path2, '[e,f].d.e.f')
  concatCase(simple, path2, 'a.d.e.f')
  tap.end()
})

test('Ast constraints', tap => {
  const selfCompare = new Ast(parse('[@ < 8]').nodes[0])
  tap.equal(true, selfCompare.constraintTargetIsSelf())
  tap.equal(false, selfCompare.constraintTargetIsAttribute())
  tap.equal(true, selfCompare.testConstraint(new PlainProbe(7)))
  tap.equal(false, selfCompare.testConstraint(new PlainProbe(8)))
  tap.equal(false, selfCompare.testConstraint(new PlainProbe({a: 7})))

  const attrCompare = new Ast(parse('[banana == "rotten"]').nodes[0])
  tap.equal(false, attrCompare.constraintTargetIsSelf())
  tap.equal(true, attrCompare.constraintTargetIsAttribute())
  tap.equal(false, attrCompare.testConstraint(new PlainProbe({banana: 'nice'})))
  tap.equal(true, attrCompare.testConstraint(new PlainProbe({banana: 'rotten'})))
  tap.equal(false, attrCompare.testConstraint(new PlainProbe(7)))

  tap.end()
})

test('Ast toIndicies', tap => {
  const range = new Ast(parse('[2:5]').nodes[0])
  tap.same([2, 3, 4], range.toIndicies(new PlainProbe(['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a'])))
  const index = new Ast(parse('[2]').nodes[0])
  tap.same([2], index.toIndicies(new PlainProbe(['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a'])))
  tap.end()
})
