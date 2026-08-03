import {useCallback} from 'react'
import {filter, firstValueFrom, of, timeout} from 'rxjs'

import {useSchema} from '../../hooks/useSchema'
import {getPreviewStateObservable} from '../../preview/utils/getPreviewStateObservable'
import {useDocumentPreviewStore} from '../../store/datastores'
import {useWorkspace} from '../../studio/workspace'
import {type CommentContext} from '../types'

/** How long to wait for a preview title before falling back. */
const PREVIEW_TITLE_TIMEOUT_MS = 3_000

const FALLBACK_DOCUMENT_TITLE = 'Sanity document'

interface NotificationTargetHookOptions {
  documentId: string
  documentType: string
  getCommentLink?: (commentId: string) => string
  documentVersionId?: string
}

interface NotificationTargetHookValue {
  /**
   * Returns a promise that resolves with notification-specific values for the
   * selected comment, such as the current workspace + document title and full
   * URL to the comment. These values are currently used in notification emails.
   *
   * The document title is resolved on demand (one-shot preview subscription)
   * rather than via a persistent listener, since it is only needed when a
   * comment is created.
   *
   * **Please note:** this will generate a URL for the comment based on the current _active_ pane.
   * The current active pane may not necessarily be the right-most structure pane and in these
   * cases, the selected comment may not be visible on initial load when visiting these URLs.
   */
  getNotificationValue: ({
    commentId,
  }: {
    commentId: string
  }) => Promise<CommentContext['notification']>
}

/** @internal */
export function useNotificationTarget(
  opts: NotificationTargetHookOptions,
): NotificationTargetHookValue {
  const {documentId, documentType, getCommentLink, documentVersionId} = opts || {}
  const schemaType = useSchema().get(documentType)
  const {title: workspaceTitle, name: workspaceName} = useWorkspace()

  const documentPreviewStore = useDocumentPreviewStore()

  const handleGetNotificationValue = useCallback(
    async ({commentId}: {commentId: string}): Promise<CommentContext['notification']> => {
      let documentTitle = FALLBACK_DOCUMENT_TITLE

      if (documentId && schemaType) {
        const perspectiveStack = documentVersionId ? [documentVersionId, 'drafts'] : ['drafts']
        const previewStateObservable = getPreviewStateObservable(
          documentPreviewStore,
          schemaType,
          documentId,
          perspectiveStack,
        )

        const previewState = await firstValueFrom(
          previewStateObservable.pipe(
            filter((state) => !state.isLoading),
            timeout({
              first: PREVIEW_TITLE_TIMEOUT_MS,
              with: () => of(null),
            }),
          ),
        )

        documentTitle = (previewState?.snapshot?.title ||
          previewState?.original?.title ||
          FALLBACK_DOCUMENT_TITLE) as string
      }

      return {
        documentTitle,
        url: getCommentLink?.(commentId),
        workspaceTitle,
        workspaceName,
      }
    },
    [
      documentId,
      documentPreviewStore,
      documentVersionId,
      getCommentLink,
      schemaType,
      workspaceName,
      workspaceTitle,
    ],
  )

  return {
    getNotificationValue: handleGetNotificationValue,
  }
}
