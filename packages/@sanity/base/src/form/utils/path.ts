import {arrayToJSONMatchPath} from '@sanity/mutator'
import {Path, PathSegment} from '@sanity/types'

const IS_NUMERIC = /^\d+$/

function unquote(str: string) {
  return str.replace(/^['"]/, '').replace(/['"]$/, '')
}

function splitAttr(segment: string) {
  const [attr, key] = segment.split('==')
  return {[attr]: unquote(key)}
}

function coerce(segment: string): PathSegment {
  return IS_NUMERIC.test(segment) ? Number(segment) : segment
}

function parseGradientPath(focusPathStr: string): Path {
  return focusPathStr
    .split(/[[.\]]/g)
    .filter(Boolean)
    .map((seg) => (seg.includes('==') ? splitAttr(seg) : coerce(seg))) as Path
}

/**
 * @internal
 */
export function encodePath(formBuilderPath: Path): string {
  return arrayToJSONMatchPath(formBuilderPath)
}

/**
 * @internal
 */
export function decodePath(gradientPath: string): Path {
  return parseGradientPath(gradientPath)
}
