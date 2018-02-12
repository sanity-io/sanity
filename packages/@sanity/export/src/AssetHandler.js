const path = require('path')
const miss = require('mississippi')
const PQueue = require('p-queue')
const pkg = require('../package.json')
const requestStream = require('./requestStream')
const debug = require('./debug')

const ACTION_REMOVE = 'remove'
const ACTION_REWRITE = 'rewrite'
const precompressedExts = ['.zip', '.gz', '.rar', '.png', '.jpeg', '.jpg', '.gif']

class AssetHandler {
  constructor(options) {
    this.client = options.client
    this.archive = options.archive
    this.archivePrefix = options.prefix

    this.queueSize = 0
    this.queue = options.queue || new PQueue({concurrency: 3})
    this.reject = () => {
      throw new Error('Asset handler errored before `finish()` was called')
    }
  }

  clear() {
    this.queue.clear()
    this.queueSize = 0
  }

  finish() {
    return new Promise((resolve, reject) => {
      this.reject = reject
      this.queue.onIdle().then(resolve)
    })
  }

  // Called when we want to download all assets to local filesystem and rewrite documents to hold
  // placeholder asset references (_sanityAsset: 'image@file:///local/path')
  rewriteAssets = miss.through.obj((doc, enc, callback) => {
    if (['sanity.imageAsset', 'sanity.fileAsset'].includes(doc._type)) {
      const type = doc._type === 'sanity.imageAsset' ? 'image' : 'file'
      const filePath = `${type}s/${generateFilename(doc._id)}`
      this.queueAssetDownload(doc, filePath)
      callback()
      return
    }

    callback(null, this.findAndModify(doc, ACTION_REWRITE))
  })

  // Called in the case where we don't _want_ assets, so basically just remove all asset documents
  // as well as references to assets (*.asset._ref ^= (image|file)-)
  stripAssets = miss.through.obj((doc, enc, callback) => {
    if (['sanity.imageAsset', 'sanity.fileAsset'].includes(doc._type)) {
      callback()
      return
    }

    callback(null, this.findAndModify(doc, ACTION_REMOVE))
  })

  // Called when we are using raw export mode along with `assets: false`, where we simply
  // want to skip asset documents but retain asset references (useful for data mangling)
  skipAssets = miss.through.obj((doc, enc, callback) => {
    const isAsset = ['sanity.imageAsset', 'sanity.fileAsset'].includes(doc._type)
    if (isAsset) {
      callback()
      return
    }

    callback(null, doc)
  })

  noop = miss.through.obj((doc, enc, callback) => callback(null, doc))

  queueAssetDownload(assetDoc, dstPath) {
    debug('Adding download task for %s (destination: %s)', assetDoc._id, dstPath)
    this.queueSize++
    this.queue.add(() => this.downloadAsset(assetDoc.url, dstPath))
  }

  async downloadAsset(url, dstPath) {
    const headers = {'User-Agent': `${pkg.name}@${pkg.version}`}
    const stream = await requestStream({url, headers})
    const store = precompressedExts.includes(path.extname(dstPath))

    if (stream.statusCode !== 200) {
      this.archive.abort()
      this.queue.clear()
      this.reject(new Error(`Referenced asset URL "${url}" returned HTTP ${stream.statusCode}`))
      return
    }

    debug('Asset stream ready, appending to archive at %s', dstPath)
    this.archive.append(stream, {
      name: path.basename(dstPath),
      prefix: [this.archivePrefix, path.dirname(dstPath)].join('/'),
      store
    })
  }

  findAndModify = (item, action) => {
    if (Array.isArray(item)) {
      return item.map(child => this.findAndModify(child, action)).filter(Boolean)
    }

    if (!item || typeof item !== 'object') {
      return item
    }

    const assetType = getAssetType(item)
    if (assetType) {
      if (action === ACTION_REMOVE) {
        return undefined
      }

      if (action === ACTION_REWRITE) {
        const filePath = `${assetType}s/${generateFilename(item.asset._ref)}`
        return {
          _sanityAsset: `${assetType}@file://./${filePath}`
        }
      }
    }

    return Object.keys(item).reduce((acc, key) => {
      const value = item[key]
      acc[key] = this.findAndModify(value, action)

      if (typeof acc[key] === 'undefined') {
        delete acc[key]
      }

      return acc
    }, {})
  }
}

function getAssetType(item) {
  if (!item.asset || typeof item.asset._ref !== 'string') {
    return null
  }

  const [, type] = item.asset._ref.match(/^(image|file)-/) || []
  return type || null
}

function generateFilename(assetId) {
  const [, , asset, ext] = assetId.match(/^(image|file)-(.*?)(-[a-z]+)?$/)
  const extension = (ext || 'bin').replace(/^-/, '')
  return `${asset}.${extension}`
}

function lookupAssetUrl(client, assetId) {
  return client.fetch('*[_id == $id][0].url', {id: assetId})
}

module.exports = AssetHandler
