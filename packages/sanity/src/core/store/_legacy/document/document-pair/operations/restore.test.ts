import {type SanityDocument} from '@sanity/types'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {type DocumentRevision} from '../../../history'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'
import {restoreDocument, restoreRevision} from './restore'
import {type OperationArgs} from './types'

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

describe('restore operations', () => {
  describe('restoreRevision', () => {
    describe('disabled', () => {
      it('is never disabled', () => {
        const args = {} as unknown as OperationArgs
        expect(restoreRevision.disabled(args)).toBe(false)
      })
    })

    describe('execute', () => {
      it('calls historyStore.restoreRevision with published ID for live edit enabled', () => {
        vi.mocked(isLiveEditEnabled).mockReturnValue(true)

        const args = {
          historyStore: mockHistoryStore,
          schema: {},
          idPair: {publishedId: 'pub-id', draftId: 'drafts.pub-id'},
          typeName: 'testType',
        } as unknown as OperationArgs

        restoreRevision.execute(args, 'lastRevision' as DocumentRevision)

        expect(mockHistoryStore.restoreRevision).toHaveBeenCalledWith(
          'pub-id',
          'pub-id',
          'lastRevision',
        )
      })

      it('calls historyStore.restoreRevision with draft ID for regular documents', () => {
        vi.mocked(isLiveEditEnabled).mockReturnValue(false)

        const args = {
          historyStore: mockHistoryStore,
          schema: {},
          idPair: {publishedId: 'pub-id', draftId: 'drafts.pub-id'},
          typeName: 'testType',
        } as unknown as OperationArgs

        restoreRevision.execute(args, 'specific-revision-123' as DocumentRevision)

        expect(mockHistoryStore.restoreRevision).toHaveBeenCalledWith(
          'pub-id',
          'drafts.pub-id',
          'specific-revision-123',
        )
      })

      it('handles lastRevision parameter correctly', () => {
        vi.mocked(isLiveEditEnabled).mockReturnValue(false)

        const args = {
          historyStore: mockHistoryStore,
          schema: {},
          idPair: {publishedId: 'test-doc', draftId: 'drafts.test-doc'},
          typeName: 'testType',
        } as unknown as OperationArgs

        restoreRevision.execute(args, 'lastRevision' as DocumentRevision)

        expect(mockHistoryStore.restoreRevision).toHaveBeenCalledWith(
          'test-doc',
          'drafts.test-doc',
          'lastRevision',
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
      it('calls historyStore.restoreDocument with published ID for live edit enabled', () => {
        vi.mocked(isLiveEditEnabled).mockReturnValue(true)

        const document = {
          _id: 'pub-id',
          _type: 'testType',
          _createdAt: '2023-01-01T00:00:00Z',
          _updatedAt: '2023-01-01T00:00:00Z',
          _rev: 'rev123',
        } as SanityDocument

        const args = {
          historyStore: mockHistoryStore,
          schema: {},
          idPair: {publishedId: 'pub-id', draftId: 'drafts.pub-id'},
          typeName: 'testType',
        } as unknown as OperationArgs

        restoreDocument.execute(args, document)

        expect(mockHistoryStore.restoreDocument).toHaveBeenCalledWith('pub-id', document)
      })

      it('calls historyStore.restoreDocument with draft ID for regular documents', () => {
        vi.mocked(isLiveEditEnabled).mockReturnValue(false)

        const document = {
          _id: 'pub-id',
          _type: 'testType',
          _createdAt: '2023-01-01T00:00:00Z',
          _updatedAt: '2023-01-01T00:00:00Z',
          _rev: 'rev123',
        } as SanityDocument

        const args = {
          historyStore: mockHistoryStore,
          schema: {},
          idPair: {publishedId: 'pub-id', draftId: 'drafts.pub-id'},
          typeName: 'testType',
        } as unknown as OperationArgs

        restoreDocument.execute(args, document)

        expect(mockHistoryStore.restoreDocument).toHaveBeenCalledWith(
          'drafts.pub-id',
          document,
        )
      })
    })
  })
})
