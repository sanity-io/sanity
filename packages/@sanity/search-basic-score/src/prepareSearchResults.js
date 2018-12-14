/* eslint-disable complexity */
/* eslint-disable id-length */

import {uniq} from 'lodash'
import schema from 'part:@sanity/base/schema'

function getPreviewData(doc) {
  const type = schema.get(doc._type)

  if (!type) {
    // console.log('type not found:', doc._type)
    return {
      title: null,
      subtitle: null,
      description: null
    }
  }

  if (type.preview && type.preview.select) {
    if (type.preview.prepare) {
      const prepared = type.preview.prepare(doc)

      return {
        title: prepared.title,
        subtitle: prepared.subtitle,
        description: prepared.description
      }
    }

    const {select} = type.preview

    return {
      title: doc[select.title] || doc.title,
      subtitle: doc[select.subtitle] || doc.subtitle,
      description: doc[select.description] || doc.description
    }
  }

  return {
    title: doc.title,
    subtitle: doc.subtitle,
    description: doc.description
  }
}

function uniqueMatches(matcher, text) {
  if (typeof text !== 'string') {
    return 0
  }

  const matches = (text.match(matcher) || []).map(match => {
    return match.toLowerCase()
  })

  return uniq(matches).length
}

export function sortResultsByScore(results, terms = []) {
  const termsRegExp = terms.map(term => `\\b${term}`).join('|')

  const matcher = new RegExp(`(${termsRegExp})`, 'gi')

  const sortedResults = results.map(result => {
    let score = 1

    const previewFields = getPreviewData(result)

    if (previewFields.title && typeof previewFields.title === 'string') {
      const titleMatchCount = uniqueMatches(matcher, previewFields.title)
      if (titleMatchCount >= terms.length) {
        score *= 10
      } else if (titleMatchCount > 0) {
        score *= 3
      }

      // Boost exact match
      if (
        terms.length === 1 &&
        previewFields.title.toLowerCase().trim() === terms[0].toLowerCase()
      ) {
        score *= 1.5
      }
    }

    let matchCount = 0

    if (previewFields.subtitle) {
      matchCount = uniqueMatches(matcher, previewFields.subtitle)
      if (matchCount >= terms.length) {
        score *= 2
      }
    }

    if (previewFields.description) {
      matchCount = uniqueMatches(matcher, previewFields.description)
      if (matchCount >= terms.length) {
        score *= 2
      }
    }

    return {result, score}
  })

  sortedResults.sort((a, b, idx) => b.score - a.score)

  return sortedResults.map(item => item.result)
}

function prepareSearchResults(results, query, opts) {
  return sortResultsByScore(results, query.terms).slice(0, opts.limit || 100)
}

export default prepareSearchResults
