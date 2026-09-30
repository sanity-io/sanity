import {describe, expect, it} from 'vitest'

import {validateStructureNodeId} from '../validateStructureNodeId'

describe('validateStructureNodeId', () => {
  it.each(['foo', 'foo-bar_baz.qux', 'Foo123', 'edit__foo'])('accepts %j', (id) => {
    expect(validateStructureNodeId(id)).toEqual({isValid: true})
  })

  it.each([
    [undefined, 'undefined'],
    [123, 'number'],
    [null, 'object'],
  ])('rejects non-string id %j', (id, type) => {
    expect(validateStructureNodeId(id)).toEqual({isValid: false, reason: 'invalidType', type})
  })

  it.each([
    ['foo bar', ' '],
    ['foo/bar', '/'],
    ['foo;bar:baz', ';'],
  ])('rejects %j, reporting the first disallowed character', (id, character) => {
    expect(validateStructureNodeId(id)).toEqual({
      isValid: false,
      reason: 'disallowedCharacter',
      character,
    })
  })

  it('rejects ids starting with the reserved prefix', () => {
    expect(validateStructureNodeId('__edit__foo')).toEqual({
      isValid: false,
      reason: 'reservedPrefix',
      prefix: '__edit__',
    })
  })
})
