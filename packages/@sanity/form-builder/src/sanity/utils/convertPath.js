// @flow
import {arrayToJSONMatchPath} from '@sanity/mutator'
import type {Path, PathSegment} from '../../typedefs/path'

const IS_NUMERIC = /^\d+$/

function unquote(str) {
  return str.replace(/^['"]/, '').replace(/['"]$/, '')
}

function splitAttr(segment) {
  const [attr, key] = segment.split('==')
  return {[attr]: unquote(key)}
}

function coerce(segment: string): PathSegment {
  return IS_NUMERIC.test(segment) ? Number(segment) : segment
}

function parseGradientPath(focusPathStr): Path {
  return focusPathStr
    .split(/[[.\]]/g)
    .filter(Boolean)
    .map(seg => (seg.includes('==') ? splitAttr(seg) : coerce(seg)))
}

export function toGradient(formBuilderPath: Path): string {
  return arrayToJSONMatchPath(formBuilderPath)
}

export function toFormBuilder(gradientPath: string) {
  return parseGradientPath(gradientPath)
}
