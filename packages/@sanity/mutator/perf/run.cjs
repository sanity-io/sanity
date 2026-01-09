// oxlint-disable no-console

const {BufferedDocument, Mutation} = require('../lib')
const mutations = require('./fixtures/patches.cjs')
const snapshot = require('./fixtures/snapshot.cjs')

const bufferedDocument = new BufferedDocument(snapshot)
const labelAll = `Adding ${mutations.length} mutations`
console.time(labelAll)
mutations.forEach((patches, i) => {
  const label = `${i}. bufferedDocument.add`
  console.time(label)
  bufferedDocument.add(
    new Mutation({mutations: patches.map((patch) => ({patch: {...patch, id: snapshot._id}}))}),
  )
  console.timeEnd(label)
})
console.timeEnd(labelAll)
