import path from 'node:path'

import {CodeGenerator} from '@babel/generator'
import * as t from '@babel/types'

import {RESERVED_IDENTIFIERS} from './constants'

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
