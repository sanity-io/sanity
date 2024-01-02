import {assignId} from '../assignId'

describe('assignId', () => {
  it('takes in an object and assigns it an ID, on subsequent requests, the same ID will be returned', () => {
    const foo = {}
    const bar = {}
    const baz = {}

    const fooAlias = foo

    expect(assignId(foo)).toBe(assignId(foo))
    expect(assignId(fooAlias)).toBe(assignId(foo))
    expect(assignId(bar)).toBe(assignId(bar))
    expect(assignId(baz)).toBe(assignId(baz))
  })
})
