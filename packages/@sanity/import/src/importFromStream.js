const os = require('os')
const path = require('path')
const miss = require('mississippi')
const gunzipMaybe = require('gunzip-maybe')
const peek = require('peek-stream')
const isTar = require('is-tar')
const tar = require('tar-fs')
const globby = require('globby')
const debug = require('debug')('sanity:import:stream')
const getJsonStreamer = require('./util/getJsonStreamer')

module.exports = (stream, options, importers) =>
  new Promise((resolve, reject) => {
    const outputPath = path.join(os.tmpdir(), 'sanity-import')
    debug('Importing from stream')

    let isTarStream = false
    let jsonDocuments

    miss.pipe(stream, gunzipMaybe(), untarMaybe(), err => {
      if (err) {
        reject(err)
        return
      }

      if (isTarStream) {
        findAndImport()
      } else {
        resolve(importers.fromArray(jsonDocuments, options))
      }
    })

    function untarMaybe() {
      return peek({newline: false, maxBuffer: 300}, (data, swap) => {
        if (isTar(data)) {
          debug('Stream is a tarball, extracting to %s', outputPath)
          isTarStream = true
          return swap(null, tar.extract(outputPath))
        }

        debug('Stream is an ndjson file, streaming JSON')
        const ndjsonStream = miss.pipeline(getJsonStreamer(), miss.concat(resolveNdjsonStream))
        ndjsonStream.on('error', reject)
        return swap(null, ndjsonStream)
      })
    }

    function resolveNdjsonStream(documents) {
      debug('Finished reading ndjson stream')
      jsonDocuments = documents
    }

    async function findAndImport() {
      debug('Tarball extracted, looking for ndjson')

      const files = await globby('**/*.ndjson', {cwd: outputPath, deep: 2, absolute: true})
      if (!files.length) {
        reject(new Error('ndjson-file not found in tarball'))
        return
      }

      const importBaseDir = path.dirname(files[0])
      resolve(importers.fromFolder(importBaseDir, {...options, deleteOnComplete: true}, importers))
    }
  })
