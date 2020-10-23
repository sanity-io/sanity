// 2017-06-01T12:00:00.000Z
const baseTime = 1496318400000
const reverse = (str) => str.split('').reverse().join('')
const timestamp = (diff) => new Date(baseTime + diff).toISOString().replace(/\.\d+Z$/, 'Z')

exports.getSnapshotFixture = (fromIndex = 0, toIndex = 100) => {
  const items = []

  // Start off with some items that are basically equal sorting-wise,
  // so we'll have to use ID to differentiate
  let productIndex = -1
  const baseTimeDiff = 86400 * 1000
  const initialUpdatedAt = timestamp(baseTimeDiff)
  const baseId = 'abcdefghijklmnopqrstuvwxyz'
  for (let i = 0; i < 10; i++) {
    items.push({
      _id: baseId.slice(i),
      name: `Product ${++productIndex}`,
      productIndex,
      _updatedAt: initialUpdatedAt,
    })
  }

  // Follow up with a bunch of items that were created later and have different updated at
  for (let i = 0; i < 20; i++) {
    items.push({
      _id: `2-${reverse(baseId).slice(i)}`,
      name: `Product ${++productIndex}`,
      productIndex,
      _updatedAt: timestamp(baseTimeDiff - (i + 1) * 3000),
    })
  }

  // Follow up with some more duplicate timestamps
  const secondUpdatedAt = timestamp(0 - 86000 * 1000)
  for (let i = 0; i < 15; i++) {
    items.push({
      _id: `3-${baseId.slice(i)}`,
      name: `Product ${++productIndex}`,
      productIndex,
      _updatedAt: secondUpdatedAt,
    })
  }

  // Round off with a big set of trailing items
  for (let i = 0; i < 200; i++) {
    items.push({
      _id: `4-group-${productIndex}`,
      name: `Product ${++productIndex}`,
      productIndex,
      _updatedAt: timestamp(0 - (260000 * 1000 - i * 3000)),
    })
  }

  return items.slice(fromIndex, toIndex)
}
