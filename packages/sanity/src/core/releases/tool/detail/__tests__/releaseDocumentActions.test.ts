import {beforeEach, describe, expect, it, vi} from 'vitest'

import {isGoingToUnpublish} from '../../../util/isGoingToUnpublish'
import {
  DOCUMENT_ACTION_CONFIGS,
  type DocumentActionConfig,
  getDocumentActionType,
  getReleaseDocumentActionConfig,
} from '../releaseDocumentActions'
import {type DocumentWithHistory} from '../ReleaseSummary'
import {documentsInRelease} from './__mocks__/useBundleDocuments.mock'

vi.mock('../../../util/isGoingToUnpublish', () => ({
  isGoingToUnpublish: vi.fn(),
}))

const mockIsGoingToUnpublish = vi.mocked(isGoingToUnpublish)

/**
 * Helper function to create DocumentWithHistory mocks for testing
 */
function createDocumentWithHistoryMock(
  overrides: Partial<DocumentWithHistory> = {},
): DocumentWithHistory {
  return {
    ...documentsInRelease,
    history: undefined,
    ...overrides,
  } as DocumentWithHistory
}

describe('releaseDocumentActions', () => {
  describe('getDocumentActionType', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should return null when document is undefined', () => {
      const documentWithHistory = createDocumentWithHistoryMock({document: undefined})

      const result = getDocumentActionType(documentWithHistory)

      expect(result).toBeNull()
    })

    it('should return null when document is pending', () => {
      const documentWithHistory = createDocumentWithHistoryMock({
        isPending: true,
      })

      const result = getDocumentActionType(documentWithHistory)

      expect(result).toBeNull()
    })

    it('should return null when previewValues is loading', () => {
      const documentWithHistory = createDocumentWithHistoryMock({
        previewValues: {isLoading: true, values: null},
      })

      const result = getDocumentActionType(documentWithHistory)

      expect(result).toBeNull()
    })

    it('should return "unpublished" when document is going to be unpublished', () => {
      mockIsGoingToUnpublish.mockReturnValue(true)

      const documentWithHistory = createDocumentWithHistoryMock()

      const result = getDocumentActionType(documentWithHistory)

      expect(result).toBe('unpublished')
      expect(mockIsGoingToUnpublish).toHaveBeenCalledWith(documentWithHistory.document)
    })

    it('should return "changed" when document has published version but is not being unpublished', () => {
      mockIsGoingToUnpublish.mockReturnValue(false)

      const documentWithHistory = createDocumentWithHistoryMock()

      const result = getDocumentActionType(documentWithHistory)

      expect(result).toBe('changed')
      expect(mockIsGoingToUnpublish).toHaveBeenCalledWith(documentWithHistory.document)
    })

    it('should return "added" when document has no published version', () => {
      mockIsGoingToUnpublish.mockReturnValue(false)

      const documentWithHistory = createDocumentWithHistoryMock({
        document: {
          ...documentsInRelease.document,
          publishedDocumentExists: false,
        },
      })

      const result = getDocumentActionType(documentWithHistory)

      expect(result).toBe('added')
      expect(mockIsGoingToUnpublish).toHaveBeenCalledWith(documentWithHistory.document)
    })

    it('should handle undefined previewValues', () => {
      const documentWithHistory = createDocumentWithHistoryMock({
        document: {
          ...documentsInRelease.document,
          publishedDocumentExists: false,
        },
        previewValues: undefined,
      })

      mockIsGoingToUnpublish.mockReturnValue(false)

      const result = getDocumentActionType(documentWithHistory)

      expect(result).toBe('added')
    })
  })

  describe('getReleaseDocumentActionConfig', () => {
    it('should return config for "added" action type', () => {
      const result = getReleaseDocumentActionConfig('added')

      expect(result).toEqual({
        key: 'added',
        tone: 'positive',
        translationKey: 'table-body.action.add',
      })
    })

    it('should return config for "changed" action type', () => {
      const result = getReleaseDocumentActionConfig('changed')

      expect(result).toEqual({
        key: 'changed',
        tone: 'caution',
        translationKey: 'table-body.action.change',
      })
    })

    it('should return config for "unpublished" action type', () => {
      const result = getReleaseDocumentActionConfig('unpublished')

      expect(result).toEqual({
        key: 'unpublished',
        tone: 'critical',
        translationKey: 'table-body.action.unpublish',
      })
    })

    it('should return undefined for unknown action type', () => {
      const result = getReleaseDocumentActionConfig('unknown' as DocumentActionConfig['key'])

      expect(result).toBeUndefined()
    })
  })

  describe('DOCUMENT_ACTION_CONFIGS', () => {
    it('should have correct structure and all expected action types', () => {
      expect(DOCUMENT_ACTION_CONFIGS).toHaveLength(3)

      const actionKeys = DOCUMENT_ACTION_CONFIGS.map((config) => config.key)
      expect(actionKeys).toEqual(['added', 'changed', 'unpublished'])

      DOCUMENT_ACTION_CONFIGS.forEach((config) => {
        expect(config).toHaveProperty('key')
        expect(config).toHaveProperty('tone')
        expect(config).toHaveProperty('translationKey')
        expect(typeof config.key).toBe('string')
        expect(typeof config.tone).toBe('string')
        expect(typeof config.translationKey).toBe('string')
      })
    })

    it('should have correct tones for each action type', () => {
      const configByKey = DOCUMENT_ACTION_CONFIGS.reduce(
        (acc, config) => {
          acc[config.key] = config
          return acc
        },
        {} as Record<string, DocumentActionConfig>,
      )

      expect(configByKey.added.tone).toBe('positive')
      expect(configByKey.changed.tone).toBe('caution')
      expect(configByKey.unpublished.tone).toBe('critical')
    })
  })
})
