import {renderHook} from '@testing-library/react'
import {of} from 'rxjs'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {usePresenceStore} from '../datastores'
import {type PresenceStore} from './presence-store'
import {useDocumentPresence} from './useDocumentPresence'

vi.mock('../datastores', () => ({
  usePresenceStore: vi.fn(),
}))

const mockedUsePresenceStore = vi.mocked(usePresenceStore)

function createMockPresenceStore(): PresenceStore {
  return {
    documentPresence: vi.fn(() => of([])),
    globalPresence$: of([]),
    reportLocations: vi.fn(() => of(undefined)),
    setLocation: vi.fn(),
    debugPresenceParam$: of([]),
  }
}

describe('useDocumentPresence', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('creates the presence observable once across re-renders for a stable document id', () => {
    const presenceStore = createMockPresenceStore()
    mockedUsePresenceStore.mockReturnValue(presenceStore)

    const {rerender} = renderHook(() => useDocumentPresence('doc-1'))

    rerender()
    rerender()
    rerender()

    expect(presenceStore.documentPresence).toHaveBeenCalledTimes(1)
    expect(presenceStore.documentPresence).toHaveBeenCalledWith('doc-1')
  })

  it('recreates the presence observable when the document id changes', () => {
    const presenceStore = createMockPresenceStore()
    mockedUsePresenceStore.mockReturnValue(presenceStore)

    const {rerender} = renderHook(({documentId}) => useDocumentPresence(documentId), {
      initialProps: {documentId: 'doc-1'},
    })

    rerender({documentId: 'doc-2'})

    expect(presenceStore.documentPresence).toHaveBeenCalledTimes(2)
    expect(presenceStore.documentPresence).toHaveBeenNthCalledWith(1, 'doc-1')
    expect(presenceStore.documentPresence).toHaveBeenNthCalledWith(2, 'doc-2')
  })
})
