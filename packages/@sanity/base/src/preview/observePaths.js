import documentStore from 'part:@sanity/base/datastore/document'

export default function observePaths(id, paths) {
  return documentStore.byId(id)
    .map(event => event.document)
}
