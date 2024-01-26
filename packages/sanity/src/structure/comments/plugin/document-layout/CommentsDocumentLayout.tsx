import {useCallback} from 'react'
import {
  CommentsEnabledProvider,
  CommentsProvider,
  CommentsSelectedPathProvider,
  CommentsUpsellProvider,
  useCommentsEnabled,
} from '../../src'
import {useDocumentPane} from '../../..'
import {ConditionalWrapper} from '../../../../ui-components/conditionalWrapper'
import {COMMENTS_INSPECTOR_NAME} from '../../../panes/document/constants'
import {DocumentLayoutProps} from 'sanity'

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
    >
      <ConditionalWrapper
        condition={commentsEnabled.reason === 'upsell'}
        // eslint-disable-next-line react/jsx-no-bind
        wrapper={(children) => <CommentsUpsellProvider>{children}</CommentsUpsellProvider>}
      >
        <CommentsSelectedPathProvider>{props.renderDefault(props)}</CommentsSelectedPathProvider>
      </ConditionalWrapper>
    </CommentsProvider>
  )
}
