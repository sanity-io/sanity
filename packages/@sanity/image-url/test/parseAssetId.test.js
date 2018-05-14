import parseAssetId from '../src/parseAssetId'

test('throws on invalid document id', () => {
  expect(() => parseAssetId('moop')).toThrowErrorMatchingSnapshot()
})

test('throws on invalid dimensions', () => {
  expect(() => parseAssetId('image-assetId-mooxmoo-png')).toThrowErrorMatchingSnapshot()
})
