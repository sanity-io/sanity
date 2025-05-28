import {
  type CanvasResource,
  type Events,
  type MediaResource,
  type StudioResource,
} from '@sanity/message-protocol'
import {type DocumentHandle} from '@sanity/sdk'
import {useCallback} from 'react'

import {useComlinkStore} from '../store/_legacy/datastores'

interface DocumentInteractionHistory {
  recordEvent: (eventType: 'viewed' | 'edited' | 'created' | 'deleted') => void
}

/**
 * @public
 */
interface UseRecordDocumentHistoryEventProps extends DocumentHandle {
  resourceType: StudioResource['type'] | MediaResource['type'] | CanvasResource['type']
  resourceId?: string
  /**
   * The name of the schema collection this document belongs to.
   * Typically is the name of the workspace when used in the context of a studio.
   */
  schemaName?: string
}

/**
 * IMPORTANT!
 *
 * Based on the `useRecordDocumentHistoryEvent.ts` from `@sanity/sdk`.
 * This version has been lightly modified to use Studio's Comlink Store.
 *
 * TODO: Adopt `@sanity/sdk` when a compatible version is available.
 *
 * ---
 *
 * Hook for managing document interaction history in Sanity Studio.
 * This hook provides functionality to record document interactions.
 *
 * @param documentHandle - The document handle containing document ID and type, like `{_id: '123', _type: 'book'}`
 * @returns An object containing:
 * - `recordEvent` - Function to record document interactions
 * - `isConnected` - Boolean indicating if connection to Studio is established
 *
 * @example
 * ```tsx
 * function MyDocumentAction(props: DocumentActionProps) {
 *   const {documentId, documentType, resourceType, resourceId} = props
 *   const {recordEvent, isConnected} = useRecordDocumentHistoryEvent({
 *     documentId,
 *     documentType,
 *     resourceType,
 *     resourceId,
 *   })
 *
 *   return (
 *     <Button
 *       disabled={!isConnected}
 *       onClick={() => recordEvent('viewed')}
 *       text={'Viewed'}
 *     />
 *   )
 * }
 * ```
 *
 * @internal
 */
export function useRecordDocumentHistoryEvent({
  documentId,
  documentType,
  resourceType,
  resourceId,
  schemaName,
}: UseRecordDocumentHistoryEventProps): DocumentInteractionHistory {
  const {node} = useComlinkStore()

  if (resourceType !== 'studio' && !resourceId) {
    throw new Error('resourceId is required for media-library and canvas resources')
  }

  const recordEvent = useCallback(
    (eventType: 'viewed' | 'edited' | 'created' | 'deleted') => {
      try {
        const message: Events.HistoryMessage = {
          type: 'dashboard/v1/events/history',
          data: {
            eventType,
            document: {
              id: documentId,
              type: documentType,
              resource: {
                id: resourceId!,
                type: resourceType,
                schemaName,
              },
            },
          },
        }

        node?.post?.(message.type, message.data)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to record history event:', error)
        throw error
      }
    },
    [documentId, documentType, resourceId, resourceType, schemaName, node],
  )

  return {
    recordEvent,
  }
}
