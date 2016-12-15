import noop from 'lodash/noop'
import sanityClient from '@sanity/client'
import promiseEach from 'promise-each-concurrency'
import debug from '../../../debug'

export default async function strengthenReferences(options) {
  const {importId, dataset} = options
  const progress = options.progress || noop
  const timeout = 605000
  const concurrency = 20
  const importMapQuery = `sanity.importmap[importId == $importId && importMapNumber > $prevMapNumber, limit: ${concurrency}]`
  const client = sanityClient(Object.assign({}, options.client.config(), {dataset, timeout}))
  const getReferenceDocs = ({prevMapNumber}) =>
    client.fetch(importMapQuery, {importId, prevMapNumber})

  let referenceDocs = await getReferenceDocs({prevMapNumber: 0})
  while (referenceDocs.length) {
    debug('Found %d refmaps, processing', referenceDocs.length)
    await promiseEach(referenceDocs, unsetRefMapKeys, {concurrency})

    debug('Unset weak flag within %d documents', referenceDocs.length)
    const highest = referenceDocs.reduce((current, doc) => Math.max(current, doc.importMapNumber), 0)
    progress(referenceDocs.length)

    // Fetch next batch
    referenceDocs = await getReferenceDocs({prevMapNumber: highest})
  }

  function unsetRefMapKeys(refMap) {
    const unsetKeys = refMap.refs.map(ref => `${ref}._weak`)
    return client.transaction()
      .patch(refMap.documentId, patch => patch.unset(unsetKeys))
      .delete(refMap._id)
      .commit({visibility: 'async', returnDocuments: false})
  }
}
