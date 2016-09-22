
const testProperties = ['', 'webkit', 'moz', 'ms', 'o'].map(prefix => `${prefix}backingStoreRatio`)
let foundProperty = -1

export default function getBackingStoreRatio(context) {
  if (foundProperty === -1) {
    foundProperty = testProperties.find(testProperty => testProperty in context)
  }
  return foundProperty && context[foundProperty]
}
