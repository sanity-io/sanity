/* eslint-disable import/no-commonjs */
const ignoredKeys = ['_id', '_type', '_createdAt', '_updatedAt', '_rev']

function diffPatch(itemA, itemB, options = {}) {
  const id = options.id || (itemA._id === itemB._id && itemA._id)
  const ifRevisionID = options.ifRevisionID || options.ifRevisionId
  if (!id) {
    throw new Error(
      '_id on itemA and itemB not present or differs, specify document id the mutations should be applied to'
    )
  }

  const basePath = options.basePath || []
  const operations = diffItem(itemA, itemB, basePath, [])
  const optimized = optimizePatches(operations, itemA, itemB)
  const serializeOptions = ifRevisionID ? {id, ifRevisionID} : {id}
  return serializePatches(optimized, serializeOptions)
}

// eslint-disable-next-line complexity
function diffItem(itemA, itemB, path, patches) {
  if (itemA === itemB) {
    return patches
  }

  const aType = Array.isArray(itemA) ? 'array' : typeof itemA
  const bType = Array.isArray(itemB) ? 'array' : typeof itemB

  const aIsUndefined = aType === 'undefined'
  const bIsUndefined = bType === 'undefined'

  if (aIsUndefined && !bIsUndefined) {
    patches.push({op: 'set', path, value: itemB})
    return patches
  }

  if (!aIsUndefined && bIsUndefined) {
    patches.push({op: 'unset', path})
    return patches
  }

  const dataType = aIsUndefined ? bType : aType
  const isContainer = dataType === 'object' || dataType === 'array'
  if (!isContainer) {
    return diffPrimitive(itemA, itemB, path, patches)
  }

  if (aType !== bType) {
    // Array => Object / Object => Array
    patches.push({op: 'set', path, value: itemB})
    return patches
  }

  return dataType === 'array'
    ? diffArray(itemA, itemB, path, patches)
    : diffObject(itemA, itemB, path, patches)
}

function diffObject(itemA, itemB, path, patches) {
  const aKeys = Object.keys(itemA).filter(withoutReadOnly)
  const aKeysLength = aKeys.length
  const bKeys = Object.keys(itemB).filter(withoutReadOnly)
  const bKeysLength = bKeys.length

  // Check for deleted items
  for (let i = 0; i < aKeysLength; i++) {
    const key = aKeys[i]
    if (!(key in itemB)) {
      patches.push({op: 'unset', path: path.concat(key)})
    }
  }

  // Check for changed items
  for (let i = 0; i < bKeysLength; i++) {
    const key = bKeys[i]
    diffItem(itemA[key], itemB[key], path.concat([key]), patches)
  }

  return patches
}

function diffArray(itemA, itemB, path, patches) {
  // Check for new items
  if (itemB.length > itemA.length) {
    patches.push({
      op: 'insert',
      after: path.concat([-1]),
      items: itemB.slice(itemA.length)
    })
  }

  // Check for deleted items
  if (itemB.length < itemA.length) {
    const isSingle = itemA.length - itemB.length === 1
    patches.push({
      op: 'unset',
      path: path.concat([isSingle ? itemB.length : [itemB.length, '']])
    })
  }

  const overlapping = Math.min(itemA.length, itemB.length)
  const segmentA = itemA.slice(0, overlapping)
  const segmentB = itemB.slice(0, overlapping)
  const isKeyed = isUniquelyKeyed(segmentA) && isUniquelyKeyed(segmentB)
  return isKeyed
    ? diffArrayByKey(segmentA, segmentB, path, patches)
    : diffArrayByIndex(segmentA, segmentB, path, patches)
}

function diffArrayByIndex(itemA, itemB, path, patches) {
  // Check for changed items
  for (let i = 0; i < itemA.length; i++) {
    diffItem(itemA[i], itemB[i], path.concat(i), patches)
  }

  return patches
}

function diffArrayByKey(itemA, itemB, path, patches) {
  const keyedA = indexByKey(itemA)
  const keyedB = indexByKey(itemB)

  // There's a bunch of hard/semi-hard problems related to using keys
  // Unless we have the exact same order, just use indexes for now
  if (!arrayIsEqual(keyedA.keys, keyedB.keys)) {
    return diffArrayByIndex(itemA, itemB, path, patches)
  }

  for (let i = 0; i < keyedB.keys.length; i++) {
    const key = keyedB.keys[i]
    diffItem(keyedA.index[key], keyedB.index[key], path.concat({_key: key}), patches)
  }

  return patches
}

function diffPrimitive(itemA, itemB, path, patches) {
  patches.push({
    op: 'set',
    path,
    value: itemB
  })

  return patches
}

function withoutReadOnly(key) {
  return ignoredKeys.indexOf(key) === -1
}

function optimizePatches(patches, itemA, itemB) {
  return patches
}

function serializePatches(patches, options) {
  if (patches.length === 0) {
    return []
  }

  const set = patches.filter(patch => patch.op === 'set')
  const unset = patches.filter(patch => patch.op === 'unset')
  const insert = patches.filter(patch => patch.op === 'insert')

  const withSet =
    set.length > 0 &&
    set.reduce(
      (patch, item) => {
        const path = pathToString(item.path)
        patch.set[path] = item.value
        return patch
      },
      {...options, set: {}}
    )

  const withUnset =
    unset.length > 0 &&
    unset.reduce(
      (patch, item) => {
        const path = pathToString(item.path)
        patch.unset.push(path)
        return patch
      },
      {...options, unset: []}
    )

  const withInsert = insert.reduce((acc, item) => {
    const after = pathToString(item.after)
    return acc.concat({...options, insert: {after, items: item.items}})
  }, [])

  return [withSet, withUnset, ...withInsert].filter(Boolean).map(patch => ({patch}))
}

function isUniquelyKeyed(arr) {
  const keys = []

  for (let i = 0; i < arr.length; i++) {
    const key = arr[i] && arr[i]._key
    if (!key || keys.indexOf(key) !== -1) {
      return false
    }

    keys.push(key)
  }

  return true
}

function indexByKey(arr) {
  return arr.reduce(
    (acc, item) => {
      acc.keys.push(item._key)
      acc.index[item._key] = item
      return acc
    },
    {keys: [], index: {}}
  )
}

function arrayIsEqual(itemA, itemB) {
  return itemA.length === itemB.length && itemA.every((item, i) => itemB[i] === item)
}

function pathToString(path) {
  return path.reduce((target, segment, i) => {
    if (Array.isArray(segment)) {
      return `${target}[${segment.join(':')}]`
    }

    const segmentType = typeof segment
    if (segmentType === 'number' || /^\d+$/.test(segment)) {
      return `${target}[${segment}]`
    }

    if (segmentType === 'string') {
      const separator = i === 0 ? '' : '.'
      return `${target}${separator}${segment}`
    }

    if (segment._key) {
      return `${target}[_key=="${segment._key}"]`
    }

    throw new Error(`Unsupported path segment "${segment}"`)
  }, '')
}

module.exports = diffPatch
