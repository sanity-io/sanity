import {type DocumentLayoutProps} from '../../../config'
import {
  CommentsAuthoringPathProvider,
  CommentsEnabledProvider,
  CommentsSelectedPathProvider,
} from '../../context'
import {useCommentsEnabled} from '../../hooks'

export function CommentsDocumentLayout(props: DocumentLayoutProps) {
  const {documentId, documentType} = props
  const parentContext = useCommentsEnabled()

  // If there is a parent context and the mode is not null, a parent provider is
  // already checking if comments are enabled. In such cases, additional wrapping
  // of the document layout in the `CommentsEnabledProvider` is unnecessary.
  // The `DocumentPane` component within the `structureTool` handles this wrapping.
  // However, as this plugin may be used in contexts outside of the `structureTool`,
  // we must check for a parent context that checks if comments are enabled and
  // conditionally apply the `CommentsEnabledProvider` wrapping if it is not present.
  if (parentContext.mode !== null) {
    return <CommentsDocumentLayoutInner {...props} />
  }

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
