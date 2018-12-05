/* eslint-disable id-length, complexity */
import {get, uniq} from 'lodash'
import schema from 'part:@sanity/base/schema'

function getPreviewField(item, field) {
  const type = schema.get(item._type)

  if (!get(type, 'preview.select')) {
    return null
  }

  if (type.preview.prepare) {
    const prepare = type.preview.prepare(item)
    if (prepare && prepare[field]) {
      return prepare[field]
    }
  }

  return item[get(type, `preview.select.${field}`)]
}

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

    const titleField = getPreviewField(hit, 'title')
    const subtitleField = getPreviewField(hit, 'subtitle')
    const descriptionField = getPreviewField(hit, 'description')

    if (titleField) {
      const titleMatchCount = uniqueMatches(titleField)
      if (titleMatchCount >= terms.length) {
        score *= 10
      } else if (titleMatchCount > 0) {
        score *= 3
      }

      // Boost exact match
      if (titleField === searchString) {
        score *= 1.5
      }
    }

    let matchCount = 0

    if (subtitleField) {
      matchCount = uniqueMatches(subtitleField)
      if (matchCount >= terms.length) {
        score *= 2
      }
    }

    if (descriptionField) {
      matchCount = uniqueMatches(descriptionField)
      if (matchCount >= terms.length) {
        score *= 2
      }
    }
    const newHit = Object.assign(hit, {})
    newHit.score = score
    console.log(score, titleField)
    return newHit
  })

  return scoreHits.sort((a, b) => {
    return b.score - a.score
  })
}
