import {useCallback} from 'react'
import {type DocumentLayoutProps} from 'sanity'

import {useDocumentPane} from '../../..'
import {COMMENTS_INSPECTOR_NAME} from '../../../panes/document/constants'
import {
  CommentsAuthoringPathProvider,
  CommentsEnabledProvider,
  CommentsProvider,
  CommentsSelectedPathProvider,
  useCommentsEnabled,
} from '../../src'

export function CommentsDocumentLayout(props: DocumentLayoutProps) {
  const {documentId, documentType} = props

  return (
    <CommentsEnabledProvider documentId={documentId} documentType={documentType}>
      <CommentsDocumentLayoutInner {...props} />
    </CommentsEnabledProvider>
  )
}

function CommentsDocumentLayoutInner(props: DocumentLayoutProps) {
  const {documentId, documentType} = props
  const commentsEnabled = useCommentsEnabled()
  const {openInspector, inspector} = useDocumentPane()

  const handleOpenCommentsInspector = useCallback(() => {
    if (inspector?.name === COMMENTS_INSPECTOR_NAME) return

    openInspector(COMMENTS_INSPECTOR_NAME)
  }, [inspector?.name, openInspector])

  // If comments are not enabled, render the default document layout
  if (!commentsEnabled.enabled) {
    return props.renderDefault(props)
  }

  return (
    <CommentsProvider
      documentId={documentId}
      documentType={documentType}
      isCommentsOpen={inspector?.name === COMMENTS_INSPECTOR_NAME}
      onCommentsOpen={handleOpenCommentsInspector}
      sortOrder="desc"
      type="field"
    >
      <CommentsSelectedPathProvider>
        <CommentsAuthoringPathProvider>{props.renderDefault(props)}</CommentsAuthoringPathProvider>
      </CommentsSelectedPathProvider>
    </CommentsProvider>
  )
}
