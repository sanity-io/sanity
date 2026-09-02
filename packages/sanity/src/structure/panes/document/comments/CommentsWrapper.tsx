import {useCallback, useLayoutEffect, useRef} from 'react'
import {
  COMMENTS_INSPECTOR_NAME,
  CommentsEnabledProvider,
  CommentsProvider,
  useCommentsEnabled,
  getTargetScopeId,
  usePerspective,
  useStudioUrl,
} from 'sanity'
import {useRouter} from 'sanity/router'

import {usePaneRouter} from '../../../components/paneRouter/usePaneRouter'
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
  const {connectionState, onPathOpen, inspector, openInspector, targetDocumentState} =
    useDocumentPane()
  const {selectedReleaseId, selectedVariantName} = usePerspective()
  const {params, setParams} = usePaneRouter()
  const {resolveIntentLink} = useRouter()
  const {buildIntentUrl} = useStudioUrl()

  // The scope of the document targeted by the selected perspective (undefined when the target is
  // still resolving or the draft/published pair applies). While resolving, reverting is disabled
  // below instead of silently operating on the base pair.
  const scopeId = getTargetScopeId(targetDocumentState)

  const selectedCommentId = params?.comment
  const scheduledDraft = params?.scheduledDraft
  const paramsRef = useRef(params)

  useLayoutEffect(() => {
    paramsRef.current = params
  }, [params])

  const getCommentLink = useCallback(
    (commentId: string) => {
      const searchParams: [string, string][] =
        selectedReleaseId && !scheduledDraft ? [['perspective', selectedReleaseId]] : []

      if (selectedVariantName) {
        searchParams.push(['variant', selectedVariantName])
      }

      const intentLink = resolveIntentLink(
        'edit',
        {
          id: documentId,
          type: documentType,
          inspect: COMMENTS_INSPECTOR_NAME,
          comment: commentId,
          ...(scheduledDraft ? {scheduledDraft} : {}),
        },
        searchParams,
      )
      // Not `window.location.origin + intentLink`: when the Studio runs inside the
      // dashboard, the workspace is identified by the dashboard path rather than the
      // workspace basePath, so a link carrying the basePath cannot be resolved there.
      // `buildIntentUrl` swaps the basePath for the dashboard path in that context and
      // is a no-op in a standalone Studio.
      return buildIntentUrl(intentLink)
    },
    [
      buildIntentUrl,
      documentId,
      documentType,
      resolveIntentLink,
      scheduledDraft,
      selectedReleaseId,
      selectedVariantName,
    ],
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
      releaseId={scopeId}
    >
      {children}
    </CommentsProvider>
  )
}
