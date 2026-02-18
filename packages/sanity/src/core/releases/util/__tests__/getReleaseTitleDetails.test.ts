import {describe, expect, it} from 'vitest'

import {getReleaseTitleDetails} from '../getReleaseTitleDetails'

describe('getReleaseTitleDetails', () => {
  describe('titles within the character limit', () => {
    it('should return the full title as displayTitle when the title is short', () => {
      const result = getReleaseTitleDetails('Short title', 'Fallback')

      expect(result).toEqual({
        displayTitle: 'Short title',
        fullTitle: 'Short title',
        isTruncated: false,
      })
    })

    it('should not truncate a title that is exactly 50 characters', () => {
      const title50 = 'A'.repeat(50)

      const result = getReleaseTitleDetails(title50, 'Fallback')

      expect(result).toEqual({
        displayTitle: title50,
        fullTitle: title50,
        isTruncated: false,
      })
    })

    it('should handle a single character title without truncation', () => {
      const result = getReleaseTitleDetails('X', 'Fallback')

      expect(result).toEqual({
        displayTitle: 'X',
        fullTitle: 'X',
        isTruncated: false,
      })
    })
  })

  describe('titles exceeding the character limit', () => {
    it('should truncate a title that is 51 characters', () => {
      const title51 = 'B'.repeat(51)

      const result = getReleaseTitleDetails(title51, 'Fallback')

      expect(result.isTruncated).toBe(true)
      expect(result.fullTitle).toBe(title51)
      expect(result.displayTitle).toBe(`${'B'.repeat(50)}\u2026`)
      expect(result.displayTitle.length).toBe(51)
    })

    it('should truncate a long title well over 50 characters', () => {
      const longTitle =
        'This is a very long release title that exceeds the fifty character limit by quite a lot'

      const result = getReleaseTitleDetails(longTitle, 'Fallback')

      expect(result.isTruncated).toBe(true)
      expect(result.fullTitle).toBe(longTitle)
      expect(result.displayTitle).not.toBe(longTitle)
      expect(result.displayTitle.endsWith('\u2026')).toBe(true)
    })

    it('should use the proper ellipsis character and not three dots', () => {
      const longTitle = 'C'.repeat(100)

      const result = getReleaseTitleDetails(longTitle, 'Fallback')

      expect(result.displayTitle.endsWith('\u2026')).toBe(true)
      expect(result.displayTitle.endsWith('...')).toBe(false)
    })
  })

  describe('fullTitle always contains the complete untruncated title', () => {
    it('should preserve the complete title in fullTitle when truncated', () => {
      const longTitle = 'D'.repeat(200)

      const result = getReleaseTitleDetails(longTitle, 'Fallback')

      expect(result.fullTitle).toBe(longTitle)
      expect(result.fullTitle.length).toBe(200)
    })

    it('should preserve the complete title in fullTitle when not truncated', () => {
      const shortTitle = 'Short'

      const result = getReleaseTitleDetails(shortTitle, 'Fallback')

      expect(result.fullTitle).toBe(shortTitle)
    })
  })

  describe('fallback behavior', () => {
    it('should use the fallback when title is undefined and not truncate a short fallback', () => {
      const result = getReleaseTitleDetails(undefined, 'Short fallback')

      expect(result).toEqual({
        displayTitle: 'Short fallback',
        fullTitle: 'Short fallback',
        isTruncated: false,
      })
    })

    it('should use the fallback when title is undefined and truncate a long fallback', () => {
      const longFallback = 'F'.repeat(60)

      const result = getReleaseTitleDetails(undefined, longFallback)

      expect(result.isTruncated).toBe(true)
      expect(result.fullTitle).toBe(longFallback)
      expect(result.displayTitle).toBe(`${'F'.repeat(50)}\u2026`)
    })

    it('should use the fallback when title is an empty string', () => {
      const result = getReleaseTitleDetails('', 'Used fallback')

      expect(result).toEqual({
        displayTitle: 'Used fallback',
        fullTitle: 'Used fallback',
        isTruncated: false,
      })
    })

    it('should truncate the fallback when it exceeds the limit and title is empty', () => {
      const longFallback = 'G'.repeat(80)

      const result = getReleaseTitleDetails('', longFallback)

      expect(result.isTruncated).toBe(true)
      expect(result.fullTitle).toBe(longFallback)
      expect(result.displayTitle.endsWith('\u2026')).toBe(true)
    })
  })

  describe('unicode and emoji handling', () => {
    it('should handle emoji characters without breaking them mid-grapheme', () => {
      const emojiTitle = '\u{1F600}'.repeat(60)

      const result = getReleaseTitleDetails(emojiTitle, 'Fallback')

      expect(result.isTruncated).toBe(true)
      expect(result.fullTitle).toBe(emojiTitle)
      expect(result.displayTitle.endsWith('\u2026')).toBe(true)
    })

    it('should handle compound emoji (ZWJ sequences) without splitting them', () => {
      const familyEmoji = '\u{1F468}\u200D\u{1F468}\u200D\u{1F467}\u200D\u{1F467}'
      const title = familyEmoji.repeat(60)

      const result = getReleaseTitleDetails(title, 'Fallback')

      expect(result.isTruncated).toBe(true)
      expect(result.fullTitle).toBe(title)
      expect(result.displayTitle.endsWith('\u2026')).toBe(true)
    })

    it('should handle mixed ASCII and emoji titles', () => {
      const mixedTitle = `Release \u{1F680} ${'A'.repeat(50)}`

      const result = getReleaseTitleDetails(mixedTitle, 'Fallback')

      expect(result.isTruncated).toBe(true)
      expect(result.fullTitle).toBe(mixedTitle)
      expect(result.displayTitle.endsWith('\u2026')).toBe(true)
    })

    it('should handle CJK characters', () => {
      const cjkTitle = '\u4F60\u597D\u4E16\u754C'.repeat(15)

      const result = getReleaseTitleDetails(cjkTitle, 'Fallback')

      expect(result.isTruncated).toBe(true)
      expect(result.fullTitle).toBe(cjkTitle)
      expect(result.displayTitle.endsWith('\u2026')).toBe(true)
    })

    it('should not truncate a short emoji-only title', () => {
      const shortEmojiTitle = '\u{1F600}\u{1F601}\u{1F602}'

      const result = getReleaseTitleDetails(shortEmojiTitle, 'Fallback')

      expect(result).toEqual({
        displayTitle: shortEmojiTitle,
        fullTitle: shortEmojiTitle,
        isTruncated: false,
      })
    })
  })

  describe('boundary conditions around 50 characters', () => {
    it('should not truncate at exactly 49 characters', () => {
      const title49 = 'E'.repeat(49)

      const result = getReleaseTitleDetails(title49, 'Fallback')

      expect(result.isTruncated).toBe(false)
      expect(result.displayTitle).toBe(title49)
    })

    it('should not truncate at exactly 50 characters', () => {
      const title50 = 'E'.repeat(50)

      const result = getReleaseTitleDetails(title50, 'Fallback')

      expect(result.isTruncated).toBe(false)
      expect(result.displayTitle).toBe(title50)
    })

    it('should truncate at exactly 51 characters', () => {
      const title51 = 'E'.repeat(51)

      const result = getReleaseTitleDetails(title51, 'Fallback')

      expect(result.isTruncated).toBe(true)
      expect(result.displayTitle).toBe(`${'E'.repeat(50)}\u2026`)
    })

    it('should truncate at exactly 52 characters', () => {
      const title52 = 'E'.repeat(52)

      const result = getReleaseTitleDetails(title52, 'Fallback')

      expect(result.isTruncated).toBe(true)
      expect(result.displayTitle).toBe(`${'E'.repeat(50)}\u2026`)
    })
  })
})
