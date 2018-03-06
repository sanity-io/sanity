const fse = require('fs-extra')
const globby = require('globby')
const getFileUrl = require('file-url')
const debug = require('debug')('sanity:import:folder')

module.exports = async function importFromFolder(fromDir, options, importers) {
  debug('Importing from folder %s', fromDir)
  const dataFiles = await globby('*.ndjson', {cwd: fromDir, absolute: true})
  if (dataFiles.length === 0) {
    throw new Error(`No .ndjson file found in ${fromDir}`)
  }

  if (dataFiles.length > 1) {
    throw new Error(`More than one .ndjson file found in ${fromDir} - only one is supported`)
  }

  const dataFile = dataFiles[0]
  debug('Importing from file %s', dataFile)

  const stream = fse.createReadStream(dataFile)
  const images = await globby('images/*', {cwd: fromDir, absolute: true})
  const files = await globby('files/*', {cwd: fromDir, absolute: true})
  const unreferencedAssets = []
    .concat(images.map(path => `image#${getFileUrl(path, {resolve: false})}`))
    .concat(files.map(path => `file#${getFileUrl(path, {resolve: false})}`))

  debug('Queueing %d assets', unreferencedAssets.length)

  const streamOptions = {...options, unreferencedAssets, assetsBase: fromDir}
  const result = await importers.fromStream(stream, streamOptions, importers)

  if (options.deleteOnComplete) {
    await fse.remove(fromDir)
  }

  return result
}
