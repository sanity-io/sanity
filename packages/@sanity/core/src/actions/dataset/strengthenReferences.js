import noop from 'lodash/noop'
import sanityClient from '@sanity/client'
import promiseEach from 'promise-each-concurrency'
import debug from '../../debug'

const importMapQuery = 'sanity.importmap[importId == $importId && _id != $prevImportMapId, limit: 1]'

export default async function strengthenReferences(options) {
  const {importId, dataset} = options
  const progress = options.progress || noop
  const timeout = 45000
  const concurrency = 4
  const client = sanityClient(Object.assign({}, options.client.config(), {dataset, timeout}))
  const getReferenceDoc = ({prevImportMapId}) =>
    client.fetch(importMapQuery, {importId, prevImportMapId}).then(docs => docs[0])

  let referenceDoc = await getReferenceDoc({prevImportMapId: 'none'})
  while (referenceDoc) {
    debug('Found refmap with ID %s, processing', referenceDoc._id)
    await promiseEach(referenceDoc.referenceMaps, unsetRefMapKeys, {concurrency})

    debug('Unset weak flag within %d documents', referenceDoc.referenceMaps.length)
    debug('Deleting refmap with ID %s', referenceDoc._id)
    await client.delete(referenceDoc._id)
    referenceDoc = await getReferenceDoc({prevImportMapId: referenceDoc._id})

    progress(referenceDoc.referenceMaps.length)
  }

  function unsetRefMapKeys(refMap) {
    const unsetKeys = refMap.refs.map(ref => `${ref}._weak`)
    return client
      .patch(refMap.documentId)
      .unset(unsetKeys)
      .commit({visibility: 'async', returnDocuments: false})
  }
}
