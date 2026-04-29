import {describe, expect, it} from 'vitest'

import {buildSegments} from './helpers'
import * as TextSymbols from './symbols'

const CHILD = TextSymbols.CHILD_SYMBOL

describe('buildSegments', () => {
  it('produces a single removal segment for a simple deletion', () => {
    const from = `${CHILD}Hello beautiful world`
    const to = `${CHILD}Hello world`
    const segments = buildSegments(from, to)

    const textSegments = segments.filter(
      (seg) => seg.text !== CHILD && !seg.text.match(/^[\uF000-\uF0CF]$/),
    )

    const removedSegments = textSegments.filter((seg) => seg.action === 'removed')
    expect(removedSegments).toHaveLength(1)
    expect(removedSegments[0].text).toBe('beautiful ')

    // "Hello " and "world" should be unchanged
    const unchangedTexts = textSegments
      .filter((seg) => seg.action === 'unchanged')
      .map((seg) => seg.text)
    expect(unchangedTexts).toContain('Hello ')
    expect(unchangedTexts).toContain('world')
  })

  it('does not produce repeated segments for a deletion with multiple kept portions', () => {
    // Simulates: "ABCDE" -> "ACE" (removed "B" and "D")
    const from = `${CHILD}ABCDE`
    const to = `${CHILD}ACE`
    const segments = buildSegments(from, to)

    const textSegments = segments.filter(
      (seg) => seg.text !== CHILD && !seg.text.match(/^[\uF000-\uF0CF]$/),
    )

    // Should have exactly 2 removed segments: "B" and "D"
    const removedSegments = textSegments.filter((seg) => seg.action === 'removed')
    expect(removedSegments).toHaveLength(2)
    expect(removedSegments[0].text).toBe('B')
    expect(removedSegments[1].text).toBe('D')

    // No text should appear as both removed AND added
    const removedTexts = new Set(removedSegments.map((seg) => seg.text))
    const addedTexts = new Set(
      textSegments.filter((seg) => seg.action === 'added').map((seg) => seg.text),
    )
    for (const text of removedTexts) {
      expect(addedTexts.has(text)).toBe(false)
    }
  })

  it('does not produce empty-text segments', () => {
    const from = `${CHILD}Hello world`
    const to = `${CHILD}Hello`
    const segments = buildSegments(from, to)

    const emptySegments = segments.filter((seg) => seg.text === '')
    expect(emptySegments).toHaveLength(0)
  })

  it('handles multiple children with a deletion in the second child', () => {
    const from = `${CHILD}Hello ${CHILD}beautiful world`
    const to = `${CHILD}Hello ${CHILD}world`
    const segments = buildSegments(from, to)

    const textSegments = segments.filter(
      (seg) => seg.text !== CHILD && !seg.text.match(/^[\uF000-\uF0CF]$/),
    )

    const removedSegments = textSegments.filter((seg) => seg.action === 'removed')
    expect(removedSegments).toHaveLength(1)
    expect(removedSegments[0].text).toBe('beautiful ')
  })

  it('handles complete text deletion', () => {
    const from = `${CHILD}Hello world`
    const to = `${CHILD}`
    const segments = buildSegments(from, to)

    const removedSegments = segments.filter((seg) => seg.action === 'removed')
    expect(removedSegments).toHaveLength(1)
    expect(removedSegments[0].text).toBe('Hello world')
  })

  it('handles text with decorator symbols', () => {
    const boldStart = TextSymbols.DECORATOR_SYMBOLS[0][0]
    const boldEnd = TextSymbols.DECORATOR_SYMBOLS[0][1]
    const from = `${CHILD}${boldStart}Hello beautiful world${boldEnd}`
    const to = `${CHILD}${boldStart}Hello world${boldEnd}`
    const segments = buildSegments(from, to)

    const textSegments = segments.filter(
      (seg) =>
        seg.text !== CHILD &&
        !seg.text.match(/^[\uF000-\uF0CF]$/) &&
        seg.text !== boldStart &&
        seg.text !== boldEnd,
    )

    const removedSegments = textSegments.filter((seg) => seg.action === 'removed')
    expect(removedSegments).toHaveLength(1)
    expect(removedSegments[0].text).toBe('beautiful ')
  })

  it('handles no changes', () => {
    const text = `${CHILD}Hello world`
    const segments = buildSegments(text, text)

    // All segments should be unchanged
    const changedSegments = segments.filter((seg) => seg.action !== 'unchanged')
    expect(changedSegments).toHaveLength(0)
  })

  it('handles text addition', () => {
    const from = `${CHILD}Hello world`
    const to = `${CHILD}Hello beautiful world`
    const segments = buildSegments(from, to)

    const textSegments = segments.filter(
      (seg) => seg.text !== CHILD && !seg.text.match(/^[\uF000-\uF0CF]$/),
    )

    const addedSegments = textSegments.filter((seg) => seg.action === 'added')
    expect(addedSegments).toHaveLength(1)
    expect(addedSegments[0].text).toBe('beautiful ')
  })
})
