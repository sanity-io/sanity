import {defineType, type ObjectSchemaType} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {createSchema} from '../../schema'
import {isSanityCreateExcludedType} from '../createUtils'

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
})

function getDocumentType(docDefs: ReturnType<typeof defineType>[], docName: string) {
  return createSchema({name: 'test', types: docDefs}).get(docName) as ObjectSchemaType
}
