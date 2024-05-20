import {describe, expect, it, jest} from '@jest/globals'
import {type ObjectSchemaType} from '@sanity/types'
import {renderHook} from '@testing-library/react'

import {useDocumentSheetColumns} from '../useDocumentSheetColumns'

jest.mock('sanity', () => ({
  ...(jest.requireActual('sanity') || {}),
  useDocumentPreviewStore: jest.fn().mockReturnValue({}),
}))

describe('useDocumentSheetColumns', () => {
  it('returns initial column visibilities', () => {
    const mockSchemaType = {
      name: 'author',
      title: 'Author',
      type: 'document',
      fields: [
        {name: 'name', type: {name: 'string'}},
        {name: 'nickname', type: {name: 'string'}},
        {name: 'email', type: {name: 'string'}},
        {name: 'age', type: {name: 'number'}},
        {
          name: 'address.place',
          type: {
            name: 'object',
            jsonType: 'object',
            fields: [
              {name: 'street', type: {name: 'string'}},
              {name: 'country', type: {name: 'string'}},
            ],
          },
        },
        {name: 'phone number', type: {name: 'number'}},
        {name: 'has pet', type: {name: 'boolean'}},
      ],
    } as unknown as ObjectSchemaType

    const {result} = renderHook(() => useDocumentSheetColumns(mockSchemaType))
    expect(result.current.initialColumnsVisibility).toEqual({
      'Preview': true,
      'name': true,
      'nickname': true,
      'email': true,
      'age': true,
      'address.place_street': true,
      'address.place_country': false,
      'phone number': false,
      'has pet': false,
    })
  })
})
