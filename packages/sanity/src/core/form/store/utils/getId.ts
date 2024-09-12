import {nanoid} from 'nanoid'

const idCache = new WeakMap<object, string>()
const undefinedKey = Symbol('GetIdUndefined')
const nullKey = Symbol('GetIdNull')

export function getId(value: unknown): string {
  switch (typeof value) {
    case 'undefined': {
      return getId(undefinedKey)
    }
    case 'function':
    case 'object':
    case 'symbol': {
      if (value === null) return getId(nullKey)

      const cached = idCache.get(value as object)
      if (cached) return cached

      const id = nanoid()
      idCache.set(value as object, id)
      return id
    }
    default: {
      return `${value}`
    }
  }
}
