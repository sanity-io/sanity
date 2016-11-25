import sanityClient from '@sanity/client'
import promiseEach from 'promise-each-concurrency'

const importMapQuery = 'sanity.importmap[importId == $importId, limit: 1]'

export default async function strengthenReferences(context, options) {
  const {apiClient} = context
  const {importId, dataset} = options
  const timeout = 45000
  const concurrency = 4
  const client = sanityClient(Object.assign({}, apiClient().config(), {dataset, timeout}))
  const getReferenceDoc = () => client.fetch(importMapQuery, {importId}).then(docs => docs[0])

  let referenceDoc = await getReferenceDoc()
  while (referenceDoc) {
    await promiseEach(referenceDoc.referenceMaps, unsetRefMapKeys, {concurrency})
    await client.delete(referenceDoc._id)
    referenceDoc = await getReferenceDoc()
  }

  function unsetRefMapKeys(refMap) {
    const unsetKeys = refMap.refs.map(ref => `${ref}._weak`)
    return client
      .patch(refMap.documentId)
      .unset(unsetKeys)
      .commit({visibility: 'async', returnDocuments: false})
  }
}
