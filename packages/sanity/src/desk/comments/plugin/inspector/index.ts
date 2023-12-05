import {CommentIcon} from '@sanity/icons'
import {COMMENTS_INSPECTOR_NAME} from '../../../panes/document/constants'
import {useResolveCommentsEnabled} from '../../src'
import {CommentsInspector} from './CommentsInspector'
import {
  DocumentInspectorMenuItem,
  DocumentInspectorUseMenuItemProps,
  defineDocumentInspector,
} from 'sanity'

function useMenuItem(props: DocumentInspectorUseMenuItemProps): DocumentInspectorMenuItem {
  const {documentId, documentType} = props
  const isEnabled = useResolveCommentsEnabled(documentId, documentType)

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
