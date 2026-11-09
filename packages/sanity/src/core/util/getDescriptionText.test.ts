import {type PortableTextBlock} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {getDescriptionText} from './getDescriptionText'

describe('getDescriptionText', () => {
  test('returns string as-is when description is a string', () => {
    expect(getDescriptionText('Hello world')).toBe('Hello world')
    expect(getDescriptionText('')).toBe('')
    expect(getDescriptionText('  trimmed text  ')).toBe('  trimmed text  ')
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

    expect(getDescriptionText(portableTextBlocks)).toBe('Hello \n\nWorld')
  })

  test('returns empty string for empty Portable Text array', () => {
    expect(getDescriptionText([])).toBe('')
  })

  test('returns empty string for undefined', () => {
    expect(getDescriptionText(undefined)).toBe('')
  })

  test('returns empty string for null', () => {
    expect(getDescriptionText(null)).toBe('')
  })

  test('returns empty string for numbers', () => {
    expect(getDescriptionText(123)).toBe('')
  })

  test('returns empty string for objects that are not Portable Text blocks', () => {
    expect(getDescriptionText({foo: 'bar'})).toBe('')
    expect(getDescriptionText([{foo: 'bar'}])).toBe('')
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

    expect(getDescriptionText(mixedArray)).toBe('')
  })
})
