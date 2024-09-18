import {type SchemaType} from '@sanity/types'

function isPlainObject(obj: unknown): boolean {
  return obj !== null && typeof obj === 'object' && obj.constructor === Object
}

function isSchemaType(obj: unknown): obj is SchemaType {
  if (typeof obj !== 'object') return false
  if (!obj) return false
  if (!('jsonType' in obj) || typeof obj.jsonType !== 'string') return false
  if (!('name' in obj) || typeof obj.name !== 'string') return false
  return true
}

interface ImmutableReconcile<T> {
  (prev: T | null, curr: T): T
}

export interface CreateImmutableReconcileOptions {
  decorator?: <T>(fn: ImmutableReconcile<T>) => ImmutableReconcile<T>
}

function identity<T>(t: T) {
  return t
}

export function createImmutableReconcile({
  decorator = identity,
}: CreateImmutableReconcileOptions = {}): <T>(prev: T | null, curr: T) => T {
  const immutableReconcile = decorator(function _immutableReconcile<T>(prev: T | null, curr: T): T {
    if (prev === curr) return curr
    if (prev === null) return curr
    if (typeof prev !== 'object' || typeof curr !== 'object') return curr

    if (Array.isArray(prev) && Array.isArray(curr)) {
      if (prev.length !== curr.length) return curr

      const reconciled = curr.map((item, index) => immutableReconcile(prev[index], item))
      if (reconciled.every((item, index) => item === prev[index])) return prev
      return reconciled as T
    }

    // skip these, they're recursive structures and will cause stack overflows
    // they're stable anyway
    if (isSchemaType(prev) || isSchemaType(curr)) return curr

    // skip these as well
    if (!isPlainObject(prev) || !isPlainObject(curr)) return curr

    const prevObj = prev as Record<string, unknown>
    const currObj = curr as Record<string, unknown>

    const reconciled: Record<string, unknown> = {}
    let changed = false

    const enumerableKeys = new Set(Object.keys(currObj))

    for (const key of Object.getOwnPropertyNames(currObj)) {
      if (key in prevObj) {
        const reconciledValue = immutableReconcile(prevObj[key], currObj[key])
        if (enumerableKeys.has(key)) {
          reconciled[key] = reconciledValue
        } else {
          Object.defineProperty(reconciled, key, {
            value: reconciledValue,
            enumerable: false,
          })
        }
        changed = changed || reconciledValue !== prevObj[key]
      } else {
        if (enumerableKeys.has(key)) {
          reconciled[key] = currObj[key]
        } else {
          Object.defineProperty(reconciled, key, {
            value: currObj[key],
            enumerable: false,
          })
        }
        changed = true
      }
    }

    // Check if any keys were removed
    for (const key of Object.getOwnPropertyNames(prevObj)) {
      if (!(key in currObj)) {
        changed = true
        break
      }
    }

    return changed ? (reconciled as T) : prev
  })

  return immutableReconcile
}

export const immutableReconcile = createImmutableReconcile()
