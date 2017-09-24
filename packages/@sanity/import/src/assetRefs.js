const {get, unset} = require('lodash')
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

function getAssetRefs(doc) {
  return findAssetRefs(doc).map(path => ({
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

exports.getAssetRefs = getAssetRefs
exports.unsetAssetRefs = unsetAssetRefs
