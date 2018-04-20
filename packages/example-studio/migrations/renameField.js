import baseClient from 'part:@sanity/base/client'

// Remove when we get support for sanity exec --with-user-token
import ConfigStore from 'configstore'
const authToken = new ConfigStore('sanity', {}, {globalConfigPath: true}).get('authToken')
const client = baseClient.config({token: authToken})
// ---

// Fetching documents that matches the precondition for the migration
const fetchDocuments = () =>
  client.fetch(`*[_type == 'author' && defined(fullname)] {_id, _rev, fullname}`)

const buildPatches = docs =>
  docs.map(doc => ({
    id: doc._id,
    patch: {
      set: {name: doc.fullname},
      unset: doc.name,
      // this will cause the migration to fail if the document has been
      // modified since it was fetched.
      ifRevisionID: doc._rev
    }
  }))

const printSummary = patches => {
  console.log(
    `Patching:\n %s`,
    patches.map(patch => `${patch.id} => ${JSON.stringify(patch.patch)}`).join('\n')
  )
  return patches
}

const createTransaction = patches =>
  patches.reduce((tx, patch) => tx.patch(patch.id, patch.patch), client.transaction())

const commitTransaction = tx => tx.commit()

fetchDocuments()
  .then(buildPatches)
  .then(printSummary)
  .then(createTransaction)
  .then(commitTransaction)
  .then(console.log, console.error)
