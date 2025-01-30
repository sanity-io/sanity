import {type ObjectSchemaType} from '@sanity/types'
import {renderHook} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {useDocumentSheetColumns} from '../useDocumentSheetColumns'

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  useDocumentPreviewStore: vi.fn().mockReturnValue({}),
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
          name: 'address',
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
      'address_street': true,
      'address_country': false,
      'phone number': false,
      'has pet': false,
    })
  })
})
