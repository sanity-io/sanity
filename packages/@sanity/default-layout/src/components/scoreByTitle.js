/* eslint-disable id-length */
import {uniq} from 'lodash'

export default function scoreByTitle(items, searchString) {
  const terms = (searchString || '').match(/\w+/g) || []
  const regexpTerms = terms.map(term => `\\b${term}`).join('|')

  const matcher = new RegExp(`(${regexpTerms})`, 'gi')

  function uniqueMatches(text) {
    if (typeof text !== 'string') {
      return 0
    }
    const matches = (text.match(matcher) || []).map(match => {
      return match.toLowerCase()
    })
    return uniq(matches).length
  }

  const scoreHits = items.map((hit, i) => {
    let score = 1
    const title = hit.title || hit.name

    if (title) {
      const titleMatchCount = uniqueMatches(title)
      if (titleMatchCount >= terms.length) {
        score *= 10
      } else if (titleMatchCount > 0) {
        score *= 3
      }
    }

    const newHit = Object.assign(hit, {})
    newHit.score = score
    return newHit
  })

  return scoreHits.sort((a, b) => {
    return b.score - a.score
  })
}
