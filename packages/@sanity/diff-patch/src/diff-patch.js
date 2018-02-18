/* eslint-disable import/no-commonjs */
const ignoredKeys = ['_id', '_type', '_createdAt', '_updatedAt', '_rev']

function diffPatch(itemA, itemB, basePath = []) {
  const operations = diffItem(itemA, itemB, basePath, [])
  const optimized = optimizePatches(operations, itemA, itemB)
  return serializePatches(optimized)
}

function diffItem(itemA, itemB, basePath, patches) {
  if (itemA === itemB) {
    return patches
  }

  const aType = typeof itemA
  const bType = typeof itemB

  if (aType === 'undefined' && bType !== 'undefined') {
    patches.push({op: 'set', path: basePath, value: itemB})
    return patches
  }

  if (bType === 'undefined' && aType !== 'undefined') {
    patches.push({op: 'unset', path: basePath})
    return patches
  }

  const dataType = aType === 'undefined' ? bType : aType

  if (dataType === 'object') {
    return Array.isArray(itemA)
      ? diffArray(itemA, itemB, basePath, patches)
      : diffObject(itemA, itemB, basePath, patches)
  }

  return diffPrimitive(itemA, itemB, basePath, patches)
}

function diffObject(itemA, itemB, basePath, patches) {
  if (typeof itemB !== typeof itemA) {
    patches.push({op: 'set', path: basePath, value: itemB})
    return patches
  }

  const aKeys = Object.keys(itemA).filter(withoutReadOnly)
  const aKeysLength = aKeys.length
  const bKeys = Object.keys(itemB).filter(withoutReadOnly)
  const bKeysLength = bKeys.length

  // Check for deleted items
  for (let i = 0; i < aKeysLength; i++) {
    const key = aKeys[i]
    if (!(key in itemB)) {
      patches.push({op: 'unset', path: basePath.concat(key)})
    }
  }

  // Check for changed items
  for (let i = 0; i < bKeysLength; i++) {
    const key = bKeys[i]
    diffItem(itemA[key], itemB[key], basePath.concat([key]), patches)
  }

  return patches
}

function diffArray(itemA, itemB, basePath, patches) {
  if (!Array.isArray(itemA) || !Array.isArray(itemB)) {
    patches.push({op: 'set', path: basePath, value: itemB})
    return patches
  }

  // Check for new items
  if (itemB.length > itemA.length) {
    patches.push({
      op: 'insert',
      after: basePath.concat([-1]),
      items: itemB.slice(itemA.length)
    })
  }

  // Check for deleted items
  if (itemB.length < itemA.length) {
    patches.push({
      op: 'unset',
      path: basePath.concat([[itemB.length, '']])
    })
  }

  // Check for changed items
  // @todo This currently also sets new items, which should instead be handled with an `insert`-
  // operation, but we can't currently represent multiple insert operations in the same patch,
  // so for now this is the best we can do. Change to simply iterate up to itemA's length.
  for (let i = 0; i < itemB.length; i++) {
    diffItem(itemA[i], itemB[i], basePath.concat(i), patches)
  }

  return patches
}

function diffPrimitive(itemA, itemB, basePath, patches) {
  if (itemA !== itemB) {
    patches.push({
      op: 'set',
      path: basePath,
      value: itemB
    })
  }

  return patches
}

function withoutReadOnly(key) {
  return ignoredKeys.indexOf(key) === -1
}

function optimizePatches(patches, itemA, itemB) {
  return patches
}

function serializePatches(patches) {
  if (patches.length === 0) {
    return null
  }

  return patches.reduce((patch, item) => {
    const path = pathToString(item.path || item.after)

    if (item.op === 'set') {
      patch.set = patch.set || {}
      patch.set[path] = item.value
    } else if (item.op === 'unset') {
      patch.unset = patch.unset || []
      patch.unset.push(path)
    } else if (item.op === 'insert') {
      // Intentional noop, see `diffArray()` for explanation
    } else {
      throw new Error(`Unknown patch operation "${item.op}"`)
    }

    return patch
  }, {})
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
