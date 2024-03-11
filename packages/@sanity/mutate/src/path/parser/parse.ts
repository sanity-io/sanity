import {type PathElement} from '../types'
import {type StringToPath} from './types'

export function parse<const T extends string>(path: T): StringToPath<T> {
  return path
    .split(/[[.\]]/g)
    .filter(Boolean)
    .map(seg => (seg.includes('==') ? parseSegment(seg) : coerce(seg))) as any
}

const IS_NUMERIC = /^-?\d+$/

function unquote(str: string) {
  return str.replace(/^['"]/, '').replace(/['"]$/, '')
}

function parseSegment(segment: string): PathElement {
  const [key, value] = segment.split('==')
  if (key !== '_key') {
    throw new Error(
      `Currently only "_key" is supported as path segment. Found ${key}`,
    )
  }
  if (typeof value === 'undefined') {
    throw new Error('Invalid path segment, expected `key=="value"`')
  }
  return {_key: unquote(value)}
}

function coerce(segment: string): PathElement {
  return IS_NUMERIC.test(segment) ? Number(segment) : segment
}
