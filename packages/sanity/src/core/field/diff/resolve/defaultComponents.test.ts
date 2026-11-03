import {describe, expect, it} from 'vitest'

import {FileFieldDiff} from '../../types/file/diff/FileFieldDiff'
import {ImageFieldDiff} from '../../types/image/diff/ImageFieldDiff'
import {PTDiff} from '../../types/portableText/diff/PTDiff'
import {defaultComponents} from './defaultComponents'

describe('defaultComponents', () => {
  it('exposes the registered block, image and file diff components after the ChangeList import cycle', () => {
    expect(defaultComponents.block).toBe(PTDiff)
    expect(defaultComponents.image).toBe(ImageFieldDiff)
    expect(defaultComponents.file).toBe(FileFieldDiff)
  })
})
