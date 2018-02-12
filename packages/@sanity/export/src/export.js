const fs = require('fs')
const zlib = require('zlib')
const miss = require('mississippi')
const split = require('split2')
const archiver = require('archiver')
const debug = require('./debug')
const AssetHandler = require('./AssetHandler')
const stringifyStream = require('./stringifyStream')
const validateOptions = require('./validateOptions')
const rejectOnApiError = require('./rejectOnApiError')
const getDocumentsStream = require('./getDocumentsStream')
const skipSystemDocuments = require('./skipSystemDocuments')

const noop = () => null

function exportDataset(opts) {
  const options = validateOptions(opts)
  const onProgress = options.onProgress || noop
  const archive = archiver('tar', {
    gzip: true,
    gzipOptions: {level: options.compress ? zlib.Z_DEFAULT_COMPRESSION : zlib.Z_NO_COMPRESSION}
  })

  const slugDate = new Date()
    .toISOString()
    .replace(/[^a-z0-9]/gi, '-')
    .toLowerCase()

  const prefix = `${opts.dataset}-export-${slugDate}`
  const assetHandler = new AssetHandler({client: options.client, archive, prefix})

  debug('Outputting to %s', options.outputPath === '-' ? 'stdout' : options.outputPath)
  const outputStream =
    options.outputPath === '-' ? process.stdout : fs.createWriteStream(options.outputPath)

  let assetStreamHandler = assetHandler.noop
  if (options.raw && !options.assets) {
    assetStreamHandler = assetHandler.skipAssets
  } else if (!options.raw) {
    assetStreamHandler = options.assets ? assetHandler.rewriteAssets : assetHandler.stripAssets
  }

  return new Promise(async (resolve, reject) => {
    miss.finished(archive, archiveErr => {
      if (archiveErr) {
        debug('Archiving errored! %s', archiveErr.stack)
        reject(archiveErr)
        return
      }

      debug('Archive finished!')
      resolve()
    })

    debug('Getting dataset export stream')
    onProgress({step: 'Exporting documents...'})
    const inputStream = await getDocumentsStream(options.client, options.dataset)
    const jsonStream = miss.pipeline(
      inputStream,
      split(JSON.parse),
      rejectOnApiError,
      skipSystemDocuments,
      assetStreamHandler,
      stringifyStream
    )

    miss.finished(jsonStream, async err => {
      if (err) {
        return
      }

      if (!options.raw && options.assets) {
        onProgress({step: 'Downloading assets...'})

        archive.on('progress', ({entries}) => {
          onProgress({
            step: 'Downloading assets...',
            current: entries.processed,
            total: Math.max(assetHandler.queueSize, entries.processed),
            update: true
          })
        })
      }

      debug('Waiting for asset handler to complete downloads')
      try {
        await assetHandler.finish()
      } catch (assetErr) {
        reject(assetErr)
        return
      }

      debug('Finalizing archive, flushing streams')
      archive.finalize()
    })

    archive.append(jsonStream, {name: 'data.ndjson', prefix})
    miss.pipe(archive, outputStream, onComplete)

    function onComplete(err) {
      if (!err) {
        return
      }

      debug('Error during streaming: %s', err.stack)
      assetHandler.clear()
      reject(err)
    }
  })
}

module.exports = exportDataset
