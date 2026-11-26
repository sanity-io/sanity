import {describe, expect, it} from 'vitest'

import {
  calculatePhraseScore,
  calculateWordScore,
  partitionAndSanitizeSearchTerms,
} from './applyWeights'

describe('calculatePhraseScore', () => {
  it('should handle exact matches', () => {
    expect(calculatePhraseScore(['the fox'], 'the fox')).toBe(1)
  })
  it('should handle partial matches', () => {
    expect(calculatePhraseScore(['the fox'], 'the fox of foo')).toBe(0.25)
  })
})

describe('calculateWordScore', () => {
  it('should handle exact matches', () => {
    expect(calculateWordScore(['foo'], 'foo')).toBe(1)
    expect(calculateWordScore(['foo', 'foo'], 'foo foo')).toBe(1)
    expect(calculateWordScore(['bar', 'foo'], 'foo bar')).toBe(1)
    expect(calculateWordScore(['foo', 'bar'], 'bar, foo')).toBe(1)
    expect(calculateWordScore(['foo', 'bar'], 'bar & foo')).toBe(1)
  })
  it('should handle partial matches', () => {
    expect(calculateWordScore(['foo'], 'bar foo')).toBe(0.25)
    expect(calculateWordScore(['foo', 'bar'], 'foo')).toBe(0.25)
    expect(calculateWordScore(['foo', 'bar', 'baz'], 'foo foo bar')).toBe(1 / 3)
  })
})

describe('partitionAndSanitizeSearchTerms', () => {
  it('should separate words and phrases', () => {
    const {phrases, words} = partitionAndSanitizeSearchTerms(['foo', 'bar', `"foo bar"`])
    expect(phrases).toEqual(['foo bar'])
    expect(words).toEqual(['foo', 'bar'])
  })
})
