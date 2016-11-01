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
const IS_NUMBER = /^-?\d+$/
const flatten = arr => arr.reduce((acc, v) => acc.concat(v), [])
function toArrayPath(jsonPath) {
  return flatten(jsonPath.split('.').map(segment => {
    return segment
      .split(/[[\]]/)
      .filter(Boolean)
      .map(val => {
        return IS_NUMBER.test(val) ? Number(val) : val
      })
  }))
}

export function toGradient(formBuilderPatch) {
  const jsonPath = toJSONPath(formBuilderPatch.path)

  if (formBuilderPatch.type === 'insert') {
    const {position, items} = formBuilderPatch
    return {
      insert: {
        [position]: jsonPath,
        items
      }
    }
  }
  return {
    [formBuilderPatch.type]: {
      [jsonPath]: formBuilderPatch.value
    }
  }
}

const PATCH_ORDER = ['set', 'setIfMissing', 'merge', 'unset', 'inc', 'dec', 'insert']
function byGradientSpecifiedPatchOrder(patchType, otherPatchType) {
  return PATCH_ORDER.indexOf(patchType) - PATCH_ORDER.indexOf(otherPatchType)
}
export function toFormBuilder(gradientPatch) {
  return flatten(Object.keys(gradientPatch)
    .sort(byGradientSpecifiedPatchOrder)
    .map(patchType => {
      const operation = gradientPatch[patchType]
      if (patchType === 'insert') {
        const position = Object.keys(gradientPatch.insert)[0]
        const path = toArrayPath(gradientPatch.insert[position])
        return {
          type: 'insert',
          path: path,
          position: position,
          items: gradientPatch.insert.items
        }
      }
      return Object.keys(operation)
        .map(jsonPath => {
          return {
            type: patchType,
            path: toArrayPath(jsonPath),
            value: operation[jsonPath]
          }
        })
    }))
}
