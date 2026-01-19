import {describe, expect, it} from '@jest/globals'
import {type PortableTextBlock} from '@sanity/types'

import {
  areDescriptionsEquivalent,
  normalizeDescriptionToPTE,
  pteToString,
  stringToPTE,
} from '../descriptionConversion'

describe('descriptionConversion', () => {
  describe('stringToPTE', () => {
    it('converts simple string to PTE', () => {
      const result = stringToPTE('Hello world')

      expect(result).toHaveLength(1)
      expect(result[0]._type).toBe('block')
      expect(result[0].style).toBe('normal')
      expect(result[0].children).toHaveLength(1)
      expect(result[0].children[0]._type).toBe('span')
      expect(result[0].children[0].text).toBe('Hello world')
      expect(result[0].children[0].marks).toEqual([])
    })

    it('handles empty string', () => {
      expect(stringToPTE('')).toEqual([])
    })

    it('handles whitespace-only string', () => {
      expect(stringToPTE('   ')).toEqual([])
    })

    it('preserves line breaks as separate blocks', () => {
      const result = stringToPTE('Line 1\nLine 2\nLine 3')

      expect(result).toHaveLength(3)
      expect(result[0].children[0].text).toBe('Line 1')
      expect(result[1].children[0].text).toBe('Line 2')
      expect(result[2].children[0].text).toBe('Line 3')
    })

    it('handles multiple consecutive newlines', () => {
      const result = stringToPTE('Line 1\n\nLine 3')

      expect(result).toHaveLength(3)
      expect(result[0].children[0].text).toBe('Line 1')
      expect(result[1].children[0].text).toBe('')
      expect(result[2].children[0].text).toBe('Line 3')
    })

    it('generates unique keys for blocks and spans', () => {
      const result = stringToPTE('Line 1\nLine 2')

      const blockKeys = result.map((block) => block._key)
      const spanKeys = result.map((block) => block.children[0]._key)

      // All keys should be unique
      expect(new Set(blockKeys).size).toBe(blockKeys.length)
      expect(new Set(spanKeys).size).toBe(spanKeys.length)
    })
  })

  describe('pteToString', () => {
    it('converts PTE to string', () => {
      const pte: PortableTextBlock[] = [
        {
          _type: 'block',
          _key: 'abc',
          style: 'normal',
          markDefs: [],
          children: [{_type: 'span', _key: 'def', text: 'Hello world', marks: []}],
        },
      ]

      expect(pteToString(pte)).toBe('Hello world')
    })

    it('handles empty array', () => {
      expect(pteToString([])).toBe('')
    })

    it('handles multiple blocks', () => {
      const pte: PortableTextBlock[] = [
        {
          _type: 'block',
          _key: 'a',
          style: 'normal',
          markDefs: [],
          children: [{_type: 'span', _key: 'a1', text: 'First', marks: []}],
        },
        {
          _type: 'block',
          _key: 'b',
          style: 'normal',
          markDefs: [],
          children: [{_type: 'span', _key: 'b1', text: 'Second', marks: []}],
        },
      ]

      const result = pteToString(pte)

      expect(result).toContain('First')
      expect(result).toContain('Second')
    })

    it('strips formatting marks', () => {
      const pte: PortableTextBlock[] = [
        {
          _type: 'block',
          _key: 'abc',
          style: 'normal',
          markDefs: [],
          children: [
            {_type: 'span', _key: 'def', text: 'Bold', marks: ['strong']},
            {_type: 'span', _key: 'ghi', text: ' and ', marks: []},
            {_type: 'span', _key: 'jkl', text: 'italic', marks: ['em']},
          ],
        },
      ]

      expect(pteToString(pte)).toBe('Bold and italic')
    })
  })

  describe('normalizeDescriptionToPTE', () => {
    it('returns empty array for undefined', () => {
      expect(normalizeDescriptionToPTE(undefined)).toEqual([])
    })

    it('converts string to PTE', () => {
      const result = normalizeDescriptionToPTE('Test description')

      expect(result).toHaveLength(1)
      expect(result[0]._type).toBe('block')
      expect(result[0].children[0].text).toBe('Test description')
    })

    it('returns PTE unchanged', () => {
      const pte: PortableTextBlock[] = [
        {
          _type: 'block',
          _key: 'abc',
          style: 'normal',
          markDefs: [],
          children: [{_type: 'span', _key: 'def', text: 'Already PTE', marks: []}],
        },
      ]

      const result = normalizeDescriptionToPTE(pte)

      expect(result).toBe(pte) // Same reference
    })

    it('handles empty string', () => {
      expect(normalizeDescriptionToPTE('')).toEqual([])
    })

    it('handles empty array', () => {
      expect(normalizeDescriptionToPTE([])).toEqual([])
    })
  })

  describe('areDescriptionsEquivalent', () => {
    it('detects equivalent descriptions in different formats', () => {
      const str = 'Hello world'
      const pte = stringToPTE(str)

      expect(areDescriptionsEquivalent(str, pte)).toBe(true)
    })

    it('handles empty descriptions as equivalent', () => {
      expect(areDescriptionsEquivalent('', [])).toBe(true)
      expect(areDescriptionsEquivalent(undefined, undefined)).toBe(true)
      expect(areDescriptionsEquivalent('', undefined)).toBe(true)
    })

    it('detects different content', () => {
      const str1 = 'First description'
      const str2 = 'Second description'

      expect(areDescriptionsEquivalent(str1, str2)).toBe(false)
    })

    it('ignores whitespace differences', () => {
      const str1 = '  Hello  '
      const str2 = 'Hello'

      expect(areDescriptionsEquivalent(str1, str2)).toBe(true)
    })

    it('detects equivalent multi-line descriptions', () => {
      const str = 'Line 1\nLine 2'
      const pte = stringToPTE(str)

      expect(areDescriptionsEquivalent(str, pte)).toBe(true)
    })

    it('handles formatted PTE as equivalent to plain text', () => {
      const str = 'Bold text'
      const pte: PortableTextBlock[] = [
        {
          _type: 'block',
          _key: 'abc',
          style: 'normal',
          markDefs: [],
          children: [{_type: 'span', _key: 'def', text: 'Bold text', marks: ['strong']}],
        },
      ]

      // Even though one is formatted, text content is the same
      expect(areDescriptionsEquivalent(str, pte)).toBe(true)
    })
  })
})
