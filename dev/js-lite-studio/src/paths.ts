/**
 * Document paths (`['bio', {_key: 'a'}, 'children', 0]`) and their string form
 * (`bio[_key=="a"].children[0]`), which is both what `@sanity/util/paths` prints and the JSONMatch
 * syntax patches address values with.
 */
import {isObject} from './util'

export type PathSegment = string | number | {_key: string}
export type Path = PathSegment[]

export function pathToString(path: Path): string {
  let out = ''
  for (const segment of path) {
    if (typeof segment === 'number') out += `[${segment}]`
    else if (typeof segment === 'string') out += out ? `.${segment}` : segment
    else out += `[_key==${JSON.stringify(segment._key)}]`
  }
  return out
}

const SEGMENT =
  /([A-Za-z_$][\w$-]*)|\[(-?\d+)\]|\[_key\s*==\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')\]|(\.)/y

export function parsePath(text: string): Path {
  const path: Path = []
  SEGMENT.lastIndex = 0
  while (SEGMENT.lastIndex < text.length) {
    const match = SEGMENT.exec(text)
    if (!match) throw new Error(`Invalid path ${text}`)
    if (match[1] !== undefined) path.push(match[1])
    else if (match[2] !== undefined) path.push(Number(match[2]))
    else if (match[3] !== undefined) {
      const quoted = match[3]
      path.push({
        _key: quoted.startsWith("'")
          ? quoted.slice(1, -1).replace(/\\(.)/g, '$1')
          : (JSON.parse(quoted) as string),
      })
    }
  }
  return path
}

export function getAt(value: unknown, path: Path): unknown {
  let current = value
  for (const segment of path) {
    if (current === undefined || current === null) return undefined
    if (typeof segment === 'string') {
      current = isObject(current) ? current[segment] : undefined
    } else if (typeof segment === 'number') {
      if (!Array.isArray(current)) return undefined
      current = current.at(segment)
    } else {
      current = Array.isArray(current)
        ? current.find((item) => isObject(item) && item._key === segment._key)
        : undefined
    }
  }
  return current
}

function sameSegment(a: PathSegment, b: PathSegment): boolean {
  if (typeof a === 'object' && typeof b === 'object') return a._key === b._key
  return a === b
}

export function samePath(a: Path, b: Path): boolean {
  return a.length === b.length && a.every((segment, index) => sameSegment(segment, b[index]))
}

export function pathStartsWith(path: Path, prefix: Path): boolean {
  return (
    prefix.length <= path.length &&
    prefix.every((segment, index) => sameSegment(segment, path[index]))
  )
}
