import {type AnyArray} from '../../utils/typeUtils'
import {type KeyedPathElement, type Path, type PathElement} from '../types'
import {isArrayElement, isKeyedElement} from '../utils/predicates'
import {type FindInArray} from './types'

export type {AnyArray} from '../../utils/typeUtils'

export type Get<
  P extends number | KeyedPathElement | Readonly<KeyedPathElement> | string,
  T,
> = T extends AnyArray
  ? P extends KeyedPathElement | Readonly<KeyedPathElement> | number
    ? FindInArray<P, T>
    : undefined
  : P extends keyof T
    ? T[P]
    : never

export type GetAtPath<P extends readonly PathElement[], T> = P extends []
  ? T
  : P extends [infer Head, ...infer Tail]
    ? Head extends PathElement
      ? Tail extends PathElement[]
        ? GetAtPath<Tail, Get<Head, T>>
        : undefined
      : undefined
    : undefined

export function getAtPath<const Head extends PathElement, const T>(
  path: [head: Head],
  value: T,
): Get<Head, T>
export function getAtPath<
  const Head extends PathElement,
  const Tail extends PathElement[],
  T,
>(path: [head: Head, ...tail: Tail], value: T): GetAtPath<[Head, ...Tail], T>
export function getAtPath<T>(path: [], value: T): T
export function getAtPath(path: Path, value: unknown): unknown
export function getAtPath(path: Path, value: unknown): unknown {
  if (path.length === 0) {
    return value
  }

  let current = value
  for (const head of path) {
    if (isArrayElement(head)) {
      if (!Array.isArray(current)) {
        return undefined
      }

      if (isKeyedElement(head)) {
        current = current.find(item => item._key === head._key)
        continue
      }
      current = current[head]
      continue
    }
    current = (current as any)[head]
  }
  return current
}
