import parse from '../src/jsonpath/parse'
import toPath from '../src/jsonpath/toPath'
import descend from '../src/jsonpath/descend'

function headTailToStr(headTail) {
  return `<${toPath(headTail[0])}|${headTail[1] ? toPath(headTail[1]) : ''}]`
}

function descentStateToStr(descentState): string {
  return `(${descentState.map((ht) => headTailToStr(ht)).join(', ')})`
}

function descendAll(descentState): any[] {
  const result = []
  descentState.forEach((ht) => {
    const tail = ht[1]
    if (tail) {
      result.push(...descend(tail))
    }
  })
  return result
}

function descentsFor(path) {
  const expr = parse(path)
  const result = []
  let state = descend(expr)
  while (state.length > 0) {
    result.push(descentStateToStr(state))
    state = descendAll(state)
  }
  return result
}

const cases = {
  'a.b.c': ['(<a|b.c])', '(<b|c])', '(<c|])'],
  '[a,b].c': ['(<a|c], <b|c])', '(<c|], <c|])'],
  '[0,1,2,3]._weak': [
    '(<[0]|_weak], <[1]|_weak], <[2]|_weak], <[3]|_weak])',
    '(<_weak|], <_weak|], <_weak|], <_weak|])',
  ],
  'a[b.c, e].f': ['(<a|[b.c,e].f])', '(<b|c.f], <e|f])', '(<c|f], <f|])', '(<f|])'],
  'members[age > 50].name': ['(<members|[age > 50].name])', '(<[age > 50]|name])', '(<name|])'],
  '[]': [],
}

describe('descend', () => {
  Object.keys(cases).forEach((path) => {
    test(`Verify descent for ${path}`, () => {
      const descents = descentsFor(path)
      // console.log(path, descents)
      expect(descents).toEqual(cases[path])
    })
  })
})
