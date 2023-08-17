import {parseJsonPath} from '../src/jsonpath/parse'
import {toPath} from '../src/jsonpath/toPath'
import {descend} from '../src/jsonpath/descend'
import {Expr, PathExpr} from '../src/jsonpath/types'

function headTailToStr(headTail: [Expr | null, PathExpr | null]): string {
  if (!headTail[0]) {
    return ''
  }

  return `<${toPath(headTail[0])}|${headTail[1] ? toPath(headTail[1]) : ''}]`
}

function descentStateToStr(descentState: [Expr | null, PathExpr | null][]): string {
  return `(${descentState.map((ht) => headTailToStr(ht)).join(', ')})`
}

function descendAll(
  descentState: [Expr | null, PathExpr | null][],
): [Expr | null, PathExpr | null][] {
  const result: [Expr | null, PathExpr | null][] = []
  descentState.forEach((ht) => {
    const tail = ht[1]
    if (tail) {
      result.push(...descend(tail))
    }
  })
  return result
}

function descentsFor(path: string) {
  const expr = parseJsonPath(path)
  if (!expr) {
    throw new Error(`Invalid JSON path: "${path}"`)
  }

  const result = []
  let state = descend(expr)
  while (state.length > 0) {
    result.push(descentStateToStr(state))
    state = descendAll(state)
  }
  return result
}

const cases: [string, string[]][] = [
  ['a.b.c', ['(<a|b.c])', '(<b|c])', '(<c|])']],
  ['[a,b].c', ['(<a|c], <b|c])', '(<c|], <c|])']],
  [
    '[0,1,2,3]._weak',
    [
      '(<[0]|_weak], <[1]|_weak], <[2]|_weak], <[3]|_weak])',
      '(<_weak|], <_weak|], <_weak|], <_weak|])',
    ],
  ],
  ['a[b.c, e].f', ['(<a|[b.c,e].f])', '(<b|c.f], <e|f])', '(<c|f], <f|])', '(<f|])']],
  ['members[age > 50].name', ['(<members|[age > 50].name])', '(<[age > 50]|name])', '(<name|])']],
  ['[]', []],
]

describe('descend', () => {
  test.each(cases)('Verify descent for %s', (path, expected) => {
    const descents = descentsFor(path)
    expect(descents).toEqual(expected)
  })
})
