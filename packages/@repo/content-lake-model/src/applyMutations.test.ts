import {describe, expect, it} from 'vitest'

import {applyMutations} from './applyMutations'
import {ContentLakeError} from './contentLakeError'

const INDEX = {a: {_id: 'a', _type: 'doc', count: 10}}

describe('applyMutations', () => {
  it('increments with inc', () => {
    expect(applyMutations(INDEX, [{patch: {id: 'a', inc: {count: 2}}}]).a?.count).toBe(12)
  })

  it('decrements with dec', () => {
    expect(applyMutations(INDEX, [{patch: {id: 'a', dec: {count: 3}}}]).a?.count).toBe(7)
  })

  it('applies inc and dec in one patch', () => {
    const index = {a: {_id: 'a', _type: 'doc', up: 1, down: 1}}
    const {a} = applyMutations(index, [{patch: {id: 'a', inc: {up: 1}, dec: {down: 1}}}])
    expect(a).toMatchObject({up: 2, down: 0})
  })

  it('wraps a failed apply in a 400', () => {
    const patchMissing = () => applyMutations({}, [{patch: {id: 'missing', set: {title: 'x'}}}])
    expect(patchMissing).toThrow(ContentLakeError)
    expect(patchMissing).toThrow(expect.objectContaining({statusCode: 400}))
  })
})
