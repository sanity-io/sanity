const os = require('os')
const fs = require('fs')
const path = require('path')
const miss = require('mississippi')
const gunzipMaybe = require('gunzip-maybe')
const peek = require('peek-stream')
const isTar = require('is-tar')
const tar = require('tar-fs')
const tempy = require('tempy')
const globby = require('globby')
const debug = require('debug')('sanity:import:stream')
const {noop} = require('lodash')
const getJsonStreamer = require('./util/getJsonStreamer')

module.exports = (stream, options, importers) =>
  new Promise((resolve, reject) => {
    const outputPath = path.join(tempy.directory(), 'sanity-import')
    debug('Importing from stream')

    let isTarStream = false
    let jsonDocuments

    const uncompressStream = miss.pipeline(gunzipMaybe(), untarMaybe())
    miss.pipe(
      stream,
      uncompressStream,
      err => {
        if (err) {
          reject(err)
          return
        }

        if (isTarStream) {
          findAndImport()
        } else {
          resolve(importers.fromArray(jsonDocuments, options))
        }
      }
    )

    function untarMaybe() {
      return peek({newline: false, maxBuffer: 300}, (data, swap) => {
        if (isTar(data)) {
          debug('Stream is a tarball, extracting to %s', outputPath)
          isTarStream = true
          return swap(null, tar.extract(outputPath))
        }

        debug('Stream is an ndjson file, streaming JSON')
        const jsonStreamer = getJsonStreamer()
        const concatter = miss.concat(resolveNdjsonStream)
        const ndjsonStream = miss.pipeline(jsonStreamer, concatter)
        ndjsonStream.on('error', err => {
          uncompressStream.emit('error', err)
          destroy([uncompressStream, jsonStreamer, concatter, ndjsonStream])
          reject(err)
        })
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

function destroy(streams) {
  streams.forEach(stream => {
    if (isFS(stream)) {
      // use close for fs streams to avoid fd leaks
      stream.close(noop)
    } else if (isRequest(stream)) {
      // request.destroy just do .end - .abort is what we want
      stream.abort()
    } else if (isFn(stream.destroy)) {
      stream.destroy()
    }
  })
}

function isFn(fn) {
  return typeof fn === 'function'
}

function isFS(stream) {
  return (
    (stream instanceof (fs.ReadStream || noop) || stream instanceof (fs.WriteStream || noop)) &&
    isFn(stream.close)
  )
}

function isRequest(stream) {
  return stream.setHeader && isFn(stream.abort)
}
