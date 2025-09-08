import {useCallback, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {of} from 'rxjs'

import {useSchema} from '../../hooks'
import {getPreviewStateObservable} from '../../preview'
import {useDocumentPreviewStore} from '../../store'
import {useWorkspace} from '../../studio'
import {type CommentContext} from '../types'

interface NotificationTargetHookOptions {
  documentId: string
  documentType: string
  getCommentLink?: (commentId: string) => string
  documentVersionId?: string
}

interface NotificationTargetHookValue {
  /**
   * Returns an object with notification-specific values for the selected comment, such as
   * the current workspace + document title and full URL to the comment.
   * These values are currently used in notification emails.
   *
   * **Please note:** this will generate a URL for the comment based on the current _active_ pane.
   * The current active pane may not necessarily be the right-most structure pane and in these
   * cases, the selected comment may not be visible on initial load when visiting these URLs.
   */
  getNotificationValue: ({commentId}: {commentId: string}) => CommentContext['notification']
}

/** @internal */
export function useNotificationTarget(
  opts: NotificationTargetHookOptions,
): NotificationTargetHookValue {
  const {documentId, documentType, getCommentLink, documentVersionId} = opts || {}
  const schemaType = useSchema().get(documentType)
  const {title: workspaceTitle, name: workspaceName} = useWorkspace()

  const documentPreviewStore = useDocumentPreviewStore()

  const previewStateObservable = useMemo(() => {
    if (!documentId || !schemaType) return of(null)
    const perspectiveStack = documentVersionId ? [documentVersionId, 'drafts'] : ['drafts']
    return getPreviewStateObservable(documentPreviewStore, schemaType, documentId, perspectiveStack)
  }, [documentId, documentPreviewStore, schemaType, documentVersionId])
  const previewState = useObservable(previewStateObservable)

  const {snapshot, original} = previewState || {}
  const documentTitle = (snapshot?.title || original?.title || 'Sanity document') as string

  const handleGetNotificationValue = useCallback(
    ({commentId}: {commentId: string}) => ({
      documentTitle,
      url: getCommentLink?.(commentId),
      workspaceTitle,
      workspaceName,
    }),
    [documentTitle, getCommentLink, workspaceTitle, workspaceName],
  )

  return {
    getNotificationValue: handleGetNotificationValue,
  }
}
