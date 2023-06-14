import {compact, intersection, keyBy, partition, toLower, union, uniq, words} from 'lodash'
import {SearchHit, WeightedHit, SearchSpec} from './types'

type SearchScore = [number, string]

// takes a set of terms and a value and returns a [score, story] pair where score is a value between 0, 1 and story is the explanation
export const calculateScore = (
  searchTerms: string[],
  value: string,
  options?: {
    skipPhraseScore?: boolean
    skipWordScore?: boolean
  }
): SearchScore => {
  const {skipPhraseScore, skipWordScore} = options

  // Separate search terms by phrases (wrapped with quotes) and words.
  const {phrases: uniqueSearchPhrases, words: uniqueSearchWords} = partitionAndSanitizeSearchTerms(
    searchTerms
  )
  // Calculate an aggregated score of words (partial + whole) and phrase matches.
  const [baseScore, baseWhy] = calculateCharacterScore(uniqueSearchWords, value)
  const [phraseScore, phraseWhy] = skipPhraseScore
    ? [0, []]
    : calculatePhraseScore(uniqueSearchPhrases, value)
  const [wordScore, wordWhy] = skipWordScore
    ? [0, []]
    : calculateMatchingWordScore(uniqueSearchWords, value)
  return [baseScore + wordScore + phraseScore, [baseWhy, wordWhy, phraseWhy].flat().join(', ')]
}

const stringify = (value: unknown): string =>
  typeof value === 'string' ? value : JSON.stringify(value)

export function applyWeights(
  searchSpec: SearchSpec[],
  hits: SearchHit[],
  terms: string[] = []
): WeightedHit[] {
  const specByType = keyBy(searchSpec, (spec) => spec.typeName)
  return hits.map((hit, index) => {
    const typeSpec = specByType[hit._type]
    const stories = typeSpec.paths.map((pathSpec, idx) => {
      const pathHit = hit[`w${idx}`]
      // Only stringify non-falsy values so null values don't pollute search
      const value = pathHit ? stringify(pathHit) : null
      if (!value) {
        return {path: pathSpec.path, score: 0, why: 'No match'}
      }
      // Don't calculate word score for internal fields (_id, _type) etc.
      // This is to ensure that document IDs don't errorenously get broken up into
      // multiple tokens, which creates false positives.
      const [score, why] = calculateScore(terms, value, {
        skipWordScore: pathSpec.path.startsWith('_'),
      })
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
 * Score on the total number of matching characters.
 * E.g. given the phrases ["the fox", "of london"] for the target value "the wily fox of london"
 *
 * - "the fox" isn't included in the target value (score: 0)
 * - "of london" is included in the target value, and 9 out of 22 characters match (score: 9/22 = ~0.408)
 * - non-exact matches have their score divided in half (final score: ~0.204)
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
    : [fieldScore / 2, `[Phrase] ${matchCount}/${sanitizedValue.length} chars`]
}

/**
 * Score on the total number of matching characters.
 * E.g. given the terms ["bar", "fo"] for the target value "food bar".
 *
 * - "fo" is included in the target value, and 2 out of 7 non-whitespace characters match (score: 2/7)
 * - "bar" is included in the target value, and 3 out of 7 non-whitespace characters match (score: 3/7)
 * - all values are accumulated and have their score devidied by half (final score: ~0.357)
 */
export function calculateCharacterScore(uniqueSearchTerms: string[], value: string): SearchScore {
  const sanitizedValue = value.toLowerCase().trim()
  const sanitizedValueCompact = sanitizedValue.replace(/ /g, '')

  let fieldScore = 0
  let matchCount = 0
  uniqueSearchTerms.forEach((term) => {
    if (sanitizedValue.includes(term)) {
      fieldScore += term.length / sanitizedValueCompact.length
      matchCount += term.length
    }
  })

  return fieldScore === 1
    ? [fieldScore, `[Char] Contains all`]
    : [fieldScore / 2, `[Char] ${matchCount}/${sanitizedValueCompact.length} chars`]
}

/**
 * Score on the total number of matching _whole_ words.
 * E.g. given the words ["the", "fox", "of", "london"] for the target value "the wily fox of london"
 *
 * - 4 out of 5 words match (score: 4/5 = 0.8)
 * - non-exact matches have their score divided in half (final score: 0.4)
 */
export function calculateMatchingWordScore(
  uniqueSearchTerms: string[],
  value: string
): SearchScore {
  const uniqueValueTerms = uniq(compact(words(toLower(value))))

  const matches = intersection(uniqueSearchTerms, uniqueValueTerms)
  const all = union(uniqueValueTerms, uniqueSearchTerms)
  const fieldScore = matches.length / all.length
  return fieldScore === 1
    ? [1, '[Word] Exact match']
    : [fieldScore / 2, `[Word] ${matches.length}/${all.length} terms: [${matches.join(', ')}]`]
}

export function partitionAndSanitizeSearchTerms(
  searchTerms: string[]
): {
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
