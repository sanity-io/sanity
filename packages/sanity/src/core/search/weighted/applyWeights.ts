import {type SanityDocumentLike} from '@sanity/types'
import compact from 'lodash-es/compact.js'
import intersection from 'lodash-es/intersection.js'
import keyBy from 'lodash-es/keyBy.js'
import partition from 'lodash-es/partition.js'
import toLower from 'lodash-es/toLower.js'
import union from 'lodash-es/union.js'
import uniq from 'lodash-es/uniq.js'
import words from 'lodash-es/words.js'

import {type SearchSpec, type WeightedHit} from '../common/types'

/**
 * Takes a set of terms and a value and returns a score between 0 and 1.
 *
 * @internal
 */
const calculateScore = (searchTerms: string[], value: string): number => {
  // Separate search terms by phrases (wrapped with quotes) and words.
  const {phrases: uniqueSearchPhrases, words: uniqueSearchWords} =
    partitionAndSanitizeSearchTerms(searchTerms)

  // Calculate an aggregated score of both phrase and word matches.
  return (
    calculatePhraseScore(uniqueSearchPhrases, value) + calculateWordScore(uniqueSearchWords, value)
  )
}

const stringify = (value: unknown): string =>
  typeof value === 'string' ? value : JSON.stringify(value)

/**
 * @internal
 */
export function applyWeights(
  searchSpec: SearchSpec[],
  hits: SanityDocumentLike[],
  terms: string[] = [],
): WeightedHit[] {
  const specByType = keyBy(searchSpec, (spec) => spec.typeName)
  return hits.map((hit, index) => {
    const typeSpec = specByType[hit._type]
    const totalScore = (typeSpec.paths || []).reduce((acc, pathSpec, idx) => {
      const value = stringify(hit[`w${idx}`])
      return value ? acc + calculateScore(terms, value) * pathSpec.weight : acc
    }, 0)

    return {hit, resultIndex: hits.length - index, score: totalScore}
  })
}
/**
 * For phrases: score on the total number of matching characters.
 * E.g. given the phrases ["the fox", "of london"] for the target value "the wily fox of london"
 *
 * - "the fox" isn't included in the target value (score: 0)
 * - "of london" is included in the target value, and 9 out of 22 characters match (score: 9/22 = ~0.408)
 * - non-exact matches have their score divided in half (final score: ~0.204)
 *
 * @internal
 */
export function calculatePhraseScore(uniqueSearchPhrases: string[], value: string): number {
  const sanitizedValue = value.toLowerCase().trim()

  let fieldScore = 0
  uniqueSearchPhrases.forEach((term) => {
    if (sanitizedValue.includes(term)) {
      fieldScore += term.length / sanitizedValue.length
    }
  })

  return fieldScore === 1 ? 1 : fieldScore / 2
}

/**
 * For words: score on the total number of matching words.
 * E.g. given the words ["the", "fox", "of", "london"] for the target value "the wily fox of london"
 *
 * - 4 out of 5 words match (score: 4/5 = 0.8)
 * - non-exact matches have their score divided in half (final score: 0.4)
 *
 * @internal
 */
export function calculateWordScore(uniqueSearchTerms: string[], value: string): number {
  const uniqueValueTerms = uniq(compact(words(toLower(value))))

  const matches = intersection(uniqueSearchTerms, uniqueValueTerms)
  const all = union(uniqueValueTerms, uniqueSearchTerms)
  const fieldScore = matches.length / all.length
  return fieldScore === 1 ? 1 : fieldScore / 2
}

/**
 * @internal
 */
export function partitionAndSanitizeSearchTerms(searchTerms: string[]): {
  phrases: string[]
  words: string[]
} {
  const uniqueSearchTerms = uniq(searchTerms.map(toLower))

  const [searchPhrases, searchWords] = partition(uniqueSearchTerms, (term) => /^".*"$/.test(term))
  return {
    phrases: uniq(searchPhrases).map(toLower).map(stripWrappingQuotes), //
    words: uniq(searchWords.map(toLower)),
  }
}

function stripWrappingQuotes(str: string) {
  return str.replace(/^"(.*)"$/, '$1')
}
