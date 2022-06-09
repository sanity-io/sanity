import {createMultiKeyWeakMap} from '../createMultiKeyWeakMap'

describe('createMultiKeyWeakMap', () => {
  it('returns a multi-key weakmap', () => {
    const multiKeyWeakMap = createMultiKeyWeakMap()

    const a = {_: 'a'}
    const b = {_: 'b'}
    const c = {_: 'c'}

    const ab = {_: 'ab'}
    const abc = {_: 'abc'}
    const bc = {_: 'bc'}
    const ac = {_: 'ac'}

    multiKeyWeakMap.set([a, b], ab)
    multiKeyWeakMap.set([a, b, c], abc)
    multiKeyWeakMap.set([b, c], bc)
    multiKeyWeakMap.set([a, c], ac)

    expect(multiKeyWeakMap.get([a, b])).toBe(ab)
    // order doesn't matter
    expect(multiKeyWeakMap.get([b, a])).toBe(ab)

    expect(multiKeyWeakMap.get([b, a, c])).toBe(abc)
    expect(multiKeyWeakMap.get([b, c])).toBe(bc)
    expect(multiKeyWeakMap.get([a, c])).toBe(ac)
  })
})
