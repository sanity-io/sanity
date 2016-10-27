function toJSONPath(pathArray) {
  return pathArray.reduce((acc, segment, index) => {
    const isIdx = typeof segment === 'number'
    if (index === 0 && isIdx) {
      throw new Error('Cannot start with array index')
    }
    if (isIdx) {
      return `${acc}[${segment}]`
    }
    return index > 0 ? `${acc}.${segment}` : segment
  }, '')
}
const IS_NUMBER = /^\d+$/
const flatten = arr => arr.reduce((acc, v) => acc.concat(v), [])
function toArrayPath(jsonPath) {
  return flatten(jsonPath.split('.').map(segment => {
    return segment
      .split(/[\[\]]/)
      .filter(Boolean)
      .map(val => {
        return IS_NUMBER.test(val) ? Number(val) : val
      })
  }))
}

export function toGradient(formBuilderPatch) {
  return {
    [formBuilderPatch.type]: {
      [toJSONPath(formBuilderPatch.path)]: formBuilderPatch.value
    }
  }
}

const PATCH_ORDER = ['set', 'setIfMissing', 'merge', 'unset', 'inc', 'dec', 'append', 'prepend']
function byGradientSpecifiedPatchOrder(patchType, otherPatchType) {
  return PATCH_ORDER.indexOf(patchType) - PATCH_ORDER.indexOf(otherPatchType)
}
export function toFormBuilder(gradientPatch) {
  return flatten(Object.keys(gradientPatch).map(patchType => {
    const operation = gradientPatch[patchType]
    return Object.keys(operation)
      .sort(byGradientSpecifiedPatchOrder)
      .map(jsonPath => {
        return {
          type: patchType,
          path: toArrayPath(jsonPath),
          value: operation[jsonPath]
        }
      })
  }))
}
