import {describe, expect, it} from 'vitest'

import {PREVIEW_STRING_MAX_LENGTH} from '../constants'
import {type PreviewableType} from '../types'
import {invokePrepare, prepareForPreview} from './prepareForPreview'

const LONG = 'a'.repeat(PREVIEW_STRING_MAX_LENGTH * 3)

describe('prepareForPreview string truncation', () => {
  it('truncates a very long title from the default prepare path', () => {
    const type: PreviewableType = {
      name: 'testDoc',
      preview: {select: {title: 'name'}},
    }

    const result = prepareForPreview({name: LONG}, type)

    expect(typeof result.title).toBe('string')
    expect((result.title as string).length).toBe(PREVIEW_STRING_MAX_LENGTH + 1) // +1 for the ellipsis
    expect(result.title).toMatch(/…$/)
  })

  it('truncates long values returned from a custom prepare()', () => {
    const type: PreviewableType = {
      name: 'testDoc',
      preview: {
        select: {name: 'name'},
        prepare: (value) => ({
          title: value.name as string,
          subtitle: value.name as string,
          description: value.name as string,
        }),
      },
    }

    const result = prepareForPreview({name: LONG}, type)

    for (const key of ['title', 'subtitle', 'description'] as const) {
      expect((result[key] as string).length).toBe(PREVIEW_STRING_MAX_LENGTH + 1)
      expect(result[key]).toMatch(/…$/)
    }
  })

  it('leaves short strings untouched', () => {
    const type: PreviewableType = {
      name: 'testDoc',
      preview: {select: {title: 'name'}},
    }

    const result = prepareForPreview({name: 'A short title'}, type)

    expect(result.title).toBe('A short title')
  })

  it('does not truncate imageUrl, media or date values', () => {
    const longUrl = `https://example.com/image.png?signature=${'x'.repeat(PREVIEW_STRING_MAX_LENGTH * 2)}`
    const type: PreviewableType = {
      name: 'testDoc',
      preview: {
        select: {name: 'name'},
        prepare: (value) => ({
          title: 'ok',
          imageUrl: longUrl,
          media: longUrl,
          date: longUrl,
        }),
      },
    }

    const result = prepareForPreview({name: 'irrelevant'}, type) as Record<string, unknown>

    expect(result.imageUrl).toBe(longUrl)
    expect(result.media).toBe(longUrl)
    expect(result.date).toBe(longUrl)
  })

  it('does not split surrogate pairs at the truncation boundary', () => {
    // Fill so that a 2-code-unit emoji straddles the max length cut-off
    const value = `${'a'.repeat(PREVIEW_STRING_MAX_LENGTH - 1)}😀😀😀${'b'.repeat(PREVIEW_STRING_MAX_LENGTH)}`
    const type: PreviewableType = {
      name: 'testDoc',
      preview: {select: {title: 'name'}},
    }

    const result = prepareForPreview({name: value}, type)
    const title = result.title as string

    // No lone surrogates anywhere in the output
    expect(title).not.toMatch(
      /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/,
    )
    expect(title).toMatch(/…$/)
  })

  it('does not truncate a string within the code-point limit but over it in UTF-16 code units', () => {
    const type: PreviewableType = {
      name: 'testDoc',
      preview: {select: {title: 'name'}},
    }
    // 600 emoji = 600 code points but 1200 UTF-16 code units (each is a surrogate
    // pair). It's within PREVIEW_STRING_MAX_LENGTH (1024) code points yet over it
    // in code units, so it must pass through untouched (no ellipsis).
    const value = '😀'.repeat(600)
    expect(Array.from(value).length).toBeLessThanOrEqual(PREVIEW_STRING_MAX_LENGTH)
    expect(value.length).toBeGreaterThan(PREVIEW_STRING_MAX_LENGTH)

    const result = prepareForPreview({name: value}, type)

    expect(result.title).toBe(value)
    expect(result.title).not.toMatch(/…$/)
  })

  it('truncates via invokePrepare directly (covers the no-select-paths branch)', () => {
    const type: PreviewableType = {name: 'testDoc', preview: {}}

    const {returnValue} = invokePrepare(type, {title: LONG})

    expect(((returnValue as Record<string, unknown>).title as string).length).toBe(
      PREVIEW_STRING_MAX_LENGTH + 1,
    )
  })
})
