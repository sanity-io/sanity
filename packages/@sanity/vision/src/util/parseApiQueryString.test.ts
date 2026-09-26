import {describe, expect, it} from 'vitest'

import {parseApiQueryString} from './parseApiQueryString'

describe('parseApiQueryString', () => {
  it('splits a query string into the query, its parameters and the perspective', () => {
    const parsed = parseApiQueryString(
      new URLSearchParams(
        'query=*%5B_id+%3D%3D+%24id%5D&%24id=%22a%22&%24limit=10&perspective=drafts&tag=vision',
      ),
    )

    expect(parsed).toEqual({
      query: '*[_id == $id]',
      params: {id: 'a', limit: 10},
      options: {perspective: 'drafts'},
    })
  })

  it('keeps a $__proto__ parameter as a parameter of its own', () => {
    const {params} = parseApiQueryString(
      new URLSearchParams('query=*&%24__proto__=%7B%22polluted%22%3Atrue%7D&%24id=1'),
    )

    expect(Object.hasOwn(params, '__proto__')).toBe(true)
    expect(Object.getPrototypeOf(params)).toBe(Object.prototype)
    expect(Object.entries(params)).toEqual([
      ['__proto__', {polluted: true}],
      ['id', 1],
    ])
    expect(JSON.stringify(params)).toBe('{"__proto__":{"polluted":true},"id":1}')
  })
})
