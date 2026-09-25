import {type SanityDocument} from '@sanity/types'
import {renderHook, waitFor} from '@testing-library/react'
import {of, throwError} from 'rxjs'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {useDocumentPreviewStore} from '../../store/datastores'
import {type DocumentPreviewStore} from '../documentPreviewStore'
import {useUnstableObserveDocument} from '../useObserveDocument'

vi.mock('../../store/datastores', () => ({useDocumentPreviewStore: vi.fn()}))

const mockUseDocumentPreviewStore = vi.mocked(useDocumentPreviewStore)

function mockObservedDocument(observe: () => unknown) {
  mockUseDocumentPreviewStore.mockReturnValue({
    unstable_observeDocument: observe,
  } as unknown as DocumentPreviewStore)
}

describe('useUnstableObserveDocument', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('surfaces a failed read as an error instead of throwing', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = new Error('read failed')
    mockObservedDocument(() => throwError(() => error))

    const {result} = renderHook(() => useUnstableObserveDocument('article-123'))

    await waitFor(() => expect(result.current).toEqual({loading: false, document: null, error}))
    expect(consoleError).toHaveBeenCalled()
  })

  it('reports a document the batch fetch did not return as null', async () => {
    mockObservedDocument(() => of(undefined))

    const {result} = renderHook(() => useUnstableObserveDocument('article-123'))

    await waitFor(() =>
      expect(result.current).toEqual({loading: false, document: null, error: null}),
    )
  })

  it('passes a resolved document through', async () => {
    const document = {_id: 'article-123', _type: 'article'} as SanityDocument
    mockObservedDocument(() => of(document))

    const {result} = renderHook(() => useUnstableObserveDocument('article-123'))

    await waitFor(() => expect(result.current).toEqual({loading: false, document, error: null}))
  })
})
