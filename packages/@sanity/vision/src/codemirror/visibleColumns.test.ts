import {describe, expect, it} from 'vitest'

import {getVisibleColumns, type MeasurableEditorView} from './visibleColumns'

interface FakeEditorOptions {
  scrollerWidth: number
  guttersWidth: number
  charWidth: number
}

/**
 * The DOM CodeMirror lays out, with the widths jsdom cannot compute defined by hand: the
 * scroller's visible width, the gutters' width, and the insets the theme puts around the text.
 */
function createFakeEditor({
  scrollerWidth,
  guttersWidth,
  charWidth,
}: FakeEditorOptions): MeasurableEditorView {
  const scrollDOM = document.createElement('div')
  Object.defineProperty(scrollDOM, 'clientWidth', {value: scrollerWidth})

  const gutters = document.createElement('div')
  gutters.className = 'cm-gutters'
  Object.defineProperty(gutters, 'offsetWidth', {value: guttersWidth})

  const contentDOM = document.createElement('div')
  contentDOM.className = 'cm-content'
  contentDOM.style.borderRight = '20px solid transparent'
  contentDOM.style.padding = '4px 0'

  const line = document.createElement('div')
  line.className = 'cm-line'
  line.style.padding = '0 2px 0 12px'
  contentDOM.append(line)

  scrollDOM.append(gutters, contentDOM)
  return {scrollDOM, contentDOM, defaultCharacterWidth: charWidth}
}

describe('getVisibleColumns', () => {
  it('counts the characters that fit between the gutters and the text insets', () => {
    // 600 - 40 gutters - 20 content border - 14 line padding = 526px of text, at 9.6px a character
    const view = createFakeEditor({scrollerWidth: 600, guttersWidth: 40, charWidth: 9.6})
    expect(getVisibleColumns(view)).toBe(54)
  })

  it('rounds down, so the last column is never partly hidden', () => {
    // 306px of text at 10px a character is 30.6 characters
    const view = createFakeEditor({scrollerWidth: 380, guttersWidth: 40, charWidth: 10})
    expect(getVisibleColumns(view)).toBe(30)
  })

  it('has no answer for an editor without layout', () => {
    // Hidden (display: none), so nothing has a width
    expect(
      getVisibleColumns(createFakeEditor({scrollerWidth: 0, guttersWidth: 0, charWidth: 9.6})),
    ).toBeUndefined()
    // Narrower than its own insets
    expect(
      getVisibleColumns(createFakeEditor({scrollerWidth: 30, guttersWidth: 40, charWidth: 9.6})),
    ).toBeUndefined()
    // The font has not been measured yet
    expect(
      getVisibleColumns(createFakeEditor({scrollerWidth: 600, guttersWidth: 40, charWidth: 0})),
    ).toBeUndefined()
  })
})
