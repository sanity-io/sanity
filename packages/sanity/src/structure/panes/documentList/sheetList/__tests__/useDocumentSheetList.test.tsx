import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {renderHook} from '@testing-library/react'
import {defineConfig, type ObjectSchemaType, useSearchState} from 'sanity'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../../i18n'
import {SheetListUsEnglishLocaleBundle} from '../i18n'
import {useDocumentSheetList} from '../useDocumentSheetList'

jest.mock('sanity', () => ({
  ...(jest.requireActual('sanity') || {}),
  useSearchState: jest.fn().mockReturnValue({state: {result: {hits: []}}, dispatch: jest.fn()}),
}))

const createWrapperComponent = () =>
  createTestProvider({
    config: defineConfig({projectId: 'test', dataset: 'test', schema: {}}),
    resources: [structureUsEnglishLocaleBundle, SheetListUsEnglishLocaleBundle],
  })

describe('useDocumentSheetList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('sort order', () => {
    it('should apply sorting to the search query', async () => {
      const wrapper = await createWrapperComponent()
      renderHook(
        () =>
          useDocumentSheetList({} as ObjectSchemaType, {by: [{field: 'title', direction: 'asc'}]}),
        {
          wrapper,
        },
      )

      expect(useSearchState().dispatch).toBeCalledWith({
        ordering: {
          sort: {
            direction: 'asc',
            field: 'title',
          },
          titleKey: 'search.ordering.title-label',
        },
        type: 'ORDERING_SET',
      })
    })

    it('should not apply sorting if no sort order is provided', async () => {
      const wrapper = await createWrapperComponent()

      renderHook(() => useDocumentSheetList({} as ObjectSchemaType, undefined), {
        wrapper,
      })

      expect(useSearchState().dispatch).not.toBeCalledWith(
        expect.objectContaining({type: 'ORDERING_SET'}),
      )
    })
  })
})
