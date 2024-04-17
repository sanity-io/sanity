import {type DocumentLayoutProps} from '../../../config'
import {
  CommentsAuthoringPathProvider,
  CommentsEnabledProvider,
  CommentsSelectedPathProvider,
} from '../../context'
import {useCommentsEnabled} from '../../hooks'

export function CommentsDocumentLayout(props: DocumentLayoutProps) {
  const {documentId, documentType} = props

  return (
    <CommentsEnabledProvider documentId={documentId} documentType={documentType}>
      <CommentsDocumentLayoutInner {...props} />
    </CommentsEnabledProvider>
  )
}

function CommentsDocumentLayoutInner(props: DocumentLayoutProps) {
  const commentsEnabled = useCommentsEnabled()

  // If comments are not enabled, render the default document layout
  if (!commentsEnabled.enabled) {
    return props.renderDefault(props)
  }

  return (
    <CommentsSelectedPathProvider>
      <CommentsAuthoringPathProvider>{props.renderDefault(props)}</CommentsAuthoringPathProvider>
    </CommentsSelectedPathProvider>
  )
}
