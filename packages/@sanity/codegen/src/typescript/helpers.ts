import path from 'node:path'

import {CodeGenerator} from '@babel/generator'
import * as t from '@babel/types'

import {RESERVED_IDENTIFIERS} from './constants'
import {isObject} from './types'

export function normalizePath(root: string, filename: string) {
  const resolved = path.resolve(root, filename)
  return path.relative(root, resolved)
}

export function sanitizeIdentifier(input: string): string {
  return `${input.replace(/^\d/, '_').replace(/[^$\w]+(.)/g, (_, char) => char.toUpperCase())}`
}

export function normalizeIdentifier(input: string): string {
  const sanitized = sanitizeIdentifier(input)
  return `${sanitized.charAt(0).toUpperCase()}${sanitized.slice(1)}`
}

export function getUniqueIdentifierForName(name: string, currentIdentifiers: Set<string>) {
  const desiredName = normalizeIdentifier(name)
  let resultingName = desiredName
  let index = 2
  while (currentIdentifiers.has(resultingName) || RESERVED_IDENTIFIERS.has(resultingName)) {
    resultingName = `${desiredName}_${index}`
    index++
  }
  return t.identifier(resultingName)
}

export function computeOnce<TReturn>(fn: () => TReturn): () => TReturn {
  const ref = {current: undefined as TReturn | undefined, computed: false}

  return function () {
    if (ref.computed) return ref.current as TReturn
    ref.current = fn()
    ref.computed = true
    return ref.current
  }
}

export function weakMapMemo<TParam extends object, TReturn>(fn: (arg: TParam) => TReturn) {
  const cache = new WeakMap<object, TReturn>()

  const wrapped = function (arg: TParam) {
    if (cache.has(arg)) return cache.get(arg)!
    const result = fn(arg)
    cache.set(arg, result)
    return result
  }

  return wrapped
}

export function generateCode(node: t.Node) {
  return `${new CodeGenerator(node).generate().code.trim()}\n\n`
}

const isRollupRange = (node: unknown): node is {start: number; end: number} => {
  if (!node) return false
  if (typeof node !== 'object') return false
  return (
    'start' in node &&
    'end' in node &&
    typeof node.start === 'number' &&
    typeof node.end === 'number'
  )
}
const rangeProxyCache = new WeakMap<object, any>()

export function proxyRollupRangeToEstree<T>(node: T): T {
  if (!isObject(node)) return node
  const cached = rangeProxyCache.get(node)
  if (cached) return cached

  const wrapped = new Proxy(node, {
    get: (target, property, receiver) => {
      const original = Reflect.get(target, property, receiver)
      if (!isObject(target)) return original

      if (property === 'range' && isRollupRange(target)) {
        return [target.start, target.end]
      }
      return proxyRollupRangeToEstree(original)
    },
  })
  rangeProxyCache.set(node, wrapped)
  return wrapped
}

export function overrideProperty<T extends object, K extends keyof T>(
  obj: T,
  property: K,
  override: T[K],
): T {
  return new Proxy(obj, {
    get: (...args) => {
      const [, incomingProperty] = args
      if (incomingProperty === property) return override
      return Reflect.get(...args)
    },
  })
}

const tupleCache = new WeakMap<object, WeakMap<object, [unknown, unknown]>>()

export type StableTuple<T extends object, U extends object> = {readonly __kind: 'tuple'} & [T, U]
export function stableTuple<T extends object, U extends object>(a: T, b: U): StableTuple<T, U> {
  const map = tupleCache.get(a) ?? new WeakMap<object, [T, U]>()
  if (!tupleCache.has(a)) {
    tupleCache.set(a, map)
  }

  const cached = map.get(b)
  if (cached) return cached as StableTuple<T, U>

  const tuple = [a, b] as StableTuple<T, U>
  map.set(b, tuple)
  return tuple as StableTuple<T, U>
}

export function* take<T>(iterator: Iterable<T>, limit: number): Generator<T> {
  let count = 0
  for (const item of iterator) {
    if (count > limit) return
    yield item
    count++
  }
}
