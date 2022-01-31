const debug = require('debug')('sanity:import:asset-validation')
const {generateHelpUrl} = require('@sanity/generate-help-url')
const pMap = require('p-map')
const urlExists = require('./util/urlExists')

const DEFAULT_VERIFY_CONCURRENCY = 12
const REQUIRED_PROPERTIES = {
  _id: 'string',
  _type: 'string',
  assetId: 'string',
  extension: 'string',
  mimeType: 'string',
  path: 'string',
  sha1hash: 'string',
  size: 'number',
  url: 'string',
}

module.exports = async function validateAssetDocuments(docs, options) {
  const config = options.client.config()
  const {projectId: targetProjectId, dataset: targetDataset} = config
  const concurrency = options.assetVerificationConcurrency || DEFAULT_VERIFY_CONCURRENCY

  const assetDocs = docs.filter((doc) => /^sanity\.[a-zA-Z]+Asset$/.test(doc._type || ''))
  if (assetDocs.length === 0) {
    return
  }

  options.onProgress({step: 'Validating asset documents'})

  assetDocs.forEach((doc) => validateAssetDocumentProperties(doc))

  // Don't allow assets that reference different datasets (unless explicitly allowing it)
  if (!options.allowAssetsInDifferentDataset) {
    assetDocs.forEach((doc) => {
      const id = doc._id || doc.url
      const {projectId, dataset} = getLocationFromDocument(doc)
      const resolveText = `See ${generateHelpUrl('import-asset-has-different-target')}`

      if (projectId !== targetProjectId) {
        throw new Error(
          `Asset ${id} references a different project ID than the specified target (asset is in ${projectId}, importing to ${targetProjectId}). ${resolveText}`
        )
      }

      if (dataset !== targetDataset) {
        throw new Error(
          `Asset ${id} references a different dataset than the specified target (asset is in ${dataset}, importing to ${targetDataset}). ${resolveText}`
        )
      }
    })
  }

  if (!options.allowFailingAssets) {
    await pMap(assetDocs, ensureAssetUrlExists, {concurrency})
  }
}

function getLocationFromDocument(doc) {
  const url = doc.path || doc.url || ''
  const path = url.replace(/^https:\/\/cdn\.sanity\.[a-z]+\//, '')
  const [, projectId, dataset] = path.split('/')
  return {projectId, dataset}
}

async function ensureAssetUrlExists(assetDoc) {
  const url = assetDoc.url
  const start = Date.now()
  const exists = await urlExists(url)
  debug(`${url}: %s (%d ms)`, exists ? 'exists' : 'does not exist', Date.now() - start)

  if (!exists) {
    const helpUrl = generateHelpUrl('import-asset-file-does-not-exist')
    throw new Error(
      `Document ${assetDoc._id} points to a URL that does not exist (${url}). See ${helpUrl}.`
    )
  }

  return true
}

function validateAssetDocumentProperties(assetDoc) {
  Object.keys(REQUIRED_PROPERTIES).forEach((prop) => {
    const expectedType = REQUIRED_PROPERTIES[prop]
    if (typeof assetDoc[prop] !== expectedType) {
      const errorType =
        typeof assetDoc[prop] === 'undefined' ? 'is missing' : 'has invalid type for'

      throw new Error(`Asset document ${assetDoc._id} ${errorType} required property "${prop}"`)
    }
  })

  if (assetDoc._type === 'sanity.imageAsset') {
    validateImageMetadata(assetDoc)
  }
}

function validateImageMetadata(assetDoc) {
  if (!assetDoc.metadata) {
    throw new Error(`Asset document ${assetDoc._id} is missing required property "metadata"`)
  }

  if (!assetDoc.metadata.dimensions) {
    throw new Error(
      `Asset document ${assetDoc._id} is missing required property "metadata.dimensions"`
    )
  }

  const dimensionProps = ['width', 'height', 'aspectRatio']
  dimensionProps.forEach((prop) => {
    if (typeof assetDoc.metadata.dimensions[prop] !== 'number') {
      throw new Error(
        `Asset document ${assetDoc._id} is missing required property "metadata.dimensions.${prop}"`
      )
    }
  })
}
