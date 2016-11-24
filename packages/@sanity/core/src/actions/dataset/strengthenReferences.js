import sanityClient from '@sanity/client'

const importMapQuery = 'sanity.importmap[importId == $importId, limit: 3]'

export default async function strengthenReferences(context, options) {
  const {apiClient} = context
  const {importId, dataset} = options
  const timeout = 45000
  const client = sanityClient(Object.assign({}, apiClient().config(), {dataset, timeout}))
  const getReferenceDocs = () => client.fetch(importMapQuery, {importId})

  let referenceDocs = await getReferenceDocs()
  while (referenceDocs.length > 0) {
    let transaction = client.transaction()

    referenceDocs.forEach(referenceDoc => {
      const refMaps = referenceDoc.referenceMaps
      transaction = refMaps.reduce(reduceRefMaps, transaction)
    })

    await transaction.commit({visibility: 'async'})

    const deleteTransaction = client.transaction()
    referenceDocs.forEach(doc => deleteTransaction.delete(doc._id))
    await deleteTransaction.commit()

    referenceDocs = await getReferenceDocs()
  }
}

function reduceRefMaps(transaction, refMap) {
  const unsetKeys = refMap.refs.map(ref => `${ref}._weak`)
  return transaction.patch(refMap.documentId, patch => patch.unset(unsetKeys))
}
