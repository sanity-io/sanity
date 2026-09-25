import {describe, expect, it} from 'vitest'

import {getVisibleColumns, lineNumberDigits, type MeasurableEditorView} from './visibleColumns'

interface FakeEditorOptions {
  scrollerWidth: number
  guttersWidth: number
  charWidth: number
  /** The document's current line count */
  lines?: number
  /** The editor's visible height and how tall its document already is */
  scrollerHeight?: number
  scrollHeight?: number
  lineHeight?: number
}

/**
 * The DOM CodeMirror lays out, with the sizes jsdom cannot compute defined by hand: the
 * scroller's visible width and height, the gutters' width, and the insets the theme puts
 * around the text.
 */
function createFakeEditor({
  scrollerWidth,
  guttersWidth,
  charWidth,
  lines = 1,
  scrollerHeight = 1000,
  scrollHeight = scrollerHeight,
  lineHeight = 21,
}: FakeEditorOptions): MeasurableEditorView {
  const scrollDOM = document.createElement('div')
  Object.defineProperty(scrollDOM, 'clientWidth', {value: scrollerWidth})
  Object.defineProperty(scrollDOM, 'clientHeight', {value: scrollerHeight})
  Object.defineProperty(scrollDOM, 'scrollHeight', {value: scrollHeight})

  const gutters = document.createElement('div')
  gutters.className = 'cm-gutters'
  Object.defineProperty(gutters, 'offsetWidth', {value: guttersWidth})

  const contentDOM = document.createElement('div')
  contentDOM.className = 'cm-content'
  contentDOM.style.borderRight = '20px solid transparent'
  contentDOM.style.padding = '32px 0 4px'

  const line = document.createElement('div')
  line.className = 'cm-line'
  line.style.padding = '0 2px 0 12px'
  contentDOM.append(line)

  scrollDOM.append(gutters, contentDOM)
  return {
    scrollDOM,
    contentDOM,
    defaultCharacterWidth: charWidth,
    defaultLineHeight: lineHeight,
    state: {doc: {lines}},
  }
}

describe('lineNumberDigits', () => {
  it('reserves the digits of 9, 99, 999 for the gutter, as CodeMirror does', () => {
    expect(lineNumberDigits(1)).toBe(1)
    expect(lineNumberDigits(9)).toBe(1)
    expect(lineNumberDigits(10)).toBe(2)
    expect(lineNumberDigits(99)).toBe(2)
    expect(lineNumberDigits(100)).toBe(3)
  })
})

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

  it('gives up a column to the line-number gutter for every digit the document is about to gain', () => {
    const view = createFakeEditor({scrollerWidth: 380, guttersWidth: 40, charWidth: 10, lines: 1})
    expect(getVisibleColumns(view, {lines: 9})).toBe(30)
    expect(getVisibleColumns(view, {lines: 12})).toBe(29)
    expect(getVisibleColumns(view, {lines: 120})).toBe(28)
    // A document that shrinks to fewer digits gets the column back
    const tall = createFakeEditor({scrollerWidth: 380, guttersWidth: 50, charWidth: 10, lines: 12})
    expect(getVisibleColumns(tall, {lines: 3})).toBe(30)
  })

  it('reserves a classic scrollbar once the document will be taller than the editor', () => {
    // 200px of editor: 32 + 4px content padding leave room for 7 lines of 21px
    const fits = createFakeEditor({
      scrollerWidth: 380,
      guttersWidth: 40,
      charWidth: 10,
      scrollerHeight: 200,
    })
    expect(getVisibleColumns(fits, {lines: 7, scrollbarWidth: 15})).toBe(30)
    expect(getVisibleColumns(fits, {lines: 8, scrollbarWidth: 15})).toBe(29)
    // Overlaid scrollbars take nothing
    expect(getVisibleColumns(fits, {lines: 8, scrollbarWidth: 0})).toBe(30)
    // A scrollbar that is already there is already left out of the visible width
    const scrolling = createFakeEditor({
      scrollerWidth: 365,
      guttersWidth: 40,
      charWidth: 10,
      lines: 9,
      scrollerHeight: 200,
      scrollHeight: 225,
    })
    expect(getVisibleColumns(scrolling, {lines: 9, scrollbarWidth: 15})).toBe(29)
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
