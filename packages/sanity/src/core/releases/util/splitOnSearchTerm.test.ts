import {describe, expect, it} from 'vitest'

import {splitOnSearchTerm} from './splitOnSearchTerm'

describe('splitOnSearchTerm', () => {
  it('marks a match in the middle, keeping the text either side', () => {
    expect(splitOnSearchTerm('Spring campaign', 'ring')).toEqual([
      {text: 'Sp', isMatch: false},
      {text: 'ring', isMatch: true},
      {text: ' campaign', isMatch: false},
    ])
  })

  it('marks a match at the start with no empty leading segment', () => {
    expect(splitOnSearchTerm('Hotfix launch', 'hot')).toEqual([
      {text: 'Hot', isMatch: true},
      {text: 'fix launch', isMatch: false},
    ])
  })

  it('marks a match at the end', () => {
    expect(splitOnSearchTerm('Hotfix launch', 'launch')).toEqual([
      {text: 'Hotfix ', isMatch: false},
      {text: 'launch', isMatch: true},
    ])
  })

  it('keeps the original capitalisation of the matched run', () => {
    // Matching is case-insensitive, but the row must still read as the release was named.
    expect(splitOnSearchTerm('Nordic Market Launch', 'market')).toEqual([
      {text: 'Nordic ', isMatch: false},
      {text: 'Market', isMatch: true},
      {text: ' Launch', isMatch: false},
    ])
  })

  it('marks every occurrence, not only the first', () => {
    // Marking one of two would read as the other not matching.
    expect(splitOnSearchTerm('Docs and more docs', 'docs')).toEqual([
      {text: 'Docs', isMatch: true},
      {text: ' and more ', isMatch: false},
      {text: 'docs', isMatch: true},
    ])
  })

  it('handles adjacent occurrences without emitting an empty segment', () => {
    expect(splitOnSearchTerm('aaaa', 'aa')).toEqual([
      {text: 'aa', isMatch: true},
      {text: 'aa', isMatch: true},
    ])
  })

  it.each([
    ['an empty term', 'Spring campaign', ''],
    ['a whitespace-only term', 'Spring campaign', '   '],
    ['a term that does not appear', 'Spring campaign', 'zzz'],
  ])('returns the text as one unmarked segment for %s', (_label, text, searchTerm) => {
    expect(splitOnSearchTerm(text, searchTerm)).toEqual([{text, isMatch: false}])
  })

  it('returns an empty unmarked segment for empty text', () => {
    expect(splitOnSearchTerm('', 'anything')).toEqual([{text: '', isMatch: false}])
  })
})
