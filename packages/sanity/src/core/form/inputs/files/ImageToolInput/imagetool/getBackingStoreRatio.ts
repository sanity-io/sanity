const testProperties = ['', 'webkit', 'moz', 'ms', 'o'].map(
  (prefix) => `${prefix}backingStoreRatio`,
)
let foundProperty: number | string | undefined = -1

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function getBackingStoreRatio(context: CanvasRenderingContext2D) {
  if (foundProperty === -1) {
    foundProperty = testProperties.find((testProperty) => testProperty in context)
  }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  return foundProperty && context[foundProperty]
}
