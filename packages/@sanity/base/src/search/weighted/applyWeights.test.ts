import {
  calculatePhraseScore,
  calculateWordScore,
  partitionAndSanitizeSearchTerms,
  calculateCharacterScore,
} from './applyWeights'

describe('calculatePhraseScore', () => {
  it('should handle exact matches', () => {
    expect(calculatePhraseScore(['the fox'], 'the fox')).toEqual([1, '[Phrase] Exact match'])
  })
  it('should handle partial matches', () => {
    expect(calculatePhraseScore(['the fox'], 'the fox of foo')).toEqual([
      0.25,
      '[Phrase] 7/14 chars',
    ])
    expect(calculatePhraseScore(['the fox', 'fox of'], 'the fox of foo')).toEqual([
      0.4642857142857143,
      '[Phrase] 13/14 chars',
    ])
  })
})

describe('calculateWordScore', () => {
  it('should handle exact matches', () => {
    expect(calculateWordScore(['foo'], 'foo')).toEqual([1, '[Word] Exact match'])
    expect(calculateWordScore(['foo', 'foo'], 'foo foo')).toEqual([1, '[Word] Exact match'])
    expect(calculateWordScore(['bar', 'foo'], 'foo bar')).toEqual([1, '[Word] Exact match'])
    expect(calculateWordScore(['foo', 'bar'], 'bar, foo')).toEqual([1, '[Word] Exact match'])
    expect(calculateWordScore(['foo', 'bar'], 'bar & foo')).toEqual([1, '[Word] Exact match'])
  })
  it('should handle partial matches', () => {
    expect(calculateWordScore(['foo'], 'bar foo')).toEqual([0.25, '[Word] 1/2 terms: [foo]'])
    expect(calculateWordScore(['foo', 'bar'], 'foo')).toEqual([0.25, `[Word] 1/2 terms: [foo]`])
    expect(calculateWordScore(['foo', 'bar', 'baz'], 'foo foo bar')).toEqual([
      1 / 3,
      `[Word] 2/3 terms: [foo, bar]`,
    ])
  })
})

describe('calculateCharacterScore', () => {
  it('should handle exact matches', () => {
    expect(calculateCharacterScore(['bar', 'foo'], 'bar foo')).toEqual([1, '[Char] Contains all'])
  })

  it('should handle partial matches', () => {
    expect(calculateCharacterScore(['foo'], 'bar foo')).toEqual([0.25, '[Char] 3/6 chars'])
    expect(calculateCharacterScore(['fo', 'ba'], 'bar foo')).toEqual([
      0.3333333333333333,
      '[Char] 4/6 chars',
    ])
  })
})

describe('partitionAndSanitizeSearchTerms', () => {
  it('should separate words and phrases', () => {
    const {phrases, words} = partitionAndSanitizeSearchTerms(['foo', 'bar', `"foo bar"`])
    expect(phrases).toEqual(['foo bar'])
    expect(words).toEqual(['foo', 'bar'])
  })
})
