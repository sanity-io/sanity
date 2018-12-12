/* eslint-disable id-length, complexity */

import {get, uniq} from 'lodash'
import schema from 'part:@sanity/base/schema'

const GROQ_KEYWORDS = ['match', 'in', 'asc', 'desc', 'true', 'false', 'null']
const VALID_FIELD = /^[a-zA-Z_][a-zA-Z0-9_]*$/

export const fieldNeedsEscape = fieldName =>
  !VALID_FIELD.test(fieldName) || GROQ_KEYWORDS.includes(fieldName)

export const escapeField = fieldName => `["${fieldName}"]`
const escapeFirst = fieldName => `@${escapeField(fieldName)}`

const isEmptyArray = v => Array.isArray(v) && v.length === 0
export const joinPath = pathArray =>
  pathArray.reduce((prev, pathSegment, i) => {
    if (isEmptyArray(pathSegment)) {
      return `${prev}[]`
    }
    const isFirst = i === 0
    const needsEscape = fieldNeedsEscape(pathSegment)

    if (needsEscape) {
      return isFirst ? escapeFirst(pathSegment) : `${prev}${escapeField(pathSegment)}`
    }
    return isFirst ? pathSegment : `${prev}.${pathSegment}`
  }, '')

// eslint-disable-next-line no-useless-escape
const FILTER_RE = /[\[|(]([^\]]+)[\]|)]/g

export function parseQuery(str) {
  const filters = []
  let termsStr = str

  let match
  while ((match = FILTER_RE.exec(str))) {
    filters.push(match[1])
    termsStr = termsStr.replace(match[0], '')
  }

  const terms = termsStr.split(/\s+/g).filter(Boolean)

  return {
    filters,
    terms
  }
}

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

export function sortResultsByScore(results, terms = []) {
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

  const sortedResults = results.map(result => {
    let score = 1

    const titleField = getPreviewField(result, 'title')
    const subtitleField = getPreviewField(result, 'subtitle')
    const descriptionField = getPreviewField(result, 'description')

    if (titleField && typeof titleField === 'string') {
      const titleMatchCount = uniqueMatches(titleField)
      if (titleMatchCount >= terms.length) {
        score *= 10
      } else if (titleMatchCount > 0) {
        score *= 3
      }

      // Boost exact match
      if (terms.length === 1 && titleField.toLowerCase().trim() === terms[0].toLowerCase()) {
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

    return {result, score}
  })

  sortedResults.sort((a, b, idx) => b.score - a.score)

  return sortedResults.map(item => item.result)
}
