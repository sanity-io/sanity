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

    miss.pipe(stream, gunzipMaybe(), untarMaybe(), err => {
      if (err) {
        reject(err)
        return
      }

      if (!isTarStream) {
        return // Will be resolved by concatenation
      }

      findAndImport()
    })

    function untarMaybe() {
      return peek({newline: false, maxBuffer: 300}, (data, swap) => {
        if (isTar(data)) {
          debug('Stream is a tarball, extracting to %s', outputPath)
          isTarStream = true
          return swap(null, tar.extract(outputPath))
        }

        debug('Stream is an ndjson file, streaming JSON')
        return swap(null, miss.pipeline(getJsonStreamer(), miss.concat(resolveNdjsonStream)))
      })
    }

    function resolveNdjsonStream(documents) {
      debug('Finished reading ndjson stream')
      resolve(importers.fromArray(documents, options))
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
