const getFileUrl = require('file-url')
const {get, set, unset} = require('lodash')
const {extractWithPath} = require('@sanity/mutator')
const serializePath = require('./serializePath')

const assetKey = '_sanityAsset'
const assetMatcher = /^(file|image)@([a-z]+:\/\/.*)/

// Note: mutates in-place
function unsetAssetRefs(doc) {
  findAssetRefs(doc).forEach(path => {
    unset(doc, path)
  })

  return doc
}

// Note: mutates in-place
function absolutifyPaths(doc, absPath) {
  if (!absPath) {
    return doc
  }

  const modifier = value =>
    value
      .replace(/file:\/\/\.\//i, `${getFileUrl(absPath, {resolve: false})}/`)
      .replace(/(https?):\/\/\.\//, `$1://${absPath}/`)

  findAssetRefs(doc).forEach(path => {
    set(doc, path, modifier(get(doc, path)))
  })

  return doc
}

function getAssetRefs(doc) {
  return findAssetRefs(doc)
    .map(path => validateAssetImportKey(path, doc))
    .map(path => ({
      documentId: doc._id,
      path: serializePath({path: path.filter(isNotAssetKey)}),
      url: get(doc, path).replace(assetMatcher, '$2'),
      type: get(doc, path).replace(assetMatcher, '$1')
    }))
}

function isNotAssetKey(segment) {
  return segment !== assetKey
}

function findAssetRefs(doc) {
  return extractWithPath(`..[${assetKey}]`, doc).map(match => match.path)
}

function validateAssetImportKey(path, doc) {
  if (!assetMatcher.test(get(doc, path))) {
    throw new Error(
      [
        'Asset type is not specified.',
        '`_sanityAsset` values must be prefixed with a type, eg image@url or file@url.',
        `See document with ID "${doc._id}", path: ${serializePath({path})}`
      ].join('\n')
    )
  }

  return path
}

exports.getAssetRefs = getAssetRefs
exports.unsetAssetRefs = unsetAssetRefs
exports.absolutifyPaths = absolutifyPaths
exports.validateAssetImportKey = validateAssetImportKey
