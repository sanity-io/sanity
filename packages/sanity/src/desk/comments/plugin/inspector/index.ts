import {CommentIcon} from '@sanity/icons'
import {COMMENTS_INSPECTOR_NAME} from '../../../panes/document/constants'
import {useCommentsEnabled} from '../../src'
import {CommentsInspector} from './CommentsInspector'
import {DocumentInspectorMenuItem, defineDocumentInspector} from 'sanity'

function useMenuItem(): DocumentInspectorMenuItem {
  const isEnabled = useCommentsEnabled()

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
