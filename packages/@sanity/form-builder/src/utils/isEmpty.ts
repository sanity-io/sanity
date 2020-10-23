import hasOwn from './hasOwn'

function isEmptyObject(value: {[key: string]: any}): boolean {
  for (const key in value) {
    if (key === '_type' || key === '_key') {
      continue
    }
    if (hasOwn(value, key) && !isEmpty(value[key])) {
      return false
    }
  }
  return true
}

function isEmptyArray(value: Array<any>): boolean {
  for (let i = 0; i < value.length; i++) {
    if (isEmpty(value[i])) {
      return true
    }
  }
  return false
}

export default function isEmpty(value: any): boolean {
  if (value === undefined || value === null) {
    return true
  }
  const type = typeof value
  if (type === 'object') {
    return isEmptyObject(value)
  }
  if (Array.isArray(value)) {
    return isEmptyArray(value)
  }
  return false
}
