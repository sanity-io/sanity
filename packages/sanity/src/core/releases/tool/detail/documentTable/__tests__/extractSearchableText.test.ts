import {describe, expect, it} from 'vitest'

import {extractSearchableText} from '../extractSearchableText'

describe('extractSearchableText', () => {
  describe('primitive types', () => {
    it('should handle empty/null/undefined values', () => {
      expect(extractSearchableText(null)).toBe('')
      expect(extractSearchableText(undefined)).toBe('')
      expect(extractSearchableText('')).toBe('')
      expect(extractSearchableText(0)).toBe('0')
    })

    it('should handle string values', () => {
      expect(extractSearchableText('Hello World')).toBe('Hello World')
      expect(extractSearchableText('')).toBe('')
    })

    it('should handle number values', () => {
      expect(extractSearchableText(42)).toBe('42')
      expect(extractSearchableText(-123)).toBe('-123')
      expect(extractSearchableText(3.14)).toBe('3.14')
    })
  })

  describe('arrays', () => {
    it('should handle empty arrays', () => {
      expect(extractSearchableText([])).toBe('')
    })

    it('should handle string arrays', () => {
      expect(extractSearchableText(['Hello', 'World'])).toBe('Hello World')
      expect(extractSearchableText(['Single'])).toBe('Single')
      expect(extractSearchableText(['', 'Hello', '', 'World', ''])).toBe('Hello World')
    })

    it('should handle nested arrays', () => {
      expect(extractSearchableText([['Hello', 'World'], 'Test'])).toBe('Hello World Test')
      expect(
        extractSearchableText([
          [1, 2],
          [3, 4],
        ]),
      ).toBe('1 2 3 4')
    })

    it('should handle portable text arrays', () => {
      const portableText = [
        {
          _type: 'block',
          _key: 'block1',
          children: [
            {
              _type: 'span',
              _key: 'span1',
              text: 'Hello',
              marks: [],
            },
          ],
          markDefs: [],
          style: 'normal',
        },
        {
          _type: 'block',
          _key: 'block2',
          children: [
            {
              _type: 'span',
              _key: 'span2',
              text: 'World',
              marks: [],
            },
          ],
          markDefs: [],
          style: 'normal',
        },
      ]

      expect(extractSearchableText(portableText)).toBe('Hello World')
    })

    it('should handle arrays with portable text and other content', () => {
      const mixedArray = [
        'Regular text',
        {
          _type: 'block',
          _key: 'block1',
          children: [
            {
              _type: 'span',
              _key: 'span1',
              text: 'Portable text',
              marks: [],
            },
          ],
          markDefs: [],
          style: 'normal',
        },
        'More text',
      ]

      expect(extractSearchableText(mixedArray)).toBe('Regular text Portable text More text')
    })
  })

  describe('objects', () => {
    it('should handle empty objects', () => {
      expect(extractSearchableText({})).toBe('')
    })

    it('should handle objects with title property', () => {
      expect(extractSearchableText({title: 'My Title'})).toBe('My Title')
      expect(extractSearchableText({title: 'Title', other: 'ignored'})).toBe('Title ignored')
    })

    it('should handle objects with name property', () => {
      expect(extractSearchableText({name: 'My Name'})).toBe('My Name')
      expect(extractSearchableText({name: 'Name', other: 'ignored'})).toBe('Name ignored')
    })

    it('should handle objects with text property', () => {
      expect(extractSearchableText({text: 'My Text'})).toBe('My Text')
      expect(extractSearchableText({text: 'Text', other: 'ignored'})).toBe('Text ignored')
    })

    it('should handle objects with text, name and title properties', () => {
      expect(extractSearchableText({text: 'Text', name: 'a name', title: 'a title'})).toBe(
        'Text a name a title',
      )
      expect(extractSearchableText({text: 'Text', name: 'a name'})).toBe('Text a name')
    })

    it('should handle localized objects', () => {
      expect(extractSearchableText({en: 'Hello', no: 'Hallo', sv: 'Hej'})).toBe('Hello Hallo Hej')
      expect(extractSearchableText({en: 'Title'})).toBe('Title')
    })

    it('should handle objects with metadata keys (starting with _)', () => {
      expect(
        extractSearchableText({
          _id: 'doc123',
          _type: 'document',
          title: 'My Title',
          _createdAt: '2023-01-01',
        }),
      ).toBe('My Title')
    })

    it('should handle nested objects', () => {
      expect(
        extractSearchableText({
          title: 'Main Title',
          subtitle: {
            en: 'English Subtitle',
            no: 'Norwegian Subtitle',
          },
          content: {
            text: 'Some content',
          },
        }),
      ).toBe('Main Title English Subtitle Norwegian Subtitle Some content')
    })

    it('should handle objects with mixed value types', () => {
      expect(
        extractSearchableText({
          title: 'Title',
          count: 42,
          active: true,
          tags: ['tag1', 'tag2'],
          metadata: {
            _id: 'meta123',
            description: 'Description',
          },
        }),
      ).toBe('Title')
    })

    it('should handle objects that are not localized (mixed value types)', () => {
      expect(
        extractSearchableText({
          title: 'Title',
          count: 42,
          active: true,
        }),
      ).toBe('Title')
    })
  })

  describe('edge cases', () => {
    it('should handle deeply nested structures', () => {
      const deepNested = {
        level1: {
          level2: {
            title: 'Deep Title',
            content: ['Item 1', 'Item 2'],
          },
        },
      }

      expect(extractSearchableText(deepNested)).toBe('Deep Title Item 1 Item 2')
    })

    it('should handle circular references gracefully by only going down one level', () => {
      const obj: any = {title: 'Circular'}
      obj.self = obj

      // This should not throw and should extract what it can
      expect(extractSearchableText(obj)).toBe('Circular')
    })

    it('should handle functions and symbols', () => {
      const objWithFunctions = {
        title: 'Title',
        func: () => 'function',
        symbol: Symbol('test'),
      }

      expect(extractSearchableText(objWithFunctions)).toBe('Title')
    })

    it('should handle Date objects', () => {
      const date = new Date('2023-01-01T00:00:00.000Z')
      expect(extractSearchableText({date})).toBe('')
    })
  })

  describe('real-world scenarios', () => {
    it('should handle Sanity document-like objects', () => {
      const sanityDoc = {
        _id: 'doc123',
        _type: 'article',
        _createdAt: '2023-01-01T00:00:00.000Z',
        _updatedAt: '2023-01-02T00:00:00.000Z',
        title: 'Article Title',
        slug: {current: 'article-slug'},
        content: [
          {
            _type: 'block',
            _key: 'block1',
            children: [
              {
                _type: 'span',
                _key: 'span1',
                text: 'Article content',
                marks: [],
              },
            ],
            markDefs: [],
            style: 'normal',
          },
        ],
        author: {
          _ref: 'author123',
          name: 'John Doe',
        },
        tags: ['tag1', 'tag2'],
      }

      expect(extractSearchableText(sanityDoc)).toBe('Article Title')
    })

    it('should handle multilingual content', () => {
      const multilingualDoc = {
        title: {
          en: 'English Title',
          no: 'Norwegian Title',
          sv: 'Swedish Title',
        },
        description: {
          en: 'English description',
          no: 'Norwegian description',
        },
        content: [
          {
            _type: 'block',
            _key: 'block1',
            children: [
              {
                _type: 'span',
                _key: 'span1',
                text: 'Multilingual content',
                marks: [],
              },
            ],
            markDefs: [],
            style: 'normal',
          },
        ],
      }

      expect(extractSearchableText(multilingualDoc)).toBe(
        'English Title Norwegian Title Swedish Title English description Norwegian description Multilingual content',
      )
    })
  })
})
