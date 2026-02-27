import {describe, expect, it} from 'vitest'

import {transformValueToText} from '../utils'

describe('transformValueToText', () => {
  it('returns empty string for falsy values', () => {
    expect(transformValueToText(null)).toBe('')
    expect(transformValueToText(undefined)).toBe('')
    expect(transformValueToText('')).toBe('')
  })

  it('returns string values as-is', () => {
    expect(transformValueToText('hello')).toBe('hello')
    expect(transformValueToText('hello world')).toBe('hello world')
  })

  it('converts numbers to strings', () => {
    expect(transformValueToText(42)).toBe('42')
    expect(transformValueToText(3.14)).toBe('3.14')
  })

  it('handles simple arrays', () => {
    expect(transformValueToText(['a', 'b', 'c'])).toBe('a, b, c')
    expect(transformValueToText([1, 2, 3])).toBe('1, 2, 3')
  })

  it('extracts text from Portable Text blocks', () => {
    const pteBlock = {
      _type: 'block',
      _key: 'abc123',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'span1',
          text: 'Hello world',
          marks: [],
        },
      ],
    }

    // Should return just the text, NOT "normal, Hello world"
    expect(transformValueToText(pteBlock)).toBe('Hello world')
  })

  it('extracts text from Portable Text array', () => {
    const pteArray = [
      {
        _type: 'block',
        _key: 'block1',
        style: 'h1',
        markDefs: [],
        children: [
          {
            _type: 'span',
            _key: 'span1',
            text: 'Heading',
            marks: [],
          },
        ],
      },
      {
        _type: 'block',
        _key: 'block2',
        style: 'normal',
        markDefs: [],
        children: [
          {
            _type: 'span',
            _key: 'span2',
            text: 'Paragraph text',
            marks: [],
          },
        ],
      },
    ]

    // Should return text from all blocks without style metadata
    const result = transformValueToText(pteArray)
    expect(result).toContain('Heading')
    expect(result).toContain('Paragraph text')
    expect(result).not.toContain('h1')
    expect(result).not.toContain('normal')
  })

  it('handles mixed Portable Text with multiple spans', () => {
    const pteBlock = {
      _type: 'block',
      _key: 'abc123',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'span1',
          text: 'Hello ',
          marks: [],
        },
        {
          _type: 'span',
          _key: 'span2',
          text: 'world',
          marks: ['strong'],
        },
      ],
    }

    expect(transformValueToText(pteBlock)).toBe('Hello world')
  })

  it('handles regular objects (non-PTE)', () => {
    const obj = {
      _id: 'doc123',
      _type: 'article',
      title: 'My Title',
      description: 'My description',
    }

    // Should extract non-underscore prefixed values only
    const result = transformValueToText(obj)
    expect(result).toContain('My Title')
    expect(result).toContain('My description')
    expect(result).not.toContain('doc123') // _id should be skipped
    expect(result).not.toContain('article') // _type should also be skipped
  })
})
