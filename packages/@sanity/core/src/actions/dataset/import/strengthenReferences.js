import noop from 'lodash/noop'
import promiseEach from 'promise-each-concurrency'
import trimQuery from '../../../util/trimQuery'
import debug from '../../../debug'

export default async function strengthenReferences(options) {
  const {importId, client} = options
  const progress = options.progress || noop
  const concurrency = 20

  const getReferenceDocs = ({prevMapNumber}) =>
    client.fetch(getImportMapQuery(prevMapNumber, concurrency), {importId})

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

function getImportMapQuery(prevMapNumber, concurrency) {
  return trimQuery(`
    *[
      is "sanity.importmap" &&
      importId == $importId &&
      importMapNumber > ${prevMapNumber}
    ] | order(importMapNumber asc) [0...${concurrency}]`
  )
}
