import {type Path} from '@sanity/types'
import * as PathUtils from '@sanity/util/paths'
import {describe, expect, it} from 'vitest'

import {type TrackedArea, type TrackedChange} from '../tracker'
import {findMostSpecificTarget} from './findMostSpecificTarget'

function trackedChange(path: Path, options: {isChanged?: boolean} = {}): TrackedChange {
  return {
    element: null,
    path,
    isChanged: options.isChanged ?? true,
    hasFocus: false,
    hasHover: false,
    hasRevertHover: false,
    zIndex: 1,
  }
}

function toValues(
  entries: [string, TrackedChange | TrackedArea][],
): Map<string, TrackedChange | TrackedArea> {
  return new Map(entries)
}

function fieldId(path: Path): string {
  return `field-${PathUtils.toString(path)}`
}

function changeId(path: Path): string {
  return `change-${PathUtils.toString(path)}`
}

describe('findMostSpecificTarget', () => {
  it('returns the target registered at the exact same path', () => {
    const field = trackedChange(['title'])
    const values = toValues([
      [fieldId(['title']), field],
      [changeId(['title']), trackedChange(['title'])],
    ])

    expect(findMostSpecificTarget('field', changeId(['title']), values)).toBe(field)
  })

  it('falls back to the closest less specific target', () => {
    // Hovering the image input in the form (registered at `image.asset`) should find the
    // change registered for the whole image field.
    const change = trackedChange(['image'])
    const values = toValues([
      [fieldId(['image', 'asset']), trackedChange(['image', 'asset'])],
      [changeId(['image']), change],
    ])

    expect(findMostSpecificTarget('change', fieldId(['image', 'asset']), values)).toBe(change)
  })

  it('falls back to the closest changed target nested inside the path', () => {
    // Hovering the image diff in the changes panel (registered at `image`) should find the
    // form-side change indicator, which image inputs register at `image.asset`.
    const field = trackedChange(['image', 'asset'])
    const values = toValues([
      [fieldId(['image', 'asset']), field],
      [changeId(['image']), trackedChange(['image'])],
    ])

    expect(findMostSpecificTarget('field', changeId(['image']), values)).toBe(field)
  })

  it('prefers the least deeply nested changed target inside the path', () => {
    const shallow = trackedChange(['address', 'city'])
    const deep = trackedChange(['address', 'location', 'lat'])
    const values = toValues([
      [fieldId(['address', 'location', 'lat']), deep],
      [fieldId(['address', 'city']), shallow],
      [changeId(['address']), trackedChange(['address'])],
    ])

    expect(findMostSpecificTarget('field', changeId(['address']), values)).toBe(shallow)
  })

  it('ignores unchanged targets nested inside the path', () => {
    const values = toValues([
      [fieldId(['address', 'city']), trackedChange(['address', 'city'], {isChanged: false})],
      [changeId(['address']), trackedChange(['address'])],
    ])

    expect(findMostSpecificTarget('field', changeId(['address']), values)).toBeUndefined()
  })

  it('does not match targets in a different branch of the tree', () => {
    const values = toValues([
      [fieldId(['bar', 'baz']), trackedChange(['bar', 'baz'])],
      [changeId(['foo']), trackedChange(['foo'])],
    ])

    expect(findMostSpecificTarget('field', changeId(['foo']), values)).toBeUndefined()
  })

  it('matches a target whose path only differs by a trailing key', () => {
    const field = trackedChange(['body', {_key: 'abc123'}], {isChanged: false})
    const values = toValues([
      [fieldId(['body', {_key: 'abc123'}]), field],
      [changeId(['body']), trackedChange(['body'])],
    ])

    expect(findMostSpecificTarget('field', changeId(['body']), values)).toBe(field)
  })
})
