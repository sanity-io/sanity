import {describe, expect, it} from 'vitest'

import {set, setIfMissing} from '../../../patch/patch'
import {getMissingKeyPatches} from './missingKeyPatches'

const createKey = () => 'generated'

describe('getMissingKeyPatches', () => {
  it('returns no patch for an item with a usable key', () => {
    expect(getMissingKeyPatches([{_key: 'abc'}], createKey)).toEqual([])
  })

  it('uses setIfMissing when the _key property is absent', () => {
    expect(getMissingKeyPatches([{_key: 'abc'}, {title: 'no key'}], createKey)).toEqual([
      setIfMissing('generated', [1, '_key']),
    ])
  })

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['an empty string', ''],
  ])('uses set when _key is %s', (_label, value) => {
    expect(getMissingKeyPatches([{_key: 'abc'}, {_key: value}], createKey)).toEqual([
      set('generated', [1, '_key']),
    ])
  })

  it('patches each unusable item at its own index', () => {
    expect(getMissingKeyPatches([{}, {_key: 'abc'}, {_key: null}], createKey)).toEqual([
      setIfMissing('generated', [0, '_key']),
      set('generated', [2, '_key']),
    ])
  })
})
