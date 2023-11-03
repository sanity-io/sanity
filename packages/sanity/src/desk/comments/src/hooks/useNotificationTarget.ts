import {useCallback} from 'react'
import {useMemoObservable} from 'react-rx'
import {of} from 'rxjs'
import {usePaneRouter} from '../../../components'
import {COMMENTS_INSPECTOR_NAME} from '../../../panes/document/constants'
import {CommentContext} from '../types'
import {getPreviewStateObservable, useDocumentPreviewStore, useSchema, useWorkspace} from 'sanity'

interface NotificationTargetHookOptions {
  documentId: string
  documentType: string
}

interface NotificationTargetHookValue {
  /**
   * Returns an object with notification-specific values for the selected comment, such as
   * the current workspace + document title and full URL to the comment.
   * These values are currently used in notification emails.
   *
   * **Please note:** this will generate a URL for the comment based on the current _active_ pane.
   * The current active pane may not necessarily be the right-most desk pane and in these cases,
   * the selected comment may not be visible on initial load when visiting these URLs.
   */
  getNotificationValue: ({commentId}: {commentId: string}) => CommentContext['notification']
}

/** @internal */
export function useNotificationTarget(
  opts: NotificationTargetHookOptions,
): NotificationTargetHookValue {
  const {documentId, documentType} = opts || {}
  const schemaType = useSchema().get(documentType)
  const {title: workspaceTitle} = useWorkspace()
  const {createPathWithParams, params} = usePaneRouter()

  const documentPreviewStore = useDocumentPreviewStore()

  const previewState = useMemoObservable(() => {
    if (!documentId || !schemaType) return of(null)
    return getPreviewStateObservable(documentPreviewStore, schemaType, documentId, '')
  }, [documentId, documentPreviewStore, schemaType])

  const {published, draft} = previewState || {}
  const documentTitle = (draft?.title || published?.title || 'Sanity document') as string

  const handleGetNotificationValue = useCallback(
    ({commentId}: {commentId: string}) => {
      // Generate a path based on the current pane params.
      // We force a value for `inspect` to ensure that this is included in URLs when comments
      // are created outside of the inspector context (i.e. directly on the field)
      // @todo: consider filtering pane router params and culling all non-active RHS panes prior to generating this link
      const path = createPathWithParams({
        ...params,
        comment: commentId,
        inspect: COMMENTS_INSPECTOR_NAME,
      })
      const url = `${window.location.origin}${path}`

      return {documentTitle, url, workspaceTitle}
    },
    [createPathWithParams, documentTitle, params, workspaceTitle],
  )

  return {
    getNotificationValue: handleGetNotificationValue,
  }
}
