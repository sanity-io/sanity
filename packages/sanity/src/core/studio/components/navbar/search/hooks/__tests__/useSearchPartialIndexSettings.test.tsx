import {renderHook, waitFor} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {createMockSanityClient} from '../../../../../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../../../../../test/testUtils/TestProvider'
import {useSearchPartialIndexSettings} from '../useSearchMaxFieldDepth'

describe('useSearchPartialIndexSettings', () => {
  it('returns the field depth and excluded field paths from the dataset index settings', async () => {
    const client = createMockSanityClient({
      requests: {
        '/projects/mock-project-id/datasets/mock-data-set/settings/indexing': {
          partialIndexSettings: {
            maxFieldDepth: 2,
            excludeFieldPaths: ['analytics', 'analytics[]'],
            includeFieldPaths: ['content'],
          },
          status: 'indexSettingsActive',
        },
      },
    })
    const wrapper = await createTestProvider({
      client: client as any,
      config: {search: {unstable_partialIndexing: {enabled: true}}},
    })

    const {result} = renderHook(() => useSearchPartialIndexSettings(), {wrapper})

    await waitFor(() => {
      expect(result.current).toEqual({
        maxFieldDepth: 2,
        fieldPaths: {
          excludeFieldPaths: ['analytics', 'analytics[]'],
          includeFieldPaths: ['content'],
        },
      })
    })
  })
})
