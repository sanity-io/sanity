import {useCallback, useLayoutEffect, useRef} from 'react'
import {
  COMMENTS_INSPECTOR_NAME,
  CommentsEnabledProvider,
  CommentsProvider,
  useCommentsEnabled,
  usePerspective,
} from 'sanity'

import {usePaneRouter} from '../../../components'
import {useDocumentPane} from '../useDocumentPane'

interface CommentsWrapperProps {
  children: React.ReactNode
  documentId: string
  documentType: string
}

/**
 * @internal
 * A wrapper that conditionally wraps the document layout in a comments provider
 * if the feature is enabled for the project and the current document.
 */
export function CommentsWrapper(props: CommentsWrapperProps) {
  const {children, documentId, documentType} = props

  return (
    <CommentsEnabledProvider documentId={documentId} documentType={documentType}>
      <CommentsProviderWrapper documentId={documentId} documentType={documentType}>
        {children}
      </CommentsProviderWrapper>
    </CommentsEnabledProvider>
  )
}

function CommentsProviderWrapper(props: CommentsWrapperProps) {
  const {children, documentId, documentType} = props

  const {enabled} = useCommentsEnabled()
  const {connectionState, onPathOpen, inspector, openInspector} = useDocumentPane()
  const {selectedReleaseId} = usePerspective()
  const {params, setParams, createPathWithParams} = usePaneRouter()

  const selectedCommentId = params?.comment
  const paramsRef = useRef(params)

  useLayoutEffect(() => {
    paramsRef.current = params
  }, [params])

  const getCommentLink = useCallback(
    (commentId: string) => {
      // Generate a path based on the current pane params.
      // We force a value for `inspect` to ensure that this is included in URLs when comments
      // are created outside of the inspector context (i.e. directly on the field)
      // @todo: consider filtering pane router params and culling all non-active RHS panes prior to generating this link
      const path = createPathWithParams({
        ...paramsRef.current,
        comment: commentId,
        inspect: COMMENTS_INSPECTOR_NAME,
      })
      return `${window.location.origin}${path}`
    },
    [createPathWithParams],
  )

  const handleClearSelectedComment = useCallback(() => {
    setParams({...paramsRef.current, comment: undefined})
  }, [setParams])

  const handleOpenCommentsInspector = useCallback(() => {
    if (inspector?.name === COMMENTS_INSPECTOR_NAME) return

    openInspector(COMMENTS_INSPECTOR_NAME)
  }, [inspector?.name, openInspector])

  // If comments are not enabled, render the default document layout
  if (!enabled) {
    return <>{children}</>
  }

  return (
    <CommentsProvider
      documentId={documentId}
      documentType={documentType}
      getCommentLink={getCommentLink}
      isCommentsOpen={inspector?.name === COMMENTS_INSPECTOR_NAME}
      isConnecting={connectionState === 'connecting'}
      onClearSelectedComment={handleClearSelectedComment}
      onCommentsOpen={handleOpenCommentsInspector}
      onPathOpen={onPathOpen}
      selectedCommentId={selectedCommentId}
      sortOrder="desc"
      type="field"
      releaseId={selectedReleaseId}
    >
      {children}
    </CommentsProvider>
  )
}
