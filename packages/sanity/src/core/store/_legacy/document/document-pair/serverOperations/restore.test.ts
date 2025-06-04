import {type SanityDocument} from '@sanity/types'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {type DocumentRevision} from '../../../history'
import {type OperationArgs} from '../operations/types'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'
import {restoreDocument, restoreRevision} from './restore'

vi.mock('../utils/isLiveEditEnabled', () => ({isLiveEditEnabled: vi.fn()}))

const mockHistoryStore = {
  restoreRevision: vi.fn(),
  restoreDocument: vi.fn(),
}

beforeEach(() => {
  vi.mocked(isLiveEditEnabled).mockClear()
  mockHistoryStore.restoreRevision.mockClear()
  mockHistoryStore.restoreDocument.mockClear()
})

describe('server restore operations', () => {
  describe('restoreRevision', () => {
    describe('disabled', () => {
      it('is never disabled', () => {
        const args = {} as unknown as OperationArgs
        expect(restoreRevision.disabled(args)).toBe(false)
      })
    })

    describe('execute', () => {
      it('calls historyStore.restoreRevision with useServerDocumentActions for deleted documents', () => {
        vi.mocked(isLiveEditEnabled).mockReturnValue(false)

        const args = {
          snapshots: {
            draft: null,
            published: null,
          },
          historyStore: mockHistoryStore,
          schema: {},
          idPair: {publishedId: 'deleted-doc', draftId: 'drafts.deleted-doc'},
          typeName: 'testType',
        } as unknown as OperationArgs

        restoreRevision.execute(args, 'lastRevision' as DocumentRevision)

        expect(mockHistoryStore.restoreRevision).toHaveBeenCalledWith(
          'deleted-doc',
          'drafts.deleted-doc',
          'lastRevision',
          {
            fromDeleted: true,
            useServerDocumentActions: true,
          },
        )
      })

      it('calls historyStore.restoreRevision without fromDeleted for existing documents', () => {
        vi.mocked(isLiveEditEnabled).mockReturnValue(false)

        const args = {
          snapshots: {
            draft: {} as SanityDocument,
            published: {} as SanityDocument,
          },
          historyStore: mockHistoryStore,
          schema: {},
          idPair: {publishedId: 'existing-doc', draftId: 'drafts.existing-doc'},
          typeName: 'testType',
        } as unknown as OperationArgs

        restoreRevision.execute(args, 'specific-rev' as DocumentRevision)

        expect(mockHistoryStore.restoreRevision).toHaveBeenCalledWith(
          'existing-doc',
          'drafts.existing-doc',
          'specific-rev',
          {
            fromDeleted: false,
            useServerDocumentActions: true,
          },
        )
      })

      it('handles lastRevision with live edit enabled documents', () => {
        vi.mocked(isLiveEditEnabled).mockReturnValue(true)

        const args = {
          snapshots: {
            draft: null,
            published: {} as SanityDocument,
          },
          historyStore: mockHistoryStore,
          schema: {},
          idPair: {publishedId: 'live-doc', draftId: 'drafts.live-doc'},
          typeName: 'liveEditType',
        } as unknown as OperationArgs

        restoreRevision.execute(args, 'lastRevision' as DocumentRevision)

        expect(mockHistoryStore.restoreRevision).toHaveBeenCalledWith(
          'live-doc',
          'live-doc',
          'lastRevision',
          {
            fromDeleted: false,
            useServerDocumentActions: true,
          },
        )
      })
    })
  })

  describe('restoreDocument', () => {
    describe('disabled', () => {
      it('is never disabled', () => {
        const args = {} as unknown as OperationArgs
        expect(restoreDocument.disabled(args)).toBe(false)
      })
    })

    describe('execute', () => {
      it('calls historyStore.restoreDocument with useServerDocumentActions for deleted documents', () => {
        vi.mocked(isLiveEditEnabled).mockReturnValue(false)

        const document = {
          _id: 'deleted-doc',
          _type: 'testType',
          _createdAt: '2023-01-01T00:00:00Z',
          _updatedAt: '2023-01-01T00:00:00Z',
          _rev: 'rev123',
        } as SanityDocument

        const args = {
          snapshots: {
            draft: null,
            published: null,
          },
          historyStore: mockHistoryStore,
          schema: {},
          idPair: {publishedId: 'deleted-doc', draftId: 'drafts.deleted-doc'},
          typeName: 'testType',
        } as unknown as OperationArgs

        restoreDocument.execute(args, document)

        expect(mockHistoryStore.restoreDocument).toHaveBeenCalledWith(
          'deleted-doc',
          'drafts.deleted-doc',
          document,
          {
            fromDeleted: true,
            useServerDocumentActions: true,
          },
        )
      })

      it('calls historyStore.restoreDocument without fromDeleted for existing documents', () => {
        vi.mocked(isLiveEditEnabled).mockReturnValue(false)

        const document = {
          _id: 'existing-doc',
          _type: 'testType',
          _createdAt: '2023-01-01T00:00:00Z',
          _updatedAt: '2023-01-01T00:00:00Z',
          _rev: 'rev123',
        } as SanityDocument

        const args = {
          snapshots: {
            draft: {} as SanityDocument,
            published: {} as SanityDocument,
          },
          historyStore: mockHistoryStore,
          schema: {},
          idPair: {publishedId: 'existing-doc', draftId: 'drafts.existing-doc'},
          typeName: 'testType',
        } as unknown as OperationArgs

        restoreDocument.execute(args, document)

        expect(mockHistoryStore.restoreDocument).toHaveBeenCalledWith(
          'existing-doc',
          'drafts.existing-doc',
          document,
          {
            fromDeleted: false,
            useServerDocumentActions: true,
          },
        )
      })

      it('handles live edit enabled documents', () => {
        vi.mocked(isLiveEditEnabled).mockReturnValue(true)

        const document = {
          _id: 'live-doc',
          _type: 'liveEditType',
          _createdAt: '2023-01-01T00:00:00Z',
          _updatedAt: '2023-01-01T00:00:00Z',
          _rev: 'rev123',
        } as SanityDocument

        const args = {
          snapshots: {
            draft: null,
            published: {} as SanityDocument,
          },
          historyStore: mockHistoryStore,
          schema: {},
          idPair: {publishedId: 'live-doc', draftId: 'drafts.live-doc'},
          typeName: 'liveEditType',
        } as unknown as OperationArgs

        restoreDocument.execute(args, document)

        expect(mockHistoryStore.restoreDocument).toHaveBeenCalledWith(
          'live-doc',
          'live-doc',
          document,
          {
            fromDeleted: false,
            useServerDocumentActions: true,
          },
        )
      })
    })
  })
})
