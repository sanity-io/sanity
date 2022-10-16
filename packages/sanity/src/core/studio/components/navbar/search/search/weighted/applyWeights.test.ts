import {
  calculatePhraseScore,
  calculateWordScore,
  partitionAndSanitizeSearchTerms,
} from './applyWeights'

describe('calculatePhraseScore', () => {
  it('should handle exact matches', () => {
    expect(calculatePhraseScore(['the fox'], 'the fox')).toEqual([1, '[Phrase] Exact match'])
  })
  it('should handle partial matches', () => {
    expect(calculatePhraseScore(['the fox'], 'the fox of foo')).toEqual([
      0.25,
      '[Phrase] Matched 7 of 14 characters',
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
    expect(calculateWordScore(['foo'], 'bar foo')).toEqual([
      0.25,
      '[Word] Matched 1 of 2 terms: [foo]',
    ])
    expect(calculateWordScore(['foo', 'bar'], 'foo')).toEqual([
      0.25,
      `[Word] Matched 1 of 2 terms: [foo]`,
    ])
    expect(calculateWordScore(['foo', 'bar', 'baz'], 'foo foo bar')).toEqual([
      1 / 3,
      `[Word] Matched 2 of 3 terms: [foo, bar]`,
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
