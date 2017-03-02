import through from 'through2'
import getAssetImporter from './getAssetImporter'
import promiseEach from 'promise-each-concurrency'

const batchSize = 10
const concurrency = 6

export default options => {
  const assetImporter = getAssetImporter(options)
  const documents = []

  return through.obj(onChunk, onFlush)

  async function uploadAssets(stream, cb) {
    try {
      await promiseEach(documents, assetImporter.processDocument, {concurrency})
    } catch (err) {
      cb(err)
      return
    }

    while (documents.length > 0) {
      stream.push(documents.shift())
    }

    cb()
  }

  function onChunk(chunk, enc, cb) {
    const newLength = documents.push(chunk)
    if (newLength !== batchSize) {
      return cb()
    }

    return uploadAssets(this, cb)
  }

  function onFlush(cb) {
    if (documents.length === 0) {
      cb()
      return
    }

    uploadAssets(this, cb)
  }
}
