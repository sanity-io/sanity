import {renderHook, waitFor} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {createMockSanityClient} from '../../../../../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../../../../../test/testUtils/TestProvider'
import {useSearchMaxFieldDepth} from '../useSearchMaxFieldDepth'

function createWrapper() {
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
  return createTestProvider({
    client: client as any,
    config: {search: {unstable_partialIndexing: {enabled: true}}},
  })
}

describe('useSearchMaxFieldDepth', () => {
  it('returns the field depth and excluded field paths when asked for field paths', async () => {
    const wrapper = await createWrapper()

    const {result} = renderHook(() => useSearchMaxFieldDepth(undefined, true), {wrapper})

    await waitFor(() => {
      expect(result.current).toEqual({
        isLoading: false,
        maxFieldDepth: 2,
        fieldPaths: {
          excludeFieldPaths: ['analytics', 'analytics[]'],
          includeFieldPaths: ['content'],
        },
      })
    })
  })

  it('returns only the field depth when called without field paths', async () => {
    const wrapper = await createWrapper()

    // oxlint-disable-next-line typescript/no-deprecated -- covers the deprecated signature
    const {result} = renderHook(() => useSearchMaxFieldDepth(), {wrapper})

    await waitFor(() => {
      expect(result.current).toBe(2)
    })
  })
})
