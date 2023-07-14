import {compact, intersection, keyBy, partition, toLower, union, uniq, words} from 'lodash'
import {SearchHit, WeightedHit, SearchSpec} from './types'

type SearchScore = [number, string]

/**
 * Calculates a score (between 0 and 1) indicating general search relevance of an array of
 * search tokens within a specific string.
 *
 * @internal
 * @param searchTerms - All search terms
 * @param value - The string to match against
 * @returns A [score, story] pair containing the search score as well as a human readable explanation
 */
export const calculateScore = (searchTerms: string[], value: string): SearchScore => {
  // Separate search terms by phrases (wrapped with quotes) and words.
  const {phrases: uniqueSearchPhrases, words: uniqueSearchWords} = partitionAndSanitizeSearchTerms(
    searchTerms
  )
  // Calculate an aggregated score of words (partial + whole) and phrase matches.
  const [charScore, charWhy] = calculateCharacterScore(uniqueSearchWords, value)
  const [phraseScore, phraseWhy] = calculatePhraseScore(uniqueSearchPhrases, value)
  const [wordScore, wordWhy] = calculateMatchingWordScore(uniqueSearchWords, value)
  return [charScore + wordScore + phraseScore, [charWhy, wordWhy, phraseWhy].flat().join(', ')]
}

const stringify = (value: unknown): string =>
  typeof value === 'string' ? value : JSON.stringify(value)

/**
 * Applies path weights from a supplied SearchSpec to existing search hits to create _weighted_ hits
 * augmented with search ranking and human readable explanations.
 *
 * @internal
 * @param searchSpec - SearchSpec containing path weighting
 * @param hits - SearchHit objects to augment
 * @param terms - All search terms
 * @returns WeightedHit array containing search scores and ranking explanations
 */
export function applyWeights(
  searchSpec: SearchSpec[],
  hits: SearchHit[],
  terms: string[] = []
): WeightedHit[] {
  const specByType = keyBy(searchSpec, (spec) => spec.typeName)

  return hits.reduce((allHits, hit, index) => {
    const typeSpec = specByType[hit._type]
    const stories = typeSpec.paths.map((pathSpec, idx) => {
      const pathHit = ['_id', '_type'].includes(pathSpec.path) ? hit[pathSpec.path] : hit[idx]
      const indices = Array.isArray(pathHit) ? findMatchingIndices(terms, pathHit) : null
      // Only stringify non-falsy values so null values don't pollute search
      const value = pathHit ? stringify(pathHit) : null
      if (!value) {
        return {path: pathSpec.path, score: 0, why: 'No match'}
      }
      const [score, why] = calculateScore(terms, value)
      return {
        indices,
        path: pathSpec.path,
        score: score * pathSpec.weight,
        why: `${why} (*${pathSpec.weight})`,
      }
    })

    const totalScore = stories.reduce((acc, rank) => acc + rank.score, 0)
    /*
     * Filter out hits with no score.
     * (only if search terms are present, otherwise we always show results)
     *
     * Due to how we generate search queries, in some cases it's possible to have returned search hits
     * which shouldn't be displayed. This can happen when searching on multiple document types and
     * user-configured `__experimental_search` paths are in play.
     *
     * Since search generates a GROQ query with filters that may refer to field names shared across
     * multiple document types, it's possible that one document type searches on a field path
     * that is hidden by another via `__experimental_search`.
     */
    if (terms.length === 0 || totalScore > 0) {
      allHits.push({hit, resultIndex: hits.length - index, score: totalScore, stories: stories})
    }
    return allHits
  }, [])
}

/**
 * Generate a sccore on the total number of matching characters.
 * E.g. given the phrases ["the fox", "of london"] for the target value "the wily fox of london"
 *
 * - "the fox" isn't included in the target value (score: 0)
 * - "of london" is included in the target value, and 9 out of 22 characters match (score: 9/22 = ~0.408)
 * - non-exact matches have their score divided in half (final score: ~0.204)
 *
 * @internal
 * @param uniqueSearchPhrases - All search phrases
 * @param value - The string to match against
 * @returns SearchScore containing the search score as well as a human readable explanation
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
 * Generate a score on the total number of matching characters.
 * E.g. given the terms ["bar", "fo"] for the target value "food bar".
 *
 * - "fo" is included in the target value, and 2 out of 7 non-whitespace characters match (score: 2/7)
 * - "bar" is included in the target value, and 3 out of 7 non-whitespace characters match (score: 3/7)
 * - all values are accumulated and have their score devidied by half (final score: ~0.357)
 *
 * @internal
 * @param uniqueSearchTerms - A string array of search terms
 * @param value - The string to match against
 * @returns SearchScore containing the search score as well as a human readable explanation
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
 * Generate a score on the total number of matching _whole_ words.
 * E.g. given the words ["the", "fox", "of", "london"] for the target value "the wily fox of london"
 *
 * - 4 out of 5 words match (score: 4/5 = 0.8)
 * - non-exact matches have their score divided in half (final score: 0.4)
 *
 * @internal
 * @param uniqueSearchTerms - All search terms
 * @param value - The string to match against
 * @returns SearchScore containing the search score as well as a human readable explanation
 */
export function calculateMatchingWordScore(
  uniqueSearchTerms: string[],
  value: string
): SearchScore {
  const uniqueValueTerms = uniq(compact(words(toLower(value))))

  const matches = intersection(uniqueSearchTerms, uniqueValueTerms)
  const all = union(uniqueValueTerms, uniqueSearchTerms)
  const fieldScore = matches.length / all.length || 0
  return fieldScore === 1
    ? [1, '[Word] Exact match']
    : [fieldScore / 2, `[Word] ${matches.length}/${all.length} terms: [${matches.join(', ')}]`]
}

/**
 * Partition search terms by phrases (wrapped with quotes) and words.
 *
 * @internal
 * @param searchTerms - All search terms
 * @returns Partitioned phrases and words
 */
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

/**
 * Returns matching array indices of `values` containing _any_ member of `uniqueSearchTerms`.
 * When comparing for matches, members of `values` are stringified, trimmed and lowercased.
 *
 * @internal
 * @param uniqueSearchTerms - All search terms
 * @param values - Values to match against (members are stringified)
 * @returns All matching indices in `values`
 */
export function findMatchingIndices(uniqueSearchTerms: string[], values: unknown[]): number[] {
  const {phrases: uniqueSearchPhrases, words: uniqueSearchWords} = partitionAndSanitizeSearchTerms(
    uniqueSearchTerms
  )

  return values.reduce<number[]>((acc, val, index) => {
    if (val) {
      const contains = [...uniqueSearchPhrases, ...uniqueSearchWords].some((term) => {
        const stringifiedValue = stringify(val).toLowerCase().trim()
        return stringifiedValue.includes(term)
      })
      if (contains) {
        acc.push(index)
      }
    }
    return acc
  }, [])
}

function stripWrappingQuotes(str: string) {
  return str.replace(/^"(.*)"$/, '$1')
}
