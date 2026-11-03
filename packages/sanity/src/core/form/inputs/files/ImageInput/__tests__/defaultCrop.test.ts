import {describe, expect, test} from 'vitest'

import {set, unset} from '../../../../patch/patch'
import {PatchEvent} from '../../../../patch/PatchEvent'
import {withDefaultCrop} from '../utils/defaultCrop'

const WIDE_REF = 'image-a75b03fdd5b5fa36947bf2b776a542e0c940f682-2000x1000-jpg'
const SQUARE_REF = 'image-a75b03fdd5b5fa36947bf2b776a542e0c940f682-1000x1000-jpg'

function setAsset(ref: string) {
  return set({_type: 'reference', _ref: ref}, ['asset'])
}

describe('withDefaultCrop', () => {
  test('writes the default crop right after the patch that sets an off-ratio asset', () => {
    const {patches} = withDefaultCrop(
      [unset(['crop']), setAsset(WIDE_REF), set(100, ['_upload', 'progress'])],
      1,
    )
    expect(patches.map(({path}) => path.join('.'))).toEqual([
      'crop',
      'asset',
      'crop',
      '_upload.progress',
    ])
    expect(patches[2]).toMatchObject({
      type: 'set',
      value: {_type: 'sanity.imageCrop', left: 0.25, right: 0.25, top: 0, bottom: 0},
    })
  })

  test('accepts a single patch and a patch event', () => {
    expect(withDefaultCrop(setAsset(WIDE_REF), 1).patches).toHaveLength(2)
    expect(withDefaultCrop(PatchEvent.from(setAsset(WIDE_REF)), 1).patches).toHaveLength(2)
  })

  test('clears the crop when the asset already fits', () => {
    const {patches} = withDefaultCrop([setAsset(SQUARE_REF)], 1)
    expect(patches.map(({type, path}) => `${type} ${path.join('.')}`)).toEqual([
      'set asset',
      'unset crop',
    ])
  })

  test('writes no crop without an aspect ratio', () => {
    expect(withDefaultCrop([setAsset(WIDE_REF)], undefined).patches).toHaveLength(1)
  })

  test('leaves patches that do not set the asset alone', () => {
    const patches = [
      set({_type: 'reference', _ref: WIDE_REF}, ['media']),
      set(WIDE_REF, ['asset', '_ref']),
      unset(['asset']),
    ]
    expect(withDefaultCrop(patches, 1).patches).toEqual(patches)
  })
})
