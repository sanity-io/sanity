import {uniq, union, intersection, keyBy} from 'lodash'

// takes a set of terms and a value and returns a [score, story] pair where score is a value between 0, 1 and story is the explanation
export const calculateScore = (searchTerms, value) => {
  const uniqueValueTerms = uniq(value.split(/\W+/).map(v => v.toLowerCase()))
  const uniqueSearchTerms = uniq(searchTerms).map(v => v.toLowerCase())
  const matches = intersection(uniqueSearchTerms, uniqueValueTerms)
  const all = union(uniqueValueTerms, uniqueSearchTerms)
  const fieldScore = matches.length / all.length
  return fieldScore === 1
    ? [1, 'Exact match']
    : [fieldScore / 2, `Matched ${matches.length} of ${all.length} terms: [${matches.join(', ')}]`]
}

const stringify = value => (typeof value === 'string' ? value : JSON.stringify(value))

export function applyWeights(searchSpec, hits, terms = []) {
  const specByType = keyBy(searchSpec, spec => spec.typeName)
  return hits.map((hit, index) => {
    const typeSpec = specByType[hit._type]
    const stories = typeSpec.paths.map((pathSpec, idx) => {
      const value = stringify(hit[`w${idx}`])
      if (!value) {
        return {path: pathSpec.path, score: 0, why: 'No match'}
      }
      const [score, why] = calculateScore(terms, value)
      return {
        path: pathSpec.path,
        score: score * pathSpec.weight,
        why: `${why} (*${pathSpec.weight})`
      }
    })

    const totalScore = stories.reduce((acc, rank) => acc + rank.score, 0)

    return {hit, resultIndex: hits.length - index, score: totalScore, stories: stories}
  })
}
