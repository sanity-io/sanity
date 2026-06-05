import {describe, expect, it} from 'vitest'

import {applyAll} from './applyPatch'
import {insert, unset} from './patch'

describe('_arrayApply insert "replace"', () => {
  it('replaces an item matched by _key', () => {
    const value = [
      {_key: 'a', label: 'old'},
      {_key: 'b', label: 'keep'},
    ]

    const result = applyAll(value, [insert([{_key: 'a', label: 'new'}], 'replace', [{_key: 'a'}])])

    expect(result).toEqual([
      {_key: 'a', label: 'new'},
      {_key: 'b', label: 'keep'},
    ])
  })

  it('replaces an item matched by a nested attribute constraint', () => {
    const value = [
      {_key: 'a', asset: {_ref: 'image-1'}, label: 'old'},
      {_key: 'b', asset: {_ref: 'image-2'}, label: 'keep'},
    ]

    const result = applyAll(value, [
      insert([{_key: 'a', asset: {_ref: 'image-1'}, label: 'new'}], 'replace', [
        {asset: {_ref: 'image-1'}},
      ]),
    ])

    expect(result).toEqual([
      {_key: 'a', asset: {_ref: 'image-1'}, label: 'new'},
      {_key: 'b', asset: {_ref: 'image-2'}, label: 'keep'},
    ])
  })

  it('supports replacing a single item with multiple items', () => {
    const value = [
      {_key: 'a', label: 'old'},
      {_key: 'b', label: 'keep'},
    ]

    const result = applyAll(value, [
      insert([{_key: 'a1', label: 'new-1'}, {_key: 'a2', label: 'new-2'}], 'replace', [
        {_key: 'a'},
      ]),
    ])

    expect(result).toEqual([
      {_key: 'a1', label: 'new-1'},
      {_key: 'a2', label: 'new-2'},
      {_key: 'b', label: 'keep'},
    ])
  })

  it('returns the array unchanged when the constraint matches nothing', () => {
    const value = [{_key: 'a', label: 'old'}]

    const result = applyAll(value, [
      insert([{_key: 'x', label: 'new'}], 'replace', [{_key: 'missing'}]),
    ])

    expect(result).toEqual([{_key: 'a', label: 'old'}])
  })

  it('does not mutate the original array', () => {
    const value = [{_key: 'a', label: 'old'}]

    applyAll(value, [insert([{_key: 'a', label: 'new'}], 'replace', [{_key: 'a'}])])

    expect(value).toEqual([{_key: 'a', label: 'old'}])
  })
})

describe('_arrayApply insert before/after (regression guard)', () => {
  it('still inserts after a matched item', () => {
    const value = [
      {_key: 'a', label: 'a'},
      {_key: 'b', label: 'b'},
    ]

    const result = applyAll(value, [insert([{_key: 'c', label: 'c'}], 'after', [{_key: 'a'}])])

    expect(result).toEqual([
      {_key: 'a', label: 'a'},
      {_key: 'c', label: 'c'},
      {_key: 'b', label: 'b'},
    ])
  })

  it('still unsets a matched item', () => {
    const value = [
      {_key: 'a', label: 'a'},
      {_key: 'b', label: 'b'},
    ]

    const result = applyAll(value, [unset([{_key: 'a'}])])

    expect(result).toEqual([{_key: 'b', label: 'b'}])
  })
})
