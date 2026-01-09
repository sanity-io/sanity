import {type PrepareViewOptions, type SchemaType} from '@sanity/types'
import {describe, expect, it, vi} from 'vitest'

import {getPreviewStateObservable} from './getPreviewStateObservable'

// Mock schema type
const mockSchemaType = {
  name: 'article',
  type: 'document',
} as SchemaType

// Track calls to observeForPreview to verify viewOptions are passed correctly
function createMockDocumentPreviewStore() {
  const calls: Array<{
    document: {_id: string}
    schemaType: SchemaType
    options: {perspective?: unknown; viewOptions?: PrepareViewOptions}
  }> = []

  return {
    calls,
    observeForPreview: vi.fn(
      (
        document: {_id: string},
        schemaType: SchemaType,
        options: {perspective?: unknown; viewOptions?: PrepareViewOptions},
      ) => {
        calls.push({document, schemaType, options})
        // Return a minimal observable that emits once
        return {
          pipe: () => ({
            subscribe: () => ({unsubscribe: () => {}}),
          }),
        }
      },
    ),
  }
}

describe('getPreviewStateObservable', () => {
  describe('viewOptions threading', () => {
    it('passes viewOptions with ordering to observeForPreview when sortOrder is provided', () => {
      const store = createMockDocumentPreviewStore()
      const viewOptions: PrepareViewOptions = {
        ordering: {
          title: 'Title ascending',
          name: 'titleAsc',
          by: [{field: 'title', direction: 'asc'}],
        },
      }

      getPreviewStateObservable(store as any, mockSchemaType, 'article-123', undefined, viewOptions)

      // Should have called observeForPreview twice (perspectiveSnapshot and preparedVersionSnapshot)
      expect(store.observeForPreview).toHaveBeenCalledTimes(2)

      // Verify first call (perspectiveSnapshot) includes viewOptions
      expect(store.calls[0].options.viewOptions).toEqual(viewOptions)

      // Verify second call (preparedVersionSnapshot) includes viewOptions
      expect(store.calls[1].options.viewOptions).toEqual(viewOptions)
    })

    it('produces different viewOptions for different orderings', () => {
      const store1 = createMockDocumentPreviewStore()
      const store2 = createMockDocumentPreviewStore()

      const viewOptionsTitleAsc: PrepareViewOptions = {
        ordering: {
          title: 'Title ascending',
          name: 'titleAsc',
          by: [{field: 'title', direction: 'asc'}],
        },
      }

      const viewOptionsDateDesc: PrepareViewOptions = {
        ordering: {
          title: 'Date descending',
          name: 'dateDesc',
          by: [{field: '_createdAt', direction: 'desc'}],
        },
      }

      getPreviewStateObservable(
        store1 as any,
        mockSchemaType,
        'article-123',
        undefined,
        viewOptionsTitleAsc,
      )

      getPreviewStateObservable(
        store2 as any,
        mockSchemaType,
        'article-123',
        undefined,
        viewOptionsDateDesc,
      )

      // Verify the viewOptions are different between the two calls
      expect(store1.calls[0].options.viewOptions).not.toEqual(store2.calls[0].options.viewOptions)

      // Verify specific ordering values
      expect(store1.calls[0].options.viewOptions?.ordering?.by[0].field).toBe('title')
      expect(store1.calls[0].options.viewOptions?.ordering?.by[0].direction).toBe('asc')

      expect(store2.calls[0].options.viewOptions?.ordering?.by[0].field).toBe('_createdAt')
      expect(store2.calls[0].options.viewOptions?.ordering?.by[0].direction).toBe('desc')
    })

    it('does not pass viewOptions when no sortOrder is provided (backwards compatibility)', () => {
      const store = createMockDocumentPreviewStore()

      getPreviewStateObservable(store as any, mockSchemaType, 'article-123', undefined, undefined)

      // Should have called observeForPreview twice
      expect(store.observeForPreview).toHaveBeenCalledTimes(2)

      // Verify viewOptions is undefined in both calls
      expect(store.calls[0].options.viewOptions).toBeUndefined()
      expect(store.calls[1].options.viewOptions).toBeUndefined()
    })

    it('handles multi-field orderings', () => {
      const store = createMockDocumentPreviewStore()
      const viewOptions: PrepareViewOptions = {
        ordering: {
          title: 'Category then date',
          name: 'categoryDate',
          by: [
            {field: 'category', direction: 'asc'},
            {field: '_createdAt', direction: 'desc'},
          ],
        },
      }

      getPreviewStateObservable(store as any, mockSchemaType, 'article-123', undefined, viewOptions)

      const passedOrdering = store.calls[0].options.viewOptions?.ordering
      expect(passedOrdering?.by).toHaveLength(2)
      expect(passedOrdering?.by[0]).toEqual({field: 'category', direction: 'asc'})
      expect(passedOrdering?.by[1]).toEqual({field: '_createdAt', direction: 'desc'})
    })
  })
})
