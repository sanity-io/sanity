import {defineType, type ObjectSchemaType, type SanityDocumentLike} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {createSchema} from '../../schema/createSchema'
import {isSanityCreateExcludedType, isSanityCreateStartCompatibleDoc} from '../createUtils'

const basicDoc = defineType({
  type: 'document',
  name: 'test',
  fields: [{type: 'string', name: 'title'}],
})

describe('createUtils', () => {
  describe('isSanityCreateExcludedType', () => {
    it(`should include type without options`, async () => {
      const documentType = getDocumentType([basicDoc], basicDoc.name)
      expect(isSanityCreateExcludedType(documentType)).toEqual(false)
    })

    it(`should exclude type via direct options`, async () => {
      const documentType = getDocumentType(
        [
          defineType({
            ...basicDoc,
            options: {sanityCreate: {exclude: true}},
          }),
        ],
        basicDoc.name,
      )
      expect(isSanityCreateExcludedType(documentType)).toEqual(true)
    })

    it(`should exclude type via parent options`, async () => {
      const documentType = getDocumentType(
        [
          {
            type: 'document',
            name: 'parentDoc',
            fields: [{type: 'string', name: 'title'}],
            options: {sanityCreate: {exclude: true}},
          },
          {
            type: 'parentDoc',
            name: 'test',
          },
        ],
        basicDoc.name,
      )
      expect(isSanityCreateExcludedType(documentType)).toEqual(true)
    })

    it(`should include type when child type overrides parent options`, async () => {
      const documentType = getDocumentType(
        [
          {
            type: 'document',
            name: 'parentDoc',
            fields: [{type: 'string', name: 'title'}],
            options: {sanityCreate: {exclude: true}},
          },
          {
            type: 'parentDoc',
            name: 'test',
            options: {sanityCreate: {exclude: false}},
          },
        ],
        basicDoc.name,
      )
      expect(isSanityCreateExcludedType(documentType)).toEqual(false)
    })
  })

  describe('isSanityCreateStartCompatibleDoc', () => {
    it(`should allow documents with values in underscore-prefixed fields`, () => {
      const doc: SanityDocumentLike = {
        _id: '123',
        _type: 'yolo',
        _createdAt: 'whenever',
      }
      expect(isSanityCreateStartCompatibleDoc(doc)).toEqual(true)
    })

    it(`should allow documents with null or undefined values in underscore-prefixed fields`, () => {
      const doc: SanityDocumentLike = {
        _id: '123',
        _type: 'yolo',
        someField: undefined,
        other: null,
      }
      expect(isSanityCreateStartCompatibleDoc(doc)).toEqual(true)
    })

    it(`should not allow documents with values in regular fields`, () => {
      expect(isSanityCreateStartCompatibleDoc({_id: '1', _type: '2', someArray: []})).toEqual(false)
      expect(isSanityCreateStartCompatibleDoc({_id: '1', _type: '2', string: ''})).toEqual(false)
      expect(isSanityCreateStartCompatibleDoc({_id: '1', _type: '2', number: 0})).toEqual(false)
      expect(isSanityCreateStartCompatibleDoc({_id: '1', _type: '2', boolean: false})).toEqual(
        false,
      )
    })
  })
})

function getDocumentType(docDefs: ReturnType<typeof defineType>[], docName: string) {
  return createSchema({name: 'test', types: docDefs}).get(docName) as ObjectSchemaType
}
