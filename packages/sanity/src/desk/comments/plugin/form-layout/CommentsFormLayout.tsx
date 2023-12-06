import React, {useCallback} from 'react'
import {
  CommentsEnabledProvider,
  CommentsProvider,
  CommentsSelectedPathProvider,
  useCommentsEnabled,
} from '../../src'
import {useDocumentPane} from '../../..'
import {COMMENTS_INSPECTOR_NAME} from '../../../panes/document/constants'
import {FormLayoutProps} from 'sanity'

export function CommentsFormLayout(props: FormLayoutProps) {
  const {documentId, documentType} = props

  return (
    <CommentsEnabledProvider documentId={documentId} documentType={documentType}>
      <CommentsFormLayoutInner {...props} />
    </CommentsEnabledProvider>
  )
}

function CommentsFormLayoutInner(props: FormLayoutProps) {
  const {documentId, documentType} = props
  const commentsEnabled = useCommentsEnabled()
  const {openInspector, inspector} = useDocumentPane()

  const handleOpenCommentsInspector = useCallback(() => {
    if (inspector?.name === COMMENTS_INSPECTOR_NAME) return

    openInspector(COMMENTS_INSPECTOR_NAME)
  }, [inspector?.name, openInspector])

  // If comments are not enabled, render the default form layout
  if (!commentsEnabled) {
    return props.renderDefault(props)
  }

  return (
    <CommentsEnabledProvider documentId={documentId} documentType={documentType}>
      <CommentsProvider
        documentId={documentId}
        documentType={documentType}
        isCommentsOpen={inspector?.name === COMMENTS_INSPECTOR_NAME}
        onCommentsOpen={handleOpenCommentsInspector}
      >
        <CommentsSelectedPathProvider>{props.renderDefault(props)}</CommentsSelectedPathProvider>
      </CommentsProvider>
    </CommentsEnabledProvider>
  )
}
