import hasOwn from '../../utils/hasOwn'
import defaultApplyPatch from './defaultApplyPatch'

function move(arr, from, to) {
  const nextValue = arr.slice()
  const val = nextValue[from]
  nextValue.splice(from, 1)
  nextValue.splice(to, 0, val)
  return nextValue
}

function defaultCreateItem(item) {
  return item
}

export default function apply(value = [], patch, {applyItemPatch = defaultApplyPatch, createItem = defaultCreateItem} = {}) {
  const nextValue = value.slice() // make a copy for internal mutation

  if (patch.path.length === 0) {
    // its directed to me
    if (patch.type === 'setIfMissing') {
      if (!Array.isArray(patch.value)) { // eslint-disable-line max-depth
        throw new Error('Cannot set value of an array to a non-array')
      }
      return patch.value.map(createItem)
    } else if (patch.type === 'set') {
      if (!Array.isArray(patch.value)) { // eslint-disable-line max-depth
        throw new Error('Cannot set value of an array to a non-array')
      }
      return patch.value.map(createItem)
    } else if (patch.type === 'prepend') {
      return [createItem(patch.value), ...nextValue]
    } else if (patch.type === 'append') {
      return [...nextValue, createItem(patch.value, nextValue.length)]
    } else if (patch.type === 'unset') {
      return undefined
    } else if (patch.type === 'move') {
      if (!patch.value || !hasOwn(patch.value, 'from') || !hasOwn(patch.value, 'to')) { // eslint-disable-line max-depth
        throw new Error(`Invalid value of 'move' patch. Expected a value with "from" and "to" indexes, instead got: ${JSON.stringify(patch.value)}`)
      }
      return move(nextValue, patch.value.from, patch.value.to)
    }
    throw new Error(`Invalid array operation: ${patch.type}`)
  }

  if (patch.path.length === 1 && patch.type === 'unset') {
    const index = patch.path[0]
    if (typeof index !== 'number') {
      throw new Error(`Expected array index to be a number, instead got "${index}"`)
    }
    nextValue.splice(index, 1)
    return nextValue
  }

  // The patch is not directed to me
  const [index, ...rest] = patch.path
  if (typeof index !== 'number') {
    throw new Error(`Expected array index to be a number, instead got "${index}"`)
  }
  nextValue[index] = applyItemPatch(nextValue[index], {
    ...patch,
    path: rest
  })
  return nextValue
}
