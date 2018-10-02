import {BufferedDocument, Mutation} from '../src'
import mutations from './fixtures/patches'
import snapshot from './fixtures/snapshot'

const bufferedDocument = new BufferedDocument(snapshot)
const labelAll = `Adding ${mutations.length} mutations`
console.time(labelAll)
mutations.forEach((patches, i) => {
  const label = `${i}. bufferedDocument.add`
  console.time(label)
  bufferedDocument.add(
    new Mutation({mutations: patches.map(patch => ({patch: {...patch, id: snapshot._id}}))})
  )
  console.timeEnd(label)
})
console.timeEnd(labelAll)
