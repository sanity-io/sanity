import {rem} from '@sanity/ui'
import {describe, expect, it} from 'vitest'

import {
  EDITOR_FONT_SIZE,
  EDITOR_LINE_HEIGHT,
  editorContentPaddingTop,
  editorLineHeight,
  firstEditorLineStyle,
} from './editorMetrics'

const space = [0, 4, 8, 12, 20, 32, 52]

describe('editor metrics', () => {
  it('derives the line height from the text size', () => {
    expect(editorLineHeight).toBe(`${EDITOR_FONT_SIZE * EDITOR_LINE_HEIGHT}px`)
  })

  it('starts the first line flush under a header, and below a floating label otherwise', () => {
    expect(editorContentPaddingTop(space, true)).toBe('0px')
    expect(editorContentPaddingTop(space, false)).toBe(`${rem(space[5])}`)
  })

  it('sets text beside an editor in the box of its first line under a header', () => {
    expect(firstEditorLineStyle).toEqual({
      paddingTop: editorContentPaddingTop(space, true),
      lineHeight: editorLineHeight,
    })
  })
})
