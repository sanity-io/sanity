import {type PortableTextBlock} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {getReleaseDescriptionText} from '../getReleaseDescriptionText'

describe('getReleaseDescriptionText', () => {
  test('returns string as-is when description is a string', () => {
    expect(getReleaseDescriptionText('Hello world')).toBe('Hello world')
    expect(getReleaseDescriptionText('')).toBe('')
    expect(getReleaseDescriptionText('  trimmed text  ')).toBe('  trimmed text  ')
  })

  test('converts Portable Text blocks to plain text', () => {
    const portableTextBlocks: PortableTextBlock[] = [
      {
        _type: 'block',
        _key: 'block1',
        children: [{_type: 'span', _key: 'span1', text: 'Hello '}],
        markDefs: [],
        style: 'normal',
      },
      {
        _type: 'block',
        _key: 'block2',
        children: [{_type: 'span', _key: 'span2', text: 'World'}],
        markDefs: [],
        style: 'normal',
      },
    ]

    expect(getReleaseDescriptionText(portableTextBlocks)).toBe('Hello \n\nWorld')
  })

  test('returns empty string for empty Portable Text array', () => {
    expect(getReleaseDescriptionText([])).toBe('')
  })

  test('returns empty string for undefined', () => {
    expect(getReleaseDescriptionText(undefined)).toBe('')
  })

  test('returns empty string for null', () => {
    expect(getReleaseDescriptionText(null)).toBe('')
  })

  test('returns empty string for numbers', () => {
    expect(getReleaseDescriptionText(123)).toBe('')
  })

  test('returns empty string for objects that are not Portable Text blocks', () => {
    expect(getReleaseDescriptionText({foo: 'bar'})).toBe('')
    expect(getReleaseDescriptionText([{foo: 'bar'}])).toBe('')
  })

  test('returns empty string for mixed arrays with non-Portable Text items', () => {
    const mixedArray = [
      {
        _type: 'block',
        _key: 'block1',
        children: [{_type: 'span', _key: 'span1', text: 'Hello'}],
        markDefs: [],
        style: 'normal',
      },
      {notABlock: true},
    ]

    expect(getReleaseDescriptionText(mixedArray)).toBe('')
  })
})
