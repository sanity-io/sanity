import through2 from 'through2'
import {extractWithPath} from '@sanity/mutator'
import {get} from 'lodash'

export default options => {
  const {targetDataset, importId} = options
  let importMapCount = 0

  return through2.obj(function weakenReferences(doc, enc, cb) {
    const refs = findStrongRefs(doc)

    // Make strong references weak
    refs.forEach(item => {
      item.ref._weak = true
    })

    this.push(doc)

    if (refs.length > 0) {
      this.push({
        _id: `${targetDataset}.sanity.`,
        _type: 'sanity.importmap',
        importId: importId,
        importMapNumber: ++importMapCount,
        documentId: doc._id,
        refs: refs.map(item => serializePath(item.path))
      })
    }

    cb()
  })
}

function findStrongRefs(doc) {
  return extractWithPath('..[_ref]', doc)
    .map(match => match.path.slice(0, -1))
    .map(path => ({path, ref: get(doc, path)}))
    .filter(item => item.ref._weak !== true)
}

function serializePath(path) {
  return path.reduce((target, part, i) => {
    const isIndex = typeof part === 'number'
    const seperator = i === 0 ? '' : '.'
    const add = isIndex ? `[${part}]` : `${seperator}${part}`
    return `${target}${add}`
  }, '')
}
