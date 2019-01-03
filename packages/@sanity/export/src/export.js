const os = require('os')
const path = require('path')
const zlib = require('zlib')
const fse = require('fs-extra')
const miss = require('mississippi')
const split = require('split2')
const archiver = require('archiver')
const debug = require('./debug')
const AssetHandler = require('./AssetHandler')
const stringifyStream = require('./stringifyStream')
const validateOptions = require('./validateOptions')
const rejectOnApiError = require('./rejectOnApiError')
const getDocumentsStream = require('./getDocumentsStream')
const filterSystemDocuments = require('./filterSystemDocuments')
const filterDocumentTypes = require('./filterDocumentTypes')
const filterDrafts = require('./filterDrafts')
const logFirstChunk = require('./logFirstChunk')

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
  const tmpDir = path.join(os.tmpdir(), prefix)
  const assetHandler = new AssetHandler({
    client: options.client,
    tmpDir,
    prefix
  })

  debug('Outputting assets (temporarily) to %s', tmpDir)
  debug('Outputting to %s', options.outputPath === '-' ? 'stdout' : options.outputPath)
  const outputStream =
    options.outputPath === '-' ? process.stdout : fse.createWriteStream(options.outputPath)

  let assetStreamHandler = assetHandler.noop
  if (!options.raw) {
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
    })

    debug('Getting dataset export stream')
    onProgress({step: 'Exporting documents...'})

    let documentCount = 0
    let lastReported = Date.now()
    const reportDocumentCount = (chunk, enc, cb) => {
      ++documentCount

      const now = Date.now()
      if (now - lastReported > 50) {
        onProgress({
          step: 'Exporting documents...',
          current: documentCount,
          total: '?',
          update: true
        })

        lastReported = now
      }

      cb(null, chunk)
    }

    const inputStream = await getDocumentsStream(options.client, options.dataset)
    debug('Got HTTP %d', inputStream.statusCode)
    debug('Response headers: %o', inputStream.headers)

    const jsonStream = miss.pipeline(
      inputStream,
      logFirstChunk(),
      split(JSON.parse),
      rejectOnApiError(),
      filterSystemDocuments(),
      assetStreamHandler,
      filterDocumentTypes(options.types),
      options.drafts ? miss.through.obj() : filterDrafts(),
      stringifyStream(),
      miss.through(reportDocumentCount)
    )

    miss.finished(jsonStream, async err => {
      if (err) {
        return
      }

      onProgress({
        step: 'Exporting documents...',
        current: documentCount,
        total: documentCount,
        update: true
      })

      if (!options.raw && options.assets) {
        onProgress({step: 'Downloading assets...'})
      }

      let prevCompleted = 0
      const progressInterval = setInterval(() => {
        const completed = assetHandler.queueSize - assetHandler.queue.size
        if (prevCompleted === completed) {
          return
        }

        prevCompleted = completed
        onProgress({
          step: 'Downloading assets...',
          current: completed,
          total: assetHandler.queueSize,
          update: true
        })
      }, 500)

      debug('Waiting for asset handler to complete downloads')
      try {
        const assetMap = await assetHandler.finish()
        archive.append(JSON.stringify(assetMap), {name: 'assets.json', prefix})
        clearInterval(progressInterval)
      } catch (assetErr) {
        clearInterval(progressInterval)
        reject(assetErr)
        return
      }

      // Add all downloaded assets to archive
      archive.directory(path.join(tmpDir, 'files'), `${prefix}/files`, {store: true})
      archive.directory(path.join(tmpDir, 'images'), `${prefix}/images`, {store: true})

      debug('Finalizing archive, flushing streams')
      onProgress({step: 'Adding assets to archive...'})
      archive.finalize()
    })

    archive.on('warning', err => {
      debug('Archive warning: %s', err.message)
    })

    archive.append(jsonStream, {name: 'data.ndjson', prefix})
    miss.pipe(
      archive,
      outputStream,
      onComplete
    )

    async function onComplete(err) {
      onProgress({step: 'Clearing temporary files...'})
      await fse.remove(tmpDir)

      if (!err) {
        resolve()
        return
      }

      debug('Error during streaming: %s', err.stack)
      assetHandler.clear()
      reject(err)
    }
  })
}

module.exports = exportDataset
