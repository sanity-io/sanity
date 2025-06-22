import {type SanityDocument} from '@sanity/types'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import type {DocumentRevision} from '../../../history/createHistoryStore'
import {type OperationArgs} from '../operations/types'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'
import {restore} from './restore'

vi.mock('../utils/isLiveEditEnabled', () => ({isLiveEditEnabled: vi.fn()}))

const mockHistoryStore = {
  restore: vi.fn(),
}

beforeEach(() => {
  vi.mocked(isLiveEditEnabled).mockClear()
  mockHistoryStore.restore.mockClear()
})

describe('server restore operation', () => {
  describe('disabled', () => {
    it('is never disabled', () => {
      const args = {} as unknown as OperationArgs
      expect(restore.disabled(args)).toBe(false)
    })
  })

  describe('execute', () => {
    it('calls historyStore.restore with useServerDocumentActions for deleted documents', () => {
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

      restore.execute(args, 'lastRevision' as DocumentRevision)

      expect(mockHistoryStore.restore).toHaveBeenCalledWith(
        'deleted-doc',
        'drafts.deleted-doc',
        'lastRevision',
        {
          fromDeleted: true,
          useServerDocumentActions: true,
        },
      )
    })

    it('calls historyStore.restore without fromDeleted for existing documents', () => {
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

      restore.execute(args, 'specific-rev' as DocumentRevision)

      expect(mockHistoryStore.restore).toHaveBeenCalledWith(
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

      restore.execute(args, 'lastRevision' as DocumentRevision)

      expect(mockHistoryStore.restore).toHaveBeenCalledWith(
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
