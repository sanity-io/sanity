import {use} from 'react'
import {CommentsEnabledContextV2} from 'sanity/_singletons'

import {type DocumentLayoutProps} from '../../../config/types'
import {CommentsAuthoringPathProvider} from '../../context/authoring-path/CommentsAuthoringPathProvider'
import {CommentsEnabledProvider} from '../../context/enabled/CommentsEnabledProvider'
import {CommentsSelectedPathProvider} from '../../context/selected-path/CommentsSelectedPathProvider'

export default function CommentsDocumentLayout(props: DocumentLayoutProps) {
  const {documentId, documentType} = props
  const parentEnabled = use(CommentsEnabledContextV2)

  // When a parent provider already resolved comments as enabled, wrapping the document layout
  // in another `CommentsEnabledProvider` is unnecessary; the `DocumentPane` of the structure
  // tool does that. The plugin may render outside the structure tool though, so without one
  // (the context's default is `false`) resolve it here.
  if (parentEnabled) {
    return <CommentsDocumentLayoutInner {...props} />
  }

  return (
    <CommentsEnabledProvider groupId={documentId} documentType={documentType}>
      <CommentsDocumentLayoutInner {...props} />
    </CommentsEnabledProvider>
  )
}

function CommentsDocumentLayoutInner(props: DocumentLayoutProps) {
  const enabled = use(CommentsEnabledContextV2)

  // If comments are not enabled, render the default document layout
  if (!enabled) {
    return props.renderDefault(props)
  }

  return (
    <CommentsSelectedPathProvider>
      <CommentsAuthoringPathProvider>{props.renderDefault(props)}</CommentsAuthoringPathProvider>
    </CommentsSelectedPathProvider>
  )
}
