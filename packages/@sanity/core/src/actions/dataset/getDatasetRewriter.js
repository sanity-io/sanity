import through2 from 'through2'
import {extractWithPath} from '@sanity/mutator'
import {get} from 'lodash'

/**
 * Transform all document IDs and references (weak and strong)
 * from one dataset name to a new one
 */
export default function getDatasetRewriter(fromDataset, toDataset) {
  const rewriteDataset = fromDataset !== toDataset
  const matcher = new RegExp(`^${escapeRegExp(fromDataset)}([/.])`)
  const replaceId = str => str.replace(matcher, `${toDataset}$1`)

  return through2.obj(function (doc, enc, cb) {
    if (!rewriteDataset) {
      this.push(doc)
      cb()
      return
    }

    // Yes, we're mutating. This is in a stream though,
    // and deep-cloning would be expensive and unnecessary
    doc._id = replaceId(doc._id)
    extractWithPath('..[_ref]', doc)
      .map(match => get(doc, match.path.slice(0, -1)))
      .forEach(ref => {
        ref._ref = replaceId(ref._ref)
      })

    // Now push the mutated document back
    this.push(doc)
    cb()
  })
}

function escapeRegExp(str) {
  return str.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&')
}
