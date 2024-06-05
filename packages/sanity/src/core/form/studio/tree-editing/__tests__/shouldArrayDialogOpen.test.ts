import {describe, expect, test} from '@jest/globals'
import {renderHook} from '@testing-library/react'
import {type ObjectSchemaType, shouldArrayDialogOpen} from 'sanity'

describe('shouldArrayDialogOpen', () => {
  test('should return false if its in the base document (path [])', () => {
    const objectSchemaType = {
      jsonType: 'object',
      fields: [],
      name: '',
      // eslint-disable-next-line camelcase
      __experimental_search: [],
    } as ObjectSchemaType

    const {result} = renderHook(() => shouldArrayDialogOpen(objectSchemaType, []))

    expect(result.current).toEqual(false)
  })

  test('should return false if array has a reference', () => {
    const referenceSchemaType = {
      jsonType: 'object',
      fields: [
        {
          name: 'referenceAuthor',
          type: {
            type: 'array',
            of: [{type: 'reference', to: [{type: 'author'}]}],
          },
        },
      ],
      name: '',
      // eslint-disable-next-line camelcase
      __experimental_search: [],
    } as unknown as ObjectSchemaType

    const {result} = renderHook(() =>
      shouldArrayDialogOpen(referenceSchemaType, ['referenceAuthor']),
    )

    expect(result.current).toEqual(false)
  })

  test('should return false if array is PTE', () => {
    const referenceSchemaType = {
      jsonType: 'object',
      fields: [
        {
          name: 'pte',
          type: {
            type: 'array',
            of: [{type: 'block'}],
          },
        },
      ],
      name: '',
      // eslint-disable-next-line camelcase
      __experimental_search: [],
    } as unknown as ObjectSchemaType

    const {result} = renderHook(() => shouldArrayDialogOpen(referenceSchemaType, ['pte']))

    expect(result.current).toEqual(false)
  })

  test('should return true if its an array of plain objects - not pte, an array of references or in base document', () => {
    const objectSchemaType = {
      jsonType: 'object',
      fields: [
        {
          type: 'array',
          name: 'arrayOfObjects',
          of: [
            {
              type: 'object',
              name: 'object1',
              fields: [
                {
                  name: 'name',
                  type: 'string',
                  title: 'name',
                },
                {
                  name: 'age',
                  type: 'number',
                  title: 'age',
                },
              ],
            },
          ],
        },
      ],
      name: '',
      // eslint-disable-next-line camelcase
      __experimental_search: [],
    } as unknown as ObjectSchemaType

    const {result} = renderHook(() => shouldArrayDialogOpen(objectSchemaType, ['object1']))

    expect(result.current).toEqual(false)
  })
})
