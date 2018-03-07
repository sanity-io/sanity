const os = require('os')
const path = require('path')
const stringToStream = require('string-to-stream')
const AssetHandler = require('../../src/AssetHandler')

const getMockClient = () => ({
  config: () => ({projectId: '__fixtures__', dataset: '__test__'}),
  fetch: (query, params) =>
    query.endsWith('._type') ? `sanity.imageAsset` : `http://localhost:32323/${params.id}.jpg`
})

const getMockArchive = () => ({append: jest.fn(), abort: jest.fn()})

const getMockQueue = () => {
  const ops = []
  return {
    add: task => ops.push(task),
    __size: () => ops.length,
    __run: () => ops.forEach(fn => fn())
  }
}

const arrayToStream = docs => stringToStream(docs.map(doc => JSON.stringify(doc)).join('\n'))

const ndjsonToArray = ndjson =>
  ndjson
    .toString('utf8')
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line))

const getAssetHandler = () =>
  new AssetHandler({
    prefix: 'test',
    client: getMockClient(),
    tmpDir: path.join(os.tmpdir(), 'asset-handler-tests', `${Date.now()}`)
  })

module.exports = {
  getAssetHandler,
  getMockClient,
  getMockArchive,
  getMockQueue,
  arrayToStream,
  ndjsonToArray
}
