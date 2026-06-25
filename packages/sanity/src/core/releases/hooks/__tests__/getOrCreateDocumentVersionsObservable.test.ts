import {firstValueFrom, of, toArray} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {type DocumentPreviewStore} from '../../../preview'
import {getOrCreateDocumentVersionsObservable, observableCache} from '../useDocumentVersions'

describe('getOrCreateDocumentVersionsObservable', () => {
  it('emits loading: true while document stub fields are being resolved', async () => {
    observableCache.clear()

    const documentPreviewStore = {
      unstable_observeVersionDocumentIds: vi
        .fn<DocumentPreviewStore['unstable_observeVersionDocumentIds']>()
        .mockReturnValue(of(['drafts.article-1'])),
      observePaths: vi.fn<DocumentPreviewStore['observePaths']>().mockReturnValue(
        of({
          _id: 'drafts.article-1',
          _rev: 'rev-1',
          _createdAt: '2024-01-01T00:00:00.000Z',
          _updatedAt: '2024-01-02T00:00:00.000Z',
          _system: {
            bundleId: 'drafts',
            group: {_ref: 'article-1', _weak: true},
          },
        }),
      ),
    } as unknown as DocumentPreviewStore

    const emissions = await firstValueFrom(
      getOrCreateDocumentVersionsObservable({
        documentPreviewStore,
        publishedId: 'article-1',
        projectId: 'test-project',
        dataset: 'test',
      }).pipe(toArray()),
    )

    expect(documentPreviewStore.observePaths).toHaveBeenCalledWith({_id: 'drafts.article-1'}, [
      '_id',
      '_type',
      '_rev',
      '_createdAt',
      '_updatedAt',
      '_system',
    ])

    expect(emissions).toEqual([
      {
        data: ['drafts.article-1'],
        versions: [],
        error: null,
        loading: true,
      },
      {
        data: ['drafts.article-1'],
        versions: [
          {
            _id: 'drafts.article-1',
            _rev: 'rev-1',
            _createdAt: '2024-01-01T00:00:00.000Z',
            _updatedAt: '2024-01-02T00:00:00.000Z',
            _system: {
              bundleId: 'drafts',
              group: {_ref: 'article-1', _weak: true},
            },
          },
        ],
        error: null,
        loading: false,
      },
    ])
  })
})
