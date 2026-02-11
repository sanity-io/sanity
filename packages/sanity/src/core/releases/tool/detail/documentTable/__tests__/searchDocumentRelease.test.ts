import {type SanityDocument} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {searchDocumentRelease} from '../searchDocumentRelease'

const createTestDocument = (
  title: unknown,
  name: unknown,
): SanityDocument & {publishedDocumentExists: boolean} => ({
  _id: 'test-doc',
  _type: 'test',
  _createdAt: '2023-01-01T00:00:00.000Z',
  _updatedAt: '2023-01-01T00:00:00.000Z',
  _rev: 'rev1',
  title,
  name,
  publishedDocumentExists: true,
})

describe('searchDocumentRelease', () => {
  describe('basic search functionality', () => {
    it('should match exact title', () => {
      const document = createTestDocument('Hello World', 'Test Document')
      expect(searchDocumentRelease(document, 'Hello World')).toBe(true)
    })

    it('should match exact name', () => {
      const document = createTestDocument('Hello World', 'Test Document')
      expect(searchDocumentRelease(document, 'Test Document')).toBe(true)
    })

    it('should match partial title', () => {
      const document = createTestDocument('Hello World', 'Test Document')
      expect(searchDocumentRelease(document, 'Hello')).toBe(true)
      expect(searchDocumentRelease(document, 'World')).toBe(true)
    })

    it('should match partial name', () => {
      const document = createTestDocument('Hello World', 'Test Document')
      expect(searchDocumentRelease(document, 'Test')).toBe(true)
      expect(searchDocumentRelease(document, 'Document')).toBe(true)
    })

    it('should be case insensitive', () => {
      const document = createTestDocument('Hello World', 'Test Document')
      expect(searchDocumentRelease(document, 'hello world')).toBe(true)
      expect(searchDocumentRelease(document, 'HELLO WORLD')).toBe(true)
      expect(searchDocumentRelease(document, 'test document')).toBe(true)
    })

    it('should handle whitespace', () => {
      const document = createTestDocument('Hello World', 'Test Document')
      expect(searchDocumentRelease(document, '  Hello World  ')).toBe(true)
      expect(searchDocumentRelease(document, 'Hello   World')).toBe(true)
    })

    it('should return false for no match', () => {
      const document = createTestDocument('Hello World', 'Test Document')
      expect(searchDocumentRelease(document, 'Unrelated')).toBe(false)
      expect(searchDocumentRelease(document, 'xyz')).toBe(false)
    })
  })

  describe('multi-word search', () => {
    it('should match all words in search term', () => {
      const document = createTestDocument('Hello Beautiful World', 'Amazing Test Document')
      expect(searchDocumentRelease(document, 'Hello World')).toBe(true)
      expect(searchDocumentRelease(document, 'Amazing Document')).toBe(true)
    })

    it('should match words from both title and name', () => {
      const document = createTestDocument('Hello World', 'Amazing Document')
      expect(searchDocumentRelease(document, 'Hello Document')).toBe(true)
      expect(searchDocumentRelease(document, 'World Amazing')).toBe(true)
    })

    it('should return false if any word is missing', () => {
      const document = createTestDocument('Hello World', 'Test Document')
      expect(searchDocumentRelease(document, 'Hello Missing')).toBe(false)
      expect(searchDocumentRelease(document, 'Missing World')).toBe(false)
    })
  })

  describe('document contains search term', () => {
    it('should match when document title is contained in search term', () => {
      const document = createTestDocument('Hello', 'Test')
      expect(searchDocumentRelease(document, 'Hello World')).toBe(true)
      expect(searchDocumentRelease(document, 'Something Hello Something')).toBe(true)
    })

    it('should match when document name is contained in search term', () => {
      const document = createTestDocument('Hello', 'Test')
      expect(searchDocumentRelease(document, 'Test Document')).toBe(true)
      expect(searchDocumentRelease(document, 'Something Test Something')).toBe(true)
    })
  })

  describe('different field value types', () => {
    it('should handle string values', () => {
      const document = createTestDocument('Hello World', 'Test Document')
      expect(searchDocumentRelease(document, 'Hello')).toBe(true)
    })

    it('should handle number values', () => {
      const document = createTestDocument(42, 123)
      expect(searchDocumentRelease(document, '42')).toBe(true)
      expect(searchDocumentRelease(document, '123')).toBe(true)
    })

    it('should handle array values', () => {
      const document = createTestDocument(['Hello', 'World'], ['Test', 'Document'])
      expect(searchDocumentRelease(document, 'Hello')).toBe(true)
      expect(searchDocumentRelease(document, 'Test')).toBe(true)
      expect(searchDocumentRelease(document, 'World Document')).toBe(true)
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
              text: 'Hello World',
              marks: [],
            },
          ],
          markDefs: [],
          style: 'normal',
        },
      ]
      const document = createTestDocument(portableText, 'Test Document')
      expect(searchDocumentRelease(document, 'Hello')).toBe(true)
      expect(searchDocumentRelease(document, 'World')).toBe(true)
    })

    it('should handle object values with title/name/text properties', () => {
      const document = createTestDocument({title: 'Hello World'}, {name: 'Test Document'})
      expect(searchDocumentRelease(document, 'Hello')).toBe(true)
      expect(searchDocumentRelease(document, 'Test')).toBe(true)
    })

    it('should handle localized objects', () => {
      const document = createTestDocument({en: 'Hello', no: 'Hallo'}, {en: 'Test', no: 'Test'})
      expect(searchDocumentRelease(document, 'Hello')).toBe(true)
      expect(searchDocumentRelease(document, 'Hallo')).toBe(true)
      expect(searchDocumentRelease(document, 'Test')).toBe(true)
    })

    it('should handle empty/null/undefined values', () => {
      const document = createTestDocument(null, undefined)
      expect(searchDocumentRelease(document, 'anything')).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle empty search term', () => {
      const document = createTestDocument('Hello World', 'Test Document')
      expect(searchDocumentRelease(document, '')).toBe(false)
    })

    it('should handle search term with only whitespace', () => {
      const document = createTestDocument('Hello World', 'Test Document')
      expect(searchDocumentRelease(document, '   ')).toBe(false)
    })

    it('should handle documents with empty fields', () => {
      const document = createTestDocument('', '')
      expect(searchDocumentRelease(document, 'anything')).toBe(false)
    })

    it('should handle documents with null/undefined fields', () => {
      const document = createTestDocument(null, undefined)
      expect(searchDocumentRelease(document, 'anything')).toBe(false)
    })

    it('should handle special characters in search terms', () => {
      const document = createTestDocument('Hello-World', 'Test_Document')
      expect(searchDocumentRelease(document, 'Hello-World')).toBe(true)
      expect(searchDocumentRelease(document, 'Test_Document')).toBe(true)
      expect(searchDocumentRelease(document, 'Hello')).toBe(true)
      expect(searchDocumentRelease(document, 'Test')).toBe(true)
    })

    it('should handle numbers in search terms', () => {
      const document = createTestDocument('Version 2.0', 'Release 1.5')
      expect(searchDocumentRelease(document, '2.0')).toBe(true)
      expect(searchDocumentRelease(document, '1.5')).toBe(true)
      expect(searchDocumentRelease(document, 'Version')).toBe(true)
      expect(searchDocumentRelease(document, 'Release')).toBe(true)
    })
  })

  describe('real-world scenarios', () => {
    it('should handle multilingual document search', () => {
      const document = createTestDocument(
        {en: 'English Title', no: 'Norwegian Title'},
        {en: 'English Name', no: 'Norwegian Name'},
      )
      expect(searchDocumentRelease(document, 'English')).toBe(true)
      expect(searchDocumentRelease(document, 'Norwegian')).toBe(true)
      expect(searchDocumentRelease(document, 'Title')).toBe(true)
      expect(searchDocumentRelease(document, 'Name')).toBe(true)
    })

    it('should handle document with rich content', () => {
      const document = createTestDocument('Article Title', [
        {
          _type: 'block',
          _key: 'block1',
          children: [
            {
              _type: 'span',
              _key: 'span1',
              text: 'Rich content with important keywords',
              marks: [],
            },
          ],
          markDefs: [],
          style: 'normal',
        },
      ])
      expect(searchDocumentRelease(document, 'Article')).toBe(true)
      expect(searchDocumentRelease(document, 'Rich')).toBe(true)
      expect(searchDocumentRelease(document, 'keywords')).toBe(true)
      expect(searchDocumentRelease(document, 'important keywords')).toBe(true)
    })
  })

  describe('performance considerations', () => {
    it('should handle large text content efficiently', () => {
      const largeText = `${'A'.repeat(1000)} Hello World ${'B'.repeat(1000)}`
      const document = createTestDocument(largeText, 'Test Document')
      expect(searchDocumentRelease(document, 'Hello')).toBe(true)
      expect(searchDocumentRelease(document, 'World')).toBe(true)
    })

    it('should handle many search words efficiently', () => {
      const document = createTestDocument('Hello World', 'Test Document')
      const manyWords = 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10'
      expect(searchDocumentRelease(document, manyWords)).toBe(false)
    })
  })
})
