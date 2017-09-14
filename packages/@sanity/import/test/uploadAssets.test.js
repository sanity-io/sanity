const path = require('path')
const fileUrl = require('file-url')
const noop = require('lodash/noop')
const sanityClient = require('@sanity/client')
const {injectResponse} = require('get-it/middleware')
const uploadAssets = require('../src/uploadAssets')
const mockAssets = require('./fixtures/mock-assets')

const defaultClientOptions = {
  projectId: 'foo',
  dataset: 'bar',
  useCdn: false
}

const getSanityClient = (inject = noop, opts = {}) => {
  const requester = sanityClient.requester.clone()
  requester.use(injectResponse({inject}))
  const req = {requester: requester}
  const client = sanityClient(Object.assign(defaultClientOptions, req, opts))
  return client
}

const fixturesDir = path.join(__dirname, 'fixtures')
const imgFileUrl = fileUrl(path.join(fixturesDir, 'img.gif'))
const fileAsset = {
  documentId: 'movie_1',
  path: 'metadata.poster',
  type: 'image',
  url: imgFileUrl
}

const fetchFailClient = {
  fetch: () => Promise.reject(new Error('Some network err'))
}

test('fails if asset download fails', () => {
  const asset = Object.assign({}, fileAsset, {
    url: 'http://127.0.0.1:49999/img.gif'
  })

  const upload = uploadAssets([asset], {client: null, onProgress: noop})
  return expect(upload).rejects.toMatchSnapshot()
})

test('fails if asset lookup fails', () => {
  const options = {client: fetchFailClient, onProgress: noop}
  const upload = uploadAssets([fileAsset], options)
  return expect(upload).rejects.toMatchSnapshot()
})

test('will reuse an existing asset if it exists', () => {
  const client = getSanityClient(req => {
    const options = req.context.options
    const uri = options.uri || options.url

    if (uri.includes('/data/query')) {
      return {body: {result: 'someAssetId'}}
    }

    if (uri.includes('/data/mutate')) {
      const body = JSON.parse(options.body)
      expect(body).toMatchSnapshot('single asset mutation')
      const results = body.mutations.map(mut => ({
        id: mut.patch.id,
        operation: 'update'
      }))
      return {body: {results}}
    }

    return {statusCode: 400, body: {error: `"${uri}" should not be called`}}
  })

  return expect(
    uploadAssets([fileAsset], {client, onProgress: noop})
  ).resolves.toBe(1)
})

test('will upload asset that do not already exist', () => {
  const client = getSanityClient(req => {
    const options = req.context.options
    const uri = options.uri || options.url
    if (uri.includes('/data/query')) {
      return {body: {result: null}}
    }

    if (uri.includes('/assets/images')) {
      return {body: {document: {_id: 'newAssetId'}}}
    }

    if (uri.includes('/data/mutate')) {
      const body = JSON.parse(options.body)
      expect(body).toMatchSnapshot('single create mutation')
      const results = body.mutations.map(mut => ({
        id: mut.patch.id,
        operation: 'update'
      }))
      return {body: {results}}
    }

    return {statusCode: 400, body: {error: `"${uri}" should not be called`}}
  })

  return expect(
    uploadAssets([fileAsset], {client, onProgress: noop})
  ).resolves.toBe(1)
})

test('will upload once but batch patches', () => {
  let batch = 0
  const client = getSanityClient(req => {
    const options = req.context.options
    const uri = options.uri || options.url

    if (uri.includes('/data/query')) {
      return {body: {result: 'someAssetId'}}
    }

    if (uri.includes('/data/mutate')) {
      const body = JSON.parse(options.body)
      expect(body).toMatchSnapshot(`batch patching (batch #${++batch})`)
      const results = body.mutations.map(mut => ({
        id: mut.patch.id,
        operation: 'update'
      }))
      return {body: {results}}
    }

    return {statusCode: 400, body: {error: `"${uri}" should not be called`}}
  })

  const upload = uploadAssets(mockAssets(imgFileUrl), {
    client,
    onProgress: noop
  })
  return expect(upload).resolves.toBe(60)
})
