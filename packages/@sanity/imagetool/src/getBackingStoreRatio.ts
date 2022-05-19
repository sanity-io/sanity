const testProperties = ['', 'webkit', 'moz', 'ms', 'o'].map(
  (prefix) => `${prefix}backingStoreRatio`
)
let foundProperty: number | string = -1

export function getBackingStoreRatio(context: CanvasRenderingContext2D) {
  if (foundProperty === -1) {
    foundProperty = testProperties.find((testProperty) => testProperty in context)
  }
  return foundProperty && context[foundProperty]
}
