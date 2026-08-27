import {useCallback, useLayoutEffect, useRef} from 'react'
import {
  COMMENTS_INSPECTOR_NAME,
  CommentsEnabledProvider,
  CommentsProvider as CommentsProviderLegacy,
  getDraftId,
  getPublishedId,
  getTargetScopeId,
  getVersionId,
  useCommentsEnabled,
  usePerspective,
  useWorkspace,
} from 'sanity'
import {useRouter} from 'sanity/router'

// The v2 provider is deliberately not part of the public `sanity` surface while
// `beta.comments.v2` is opt-in, so it can't be reached through the entry point
// the boundaries policy expects. This suppression goes away with the legacy stack.
// oxlint-disable-next-line boundaries/dependencies
import {CommentsProvider as CommentsProviderV2} from '../../../../core/comments/context/comments/CommentsProvider'
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
  const {beta} = useWorkspace()
  const commentsV2 = Boolean(beta?.comments?.v2)
  const {connectionState, onPathOpen, inspector, openInspector, targetDocumentState, value} =
    useDocumentPane()
  const {selectedPerspectiveName, selectedReleaseId, selectedVariantName} = usePerspective()
  const {params, setParams} = usePaneRouter()
  const {resolveIntentLink} = useRouter()

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
      return `${window.location.origin}${intentLink}`
    },
    [
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

  const sharedProps = {
    documentId,
    documentType,
    getCommentLink,
    isCommentsOpen: inspector?.name === COMMENTS_INSPECTOR_NAME,
    isConnecting: connectionState === 'connecting',
    onClearSelectedComment: handleClearSelectedComment,
    onCommentsOpen: handleOpenCommentsInspector,
    onPathOpen,
    selectedCommentId,
    sortOrder: 'desc' as const,
    type: 'field' as const,
  }

  if (commentsV2) {
    // The comment target follows the selected perspective rather than whichever document happens to
    // exist. Drafts / published / release version ids are deterministic from the published id
    // (`drafts.<id>`, `<id>`, `versions.<releaseId>.<id>`), so we can target them before that
    // document exists — same as commenting on a draft that has not been created yet.
    // Variant scope ids are opaque and server-assigned, so we take the resolved `value._id` and
    // rely on the provider to treat a non-version id in a variant perspective as not ready.
    let sourceDocumentId: string
    // Variant before release: when both sticky params are set the document on
    // screen is the variant-scoped version (opaque id), not
    // `versions.<releaseId>.<id>`. Same precedence as legacy
    // `releaseId={scopeId}` when a variant is active.
    if (selectedVariantName) {
      sourceDocumentId = value._id
    } else if (selectedReleaseId) {
      sourceDocumentId = getVersionId(value._id, selectedReleaseId)
    } else if (selectedPerspectiveName === 'published') {
      sourceDocumentId = getPublishedId(value._id)
    } else {
      sourceDocumentId = getDraftId(value._id)
    }

    return (
      <CommentsProviderV2 {...sharedProps} sourceDocumentId={sourceDocumentId}>
        {children}
      </CommentsProviderV2>
    )
  }

  return (
    <CommentsProviderLegacy {...sharedProps} releaseId={scopeId}>
      {children}
    </CommentsProviderLegacy>
  )
}
