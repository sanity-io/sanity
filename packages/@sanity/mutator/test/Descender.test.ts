import {test} from 'tap'
import parse from '../src/jsonpath/parse'
import Expression from '../src/jsonpath/Expression'
import Descender from '../src/jsonpath/Descender'
import PlainProbe from '../src/jsonpath/PlainProbe'

function inner(jsonpath) {
  const expr: any = parse(jsonpath)
  if (expr.type == 'union') {
    return expr.nodes[0]
  }
}

function expectDescendants(tap, descendants, expect) {
  const strs = descendants.map((d) => d.toString())
  tap.same(strs, expect)
}

test('Match attribute constraint on array', (tap) => {
  const d = new Descender(new Expression(inner('[a == 7]')), Expression.fromPath('[b,c].d'))
  tap.equal(d.toString(), '<[a == 7]|[b,c].d>')
  const iterated = d.iterate(
    new PlainProbe([
      {
        a: 9,
      },
      {
        a: 7,
      },
    ])
  )
  expectDescendants(tap, iterated, ['<[1]|[b,c].d>'])
  tap.end()
})

test('Match self constraint on array', (tap) => {
  const d = new Descender(new Expression(inner('[@ == 7]')), Expression.fromPath('[b,c].d'))
  tap.equal(d.toString(), '<[@ == 7]|[b,c].d>')
  const iterated = d.iterate(new PlainProbe([2, 3, 7, 8, 7]))
  expectDescendants(tap, iterated, ['<[2]|[b,c].d>', '<[4]|[b,c].d>'])
  tap.end()
})

test('Match constraint on object', (tap) => {
  const d = new Descender(new Expression(inner('[a == 7]')), Expression.fromPath('[b,c].d'))
  const mismatch = d.iterate(new PlainProbe({a: 9}))
  expectDescendants(tap, mismatch, [])
  const match = d.iterate(new PlainProbe({a: 7}))
  expectDescendants(tap, match, ['<b|d>', '<c|d>'])
  tap.end()
})

test((tap) => {
  const notRecursive = new Descender(Expression.fromPath('key'), Expression.fromPath('banana'))
  tap.equal(false, notRecursive.isRecursive())
  const recursive = new Descender(Expression.fromPath('..key'), Expression.fromPath('banana'))
  tap.equal(true, recursive.isRecursive())
  tap.end()
})

test((tap) => {
  const recursive = new Descender(Expression.fromPath('..a'), Expression.fromPath('b.c'))
  const extracted = recursive.extractRecursives()
  expectDescendants(tap, extracted, ['<a|b.c>'])
  tap.end()
})

test((tap) => {
  const d1 = new Descender(Expression.fromPath('a'), Expression.fromPath('b.c'))
  const d2 = d1.descend()
  expectDescendants(tap, d2, ['<b|c>'])
  const d3 = d2[0].descend()
  expectDescendants(tap, d3, ['<c|>'])
  const d4 = d3[0].descend()
  expectDescendants(tap, d4, ['<|>'])
  tap.end()
})
