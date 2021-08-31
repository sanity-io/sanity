import parse from '../src/jsonpath/parse'
import Expression from '../src/jsonpath/Expression'
import Descender from '../src/jsonpath/Descender'
import PlainProbe from '../src/jsonpath/PlainProbe'

// eslint-disable-next-line consistent-return
function inner(jsonpath) {
  const expr: any = parse(jsonpath)
  if (expr.type == 'union') {
    return expr.nodes[0]
  }
}

function expectDescendants(descendants, expected) {
  const strs = descendants.map((d) => d.toString())
  expect(strs).toEqual(expected)
}

test('Match attribute constraint on array', () => {
  const d = new Descender(new Expression(inner('[a == 7]')), Expression.fromPath('[b,c].d'))
  expect(d.toString()).toBe('<[a == 7]|[b,c].d>')
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
  expectDescendants(iterated, ['<[1]|[b,c].d>'])
})

test('Match self constraint on array', () => {
  const d = new Descender(new Expression(inner('[@ == 7]')), Expression.fromPath('[b,c].d'))
  expect(d.toString()).toBe('<[@ == 7]|[b,c].d>')
  const iterated = d.iterate(new PlainProbe([2, 3, 7, 8, 7]))
  expectDescendants(iterated, ['<[2]|[b,c].d>', '<[4]|[b,c].d>'])
})

test('Match constraint on object', () => {
  const d = new Descender(new Expression(inner('[a == 7]')), Expression.fromPath('[b,c].d'))
  const mismatch = d.iterate(new PlainProbe({a: 9}))
  expectDescendants(mismatch, [])
  const match = d.iterate(new PlainProbe({a: 7}))
  expectDescendants(match, ['<b|d>', '<c|d>'])
})

test('descend #1', () => {
  const notRecursive = new Descender(Expression.fromPath('key'), Expression.fromPath('banana'))
  expect(false).toBe(notRecursive.isRecursive())
  const recursive = new Descender(Expression.fromPath('..key'), Expression.fromPath('banana'))
  expect(true).toBe(recursive.isRecursive())
})

test('descend #2', () => {
  const recursive = new Descender(Expression.fromPath('..a'), Expression.fromPath('b.c'))
  const extracted = recursive.extractRecursives()
  expectDescendants(extracted, ['<a|b.c>'])
})

test('descend #3', () => {
  const d1 = new Descender(Expression.fromPath('a'), Expression.fromPath('b.c'))
  const d2 = d1.descend()
  expectDescendants(d2, ['<b|c>'])
  const d3 = d2[0].descend()
  expectDescendants(d3, ['<c|>'])
  const d4 = d3[0].descend()
  expectDescendants(d4, ['<|>'])
})
