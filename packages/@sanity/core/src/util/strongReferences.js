import {extractWithPath} from '@sanity/mutator'
import {get} from 'lodash'

function serializePath(path) {
  return path.reduce((target, part, i) => {
    const isIndex = typeof part === 'number'
    const seperator = i === 0 ? '' : '.'
    const add = isIndex ? `[${part}]` : `${seperator}${part}`
    return `${target}${add}`
  }, '')
}

export function findStrongRefs(doc) {
  return extractWithPath('..[_ref]', doc)
    .map(match => match.path.slice(0, -1))
    .map(path => ({path, ref: get(doc, path)}))
    .filter(item => item.ref._weak !== true)
}

export function createReferenceMap(doc, refs) {
  return {
    documentId: doc._id,
    refs: refs.map(item => serializePath(item.path))
  }
}

export function transformStrongRefs(doc) {
  const refs = findStrongRefs(doc)

  // Sorry, we're mutating the documents here in order to ease import
  refs.forEach(item => {
    // Make strong references weak
    item.ref._weak = true
  })

  const referenceMap = createReferenceMap(doc, refs)
  return {doc, referenceMap}
}
