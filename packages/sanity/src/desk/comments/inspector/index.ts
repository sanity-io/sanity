import {COMMENTS_INSPECTOR_NAME} from '../../panes/document/constants'
import {CommentIcon} from '../common/CommentIcon'
import {CommentsInspector} from './CommentsInspector'
import {
  DocumentInspectorMenuItem,
  DocumentInspectorUseMenuItemProps,
  defineDocumentInspector,
  useCommentsEnabled,
} from 'sanity'

function useMenuItem(props: DocumentInspectorUseMenuItemProps): DocumentInspectorMenuItem {
  const {documentId, documentType} = props

  const {isEnabled} = useCommentsEnabled({
    documentId,
    documentType,
  })

  return {
    hidden: !isEnabled,
    icon: CommentIcon,
    showAsAction: true,
    title: 'Comments',
  }
}

export const commentsInspector = defineDocumentInspector({
  name: COMMENTS_INSPECTOR_NAME,
  component: CommentsInspector,
  useMenuItem,
})
