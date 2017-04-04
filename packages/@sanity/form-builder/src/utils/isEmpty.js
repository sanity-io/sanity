//@flow
import hasOwn from './hasOwn'

function isEmptyObject(value: {[string]: any}): boolean {
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

function isEmptyArray(value : Array<any>): boolean {
  if (value === undefined) {
    return true
  }

  for (let i = 0; i < value.length; i++) {
    if (isEmpty(value[i])) {
      return true
    }
  }
  return false
}

function isEmptyPrimitive(value : any) {
  return value === undefined
}

export default function isEmpty(value: any): boolean {
  if (value === undefined) {
    return true
  }
  const type = typeof value
  if (type === 'object' && type !== null) {
    return isEmptyObject(value)
  }
  if (Array.isArray(value)) {
    return isEmptyArray(value)
  }
  return isEmptyPrimitive(value)
}
