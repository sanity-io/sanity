const getFileUrl = require('file-url')
const {get, set, unset} = require('lodash')
const {extractWithPath} = require('@sanity/mutator')
const serializePath = require('./serializePath')

const assetKey = '_sanityAsset'
const assetMatcher = /^(file|image)@([a-z]+:\/\/.*)/

// Note: mutates in-place
function unsetAssetRefs(doc) {
  findAssetRefs(doc).forEach(path => {
    const parentPath = path.slice(0, -1)
    const parent = get(doc, parentPath)

    // If the only key in the object is `_sanityAsset`, unset the whole thing,
    // as we will be using a `setIfMissing({[path]: {}})` patch to enforce it.
    // Prevents empty objects from appearing while import is running
    const isOnlyKey = parent && Object.keys(parent).length === 1 && parent[assetKey]
    const unsetPath = isOnlyKey ? parentPath : path

    unset(doc, unsetPath)
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
