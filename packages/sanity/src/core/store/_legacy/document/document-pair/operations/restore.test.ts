import {beforeEach, describe, expect, it, vi} from 'vitest'

import type {DocumentRevision} from '../../../history/createHistoryStore'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'
import {restore} from './restore'
import {type OperationArgs} from './types'

vi.mock('../utils/isLiveEditEnabled', () => ({isLiveEditEnabled: vi.fn()}))

const mockHistoryStore = {
  restore: vi.fn(),
}

beforeEach(() => {
  vi.mocked(isLiveEditEnabled).mockClear()
  mockHistoryStore.restore.mockClear()
})

describe('restore operation', () => {
  describe('disabled', () => {
    it('is never disabled', () => {
      const args = {} as unknown as OperationArgs
      expect(restore.disabled(args)).toBe(false)
    })
  })

  describe('execute', () => {
    it('calls historyStore.restore with published ID for live edit enabled', () => {
      vi.mocked(isLiveEditEnabled).mockReturnValue(true)

      const args = {
        historyStore: mockHistoryStore,
        schema: {},
        idPair: {publishedId: 'pub-id', draftId: 'drafts.pub-id'},
        typeName: 'testType',
      } as unknown as OperationArgs

      restore.execute(args, 'lastRevision' as DocumentRevision)

      expect(mockHistoryStore.restore).toHaveBeenCalledWith('pub-id', 'pub-id', 'lastRevision')
    })

    it('calls historyStore.restore with draft ID for regular documents', () => {
      vi.mocked(isLiveEditEnabled).mockReturnValue(false)

      const args = {
        historyStore: mockHistoryStore,
        schema: {},
        idPair: {publishedId: 'pub-id', draftId: 'drafts.pub-id'},
        typeName: 'testType',
      } as unknown as OperationArgs

      restore.execute(args, 'specific-revision-123' as DocumentRevision)

      expect(mockHistoryStore.restore).toHaveBeenCalledWith(
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

      restore.execute(args, 'lastRevision' as DocumentRevision)

      expect(mockHistoryStore.restore).toHaveBeenCalledWith(
        'test-doc',
        'drafts.test-doc',
        'lastRevision',
      )
    })
  })
})
