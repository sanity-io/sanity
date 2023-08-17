const os = require('os')
const path = require('path')
const miss = require('mississippi')
const split = require('split2')
const rimraf = require('../src/util/rimraf')
const {getAssetHandler, arrayToStream} = require('./helpers')

const docById = (docs, id) => docs.find((doc) => doc._id === id)

describe('asset handler', () => {
  afterAll(async () => {
    await rimraf(path.join(os.tmpdir(), 'asset-handler-tests'))
  })

  test('can rewrite documents / queue downloads', (done) => {
    // prettier-ignore
    const docs = [
      {_id: 'doc1', _type: 'bike', name: 'Scooter', image: {_type: 'image', caption: 'Scooter bike', asset: {_ref: 'image-6dcdb82c282dbe0a09ff7a6b58b639732f2fb8de-3360x840-png'}, nested: {_type: 'image', asset: {_ref: 'image-6dcdb82c282dbe0a09ff7a6b58b639732f2fb8de-3360x840-png'}}}},
      {_id: 'doc2', _type: 'bike', name: 'Dupe', image: {_type: 'image', asset: {_ref: 'image-6dcdb82c282dbe0a09ff7a6b58b639732f2fb8de-3360x840-png'}}},
      {_id: 'doc3', _type: 'bike', name: 'Tandem', image: {_type: 'image', asset: {_ref: 'image-31befc6dfa0315d6c535b8a57e34f86c18eb5f20-310x282-jpg'}}},
      {_id: 'datMuxAsset', _type: 'mux.videoAsset', assetId: 'someAssetId'},
      {_id: 'refsDatMuxAsset', _type: 'bike', video: {_type: 'mux.video', asset: {_ref: 'datMuxAsset'}}},
      {_id: 'mzFgq1cvHSEeGscxBsRFoqKG', _type: 'sanity.imageAsset', url: 'https://cdn.sanity.io/images/__fixtures__/__test__/mzFgq1cvHSEeGscxBsRFoqKG-2048x1364.jpg'},
      {_id: 'image-54e9595477915230501dfec656c8e86235bb470a-dads3360x840-png', _type: 'sanity.imageAsset', url: 'https://cdn.sanity.io/images/__fixtures__/__test__/6dcdb82c282dbe0a09ff7a6b58b639732f2fb8de-3360x840.png'},
      {_id: 'image-31befc6dfa0315d6c535b8a57e34f86c18eb5f20-310x282-jpg', _type: 'sanity.imageAsset', url: 'https://cdn.sanity.io/images/__fixtures__/__test__/31befc6dfa0315d6c535b8a57e34f86c18eb5f20-310x282.jpg'},
      {_id: 'plain', _type: 'bike', name: 'Broom'}
    ]

    const assetHandler = getAssetHandler()
    arrayToStream(docs)
      .pipe(split(JSON.parse))
      .pipe(assetHandler.rewriteAssets)
      .pipe(miss.concat(onComplete))

    async function onComplete(newDocs) {
      expect(newDocs).toHaveLength(6)
      expect(docById(newDocs, 'doc1')).toMatchSnapshot('Rewritten asset for doc1')
      expect(docById(newDocs, 'doc2')).toMatchSnapshot('Rewritten asset for doc2')
      expect(docById(newDocs, 'doc3')).toMatchSnapshot('Rewritten asset for doc3')
      expect(docById(newDocs, 'plain')).toMatchSnapshot('Nothing rewritten in assetless doc')
      expect(docById(newDocs, 'refsDatMuxAsset')).toMatchSnapshot(
        'Nothing rewritten if pattern doesnt match Sanity asset',
      )

      await assetHandler.finish()
      expect(assetHandler.filesWritten).toEqual(3)
      done()
    }
  })

  test('can remove asset documents', (done) => {
    // prettier-ignore
    const docs = [
      {_id: 'doc1', _type: 'bike', name: 'Scooter', image: {_type: 'image', caption: 'Scooter bike', asset: {_ref: 'image-6dcdb82c282dbe0a09ff7a6b58b639732f2fb8de-3360x840-png'}}},
      {_id: 'doc2', _type: 'bike', name: 'Dupe', image: {_type: 'image', asset: {_ref: 'image-6dcdb82c282dbe0a09ff7a6b58b639732f2fb8de-3360x840-png'}}},
      {_id: 'doc3', _type: 'bike', name: 'Tandem', image: {_type: 'image', asset: {_ref: 'image-31befc6dfa0315d6c535b8a57e34f86c18eb5f20-310x282-jpg'}}},
      {_id: 'mzFgq1cvHSEeGscxBsRFoqKG', _type: 'sanity.imageAsset', url: 'https://cdn.sanity.io/images/__fixtures__/__test__/mzFgq1cvHSEeGscxBsRFoqKG-2048x1364.jpg'},
      {_id: 'image-6dcdb82c282dbe0a09ff7a6b58b639732f2fb8de-3360x840-png', _type: 'sanity.imageAsset', url: 'https://cdn.sanity.io/images/__fixtures__/__test__/6dcdb82c282dbe0a09ff7a6b58b639732f2fb8de-3360x840.png'},
      {_id: 'image-31befc6dfa0315d6c535b8a57e34f86c18eb5f20-310x282-jpg', _type: 'sanity.imageAsset', url: 'https://cdn.sanity.io/images/__fixtures__/__test__/31befc6dfa0315d6c535b8a57e34f86c18eb5f20-310x282.jpg'},
      {_id: 'plain', _type: 'bike', name: 'Broom'}
    ]

    const assetHandler = getAssetHandler()
    arrayToStream(docs)
      .pipe(split(JSON.parse))
      .pipe(assetHandler.stripAssets)
      .pipe(miss.concat(onComplete))

    async function onComplete(newDocs) {
      expect(newDocs).toHaveLength(4)
      expect(docById(newDocs, 'doc1')).toMatchSnapshot('doc1 with no image asset')
      expect(docById(newDocs, 'doc2')).toMatchSnapshot('doc2 with no image asset')
      expect(docById(newDocs, 'doc3')).toMatchSnapshot('doc3 with no image asset')
      expect(docById(newDocs, 'plain')).toMatchSnapshot('Nothing removed in assetless doc')

      await assetHandler.finish()
      expect(assetHandler.filesWritten).toEqual(0)
      done()
    }
  })

  test('downloads assets that are not referenced by documents', (done) => {
    // prettier-ignore
    const docs = [
      {_id: 'image-6dcdb82c282dbe0a09ff7a6b58b639732f2fb8de-3360x840-png', _type: 'sanity.imageAsset', url: 'https://cdn.sanity.io/images/__fixtures__/__test__/6dcdb82c282dbe0a09ff7a6b58b639732f2fb8de-3360x840.png'},
      {_id: 'mzFgq1cvHSEeGscxBsRFoqKG', _type: 'sanity.imageAsset', url: 'https://cdn.sanity.io/images/__fixtures__/__test__/mzFgq1cvHSEeGscxBsRFoqKG-2048x1364.jpg'},
      {_id: 'plain', _type: 'bike', name: 'Broom'}
    ]

    const assetHandler = getAssetHandler()
    arrayToStream(docs)
      .pipe(split(JSON.parse))
      .pipe(assetHandler.rewriteAssets)
      .pipe(miss.concat(onComplete))

    async function onComplete(newDocs) {
      expect(newDocs).toHaveLength(1)
      expect(docById(newDocs, 'plain')).toMatchObject(docs[2])

      await assetHandler.finish()
      expect(assetHandler.filesWritten).toEqual(2)
      done()
    }
  })

  test('can skip asset documents', (done) => {
    // prettier-ignore
    const docs = [
      {_id: 'doc1', _type: 'bike', name: 'Scooter', image: {_type: 'image', caption: 'Scooter bike', asset: {_ref: 'image-6dcdb82c282dbe0a09ff7a6b58b639732f2fb8de-3360x840-png'}}},
      {_id: 'doc2', _type: 'bike', name: 'Dupe', image: {_type: 'image', asset: {_ref: 'image-6dcdb82c282dbe0a09ff7a6b58b639732f2fb8de-3360x840-png'}}},
      {_id: 'doc3', _type: 'bike', name: 'Tandem', image: {_type: 'image', asset: {_ref: 'image-31befc6dfa0315d6c535b8a57e34f86c18eb5f20-310x282-jpg'}}},
      {_id: 'mzFgq1cvHSEeGscxBsRFoqKG', _type: 'sanity.imageAsset', url: 'https://cdn.sanity.io/images/__fixtures__/__test__/mzFgq1cvHSEeGscxBsRFoqKG-2048x1364.jpg'},
      {_id: 'image-6dcdb82c282dbe0a09ff7a6b58b639732f2fb8de-3360x840-png', _type: 'sanity.imageAsset', url: 'https://cdn.sanity.io/images/__fixtures__/__test__/6dcdb82c282dbe0a09ff7a6b58b639732f2fb8de-3360x840.png'},
      {_id: 'image-31befc6dfa0315d6c535b8a57e34f86c18eb5f20-310x282-jpg', _type: 'sanity.imageAsset', url: 'https://cdn.sanity.io/images/__fixtures__/__test__/31befc6dfa0315d6c535b8a57e34f86c18eb5f20-310x282.jpg'},
      {_id: 'plain', _type: 'bike', name: 'Broom'}
    ]

    const assetHandler = getAssetHandler()
    arrayToStream(docs)
      .pipe(split(JSON.parse))
      .pipe(assetHandler.skipAssets)
      .pipe(miss.concat(onComplete))

    async function onComplete(newDocs) {
      expect(newDocs).toHaveLength(4)
      expect(docById(newDocs, 'doc1')).toMatchObject(docs[0])
      expect(docById(newDocs, 'doc2')).toMatchObject(docs[1])
      expect(docById(newDocs, 'doc3')).toMatchObject(docs[2])
      expect(docById(newDocs, 'plain')).toMatchObject(docs[6])

      await assetHandler.finish()
      expect(assetHandler.filesWritten).toEqual(0)
      done()
    }
  })
})
