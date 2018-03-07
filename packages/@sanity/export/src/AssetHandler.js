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

    this.assetsSeen = new Map()
    this.queueSize = 0
    this.queue = options.queue || new PQueue({concurrency: 3})
    this.reject = () => {
      throw new Error('Asset handler errored before `finish()` was called')
    }
  }

  clear() {
    this.assetsSeen.clear()
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
  rewriteAssets = miss.through.obj(async (doc, enc, callback) => {
    if (['sanity.imageAsset', 'sanity.fileAsset'].includes(doc._type)) {
      const type = doc._type === 'sanity.imageAsset' ? 'image' : 'file'
      const filePath = `${type}s/${generateFilename(doc._id)}`
      this.assetsSeen.set(doc._id, type)
      this.queueAssetDownload(doc, filePath)
      callback()
      return
    }

    callback(null, await this.findAndModify(doc, ACTION_REWRITE))
  })

  // Called in the case where we don't _want_ assets, so basically just remove all asset documents
  // as well as references to assets (*.asset._ref ^= (image|file)-)
  stripAssets = miss.through.obj(async (doc, enc, callback) => {
    if (['sanity.imageAsset', 'sanity.fileAsset'].includes(doc._type)) {
      callback()
      return
    }

    callback(null, await this.findAndModify(doc, ACTION_REMOVE))
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

  // eslint-disable-next-line complexity
  findAndModify = async (item, action) => {
    if (Array.isArray(item)) {
      const children = await Promise.all(item.map(child => this.findAndModify(child, action)))
      return children.filter(Boolean)
    }

    if (!item || typeof item !== 'object') {
      return item
    }

    const isAsset = isAssetField(item)
    if (isAsset && action === ACTION_REMOVE) {
      return undefined
    }

    if (isAsset && action === ACTION_REWRITE) {
      const assetId = item.asset._ref
      if (isModernAsset(assetId)) {
        const assetType = getAssetType(item)
        const filePath = `${assetType}s/${generateFilename(assetId)}`
        return {_sanityAsset: `${assetType}@file://./${filePath}`}
      }

      // Legacy asset
      const type = this.assetsSeen.get(assetId) || (await this.lookupAssetType(assetId))
      const filePath = `${type}s/${generateFilename(assetId)}`
      return {_sanityAsset: `${type}@file://./${filePath}`}
    }

    const newItem = {}
    const keys = Object.keys(item)
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const value = item[key]

      // eslint-disable-next-line no-await-in-loop
      newItem[key] = await this.findAndModify(value, action)

      if (typeof newItem[key] === 'undefined') {
        delete newItem[key]
      }
    }

    return newItem
  }

  lookupAssetType = async assetId => {
    const docType = await this.client.fetch('*[_id == $id][0]._type', {id: assetId})
    return docType === 'sanity.imageAsset' ? 'image' : 'file'
  }
}

function isAssetField(item) {
  return item.asset && item.asset._ref
}

function getAssetType(item) {
  if (!item.asset || typeof item.asset._ref !== 'string') {
    return null
  }

  const [, type] = item.asset._ref.match(/^(image|file)-/) || []
  return type || null
}

function isModernAsset(assetId) {
  return /^(image|file)/.test(assetId)
}

function generateFilename(assetId) {
  const [, , asset, ext] = assetId.match(/^(image|file)-(.*?)(-[a-z]+)?$/) || []
  const extension = (ext || 'bin').replace(/^-/, '')
  return asset ? `${asset}.${extension}` : `${assetId}.bin`
}

module.exports = AssetHandler
