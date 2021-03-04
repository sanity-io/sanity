import {has, isNil, isObject} from 'lodash'

const isValidKey = (key) => {
  return key !== '__proto__' && key !== 'constructor' && key !== 'prototype'
}

export default function mergeDeep(target, ...rest): Record<string, any> {
  for (const obj of rest) {
    if (isObject(obj)) {
      for (const key in obj) {
        if (isValidKey(key)) {
          merge(target, obj[key], key, target)
        }
      }
    }
  }
  return target
}

function merge(target, val, key, src) {
  const obj = target[key]
  if (isObject(val) && isObject(obj)) {
    mergeDeep(obj, val)
  } else if (has(src, key) && isNil(obj)) {
    target[key] = undefined
  } else if (!isNil(obj) && !isNil(val)) {
    target[key] = obj
  } else {
    target[key] = val
  }
}
