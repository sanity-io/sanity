import {compact, intersection, keyBy, partition, toLower, union, uniq, words} from 'lodash'
import {SearchHit, WeightedHit, SearchSpec} from './types'

type SearchScore = [number, string]

/**
 * Takes a set of terms and a value and returns a [score, story] pair where score is a value between 0, 1 and story is the explanation.
 *
 * @internal
 */
export const calculateScore = (searchTerms: string[], value: string): SearchScore => {
  // Separate search terms by phrases (wrapped with quotes) and words.
  const {phrases: uniqueSearchPhrases, words: uniqueSearchWords} =
    partitionAndSanitizeSearchTerms(searchTerms)

  // Calculate an aggregated score of both phrase and word matches.
  const [phraseScore, phraseWhy] = calculatePhraseScore(uniqueSearchPhrases, value)
  const [wordScore, wordWhy] = calculateWordScore(uniqueSearchWords, value)
  return [phraseScore + wordScore, [wordWhy, phraseWhy].join(', ')]
}

const stringify = (value: unknown): string =>
  typeof value === 'string' ? value : JSON.stringify(value)

/**
 * @internal
 */
export function applyWeights(
  searchSpec: SearchSpec[],
  hits: SearchHit[],
  terms: string[] = []
): WeightedHit[] {
  const specByType = keyBy(searchSpec, (spec) => spec.typeName)
  return hits.map((hit, index) => {
    const typeSpec = specByType[hit._type]
    const stories = (typeSpec.paths || [])?.map((pathSpec, idx) => {
      const value = stringify(hit[`w${idx}`])
      if (!value) {
        return {path: pathSpec.path, score: 0, why: 'No match'}
      }
      const [score, why] = calculateScore(terms, value)
      return {
        path: pathSpec.path,
        score: score * pathSpec.weight,
        why: `${why} (*${pathSpec.weight})`,
      }
    })

    const totalScore = stories.reduce((acc, rank) => acc + rank.score, 0)

    return {hit, resultIndex: hits.length - index, score: totalScore, stories: stories}
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
export function calculatePhraseScore(uniqueSearchPhrases: string[], value: string): SearchScore {
  const sanitizedValue = value.toLowerCase().trim()

  let fieldScore = 0
  let matchCount = 0
  uniqueSearchPhrases.forEach((term) => {
    if (sanitizedValue.includes(term)) {
      fieldScore += term.length / sanitizedValue.length
      matchCount += term.length
    }
  })

  return fieldScore === 1
    ? [1, '[Phrase] Exact match']
    : [fieldScore / 2, `[Phrase] Matched ${matchCount} of ${sanitizedValue.length} characters`]
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
export function calculateWordScore(uniqueSearchTerms: string[], value: string): SearchScore {
  const uniqueValueTerms = uniq(compact(words(toLower(value))))

  const matches = intersection(uniqueSearchTerms, uniqueValueTerms)
  const all = union(uniqueValueTerms, uniqueSearchTerms)
  const fieldScore = matches.length / all.length
  return fieldScore === 1
    ? [1, '[Word] Exact match']
    : [
        fieldScore / 2,
        `[Word] Matched ${matches.length} of ${all.length} terms: [${matches.join(', ')}]`,
      ]
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
