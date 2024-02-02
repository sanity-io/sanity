import {CommentIcon} from '@sanity/icons'
import {COMMENTS_INSPECTOR_NAME} from '../../../panes/document/constants'
import {commentsLocaleNamespace} from '../../i18n'
import {useCommentsEnabled} from '../../src'
import {CommentsInspector} from './CommentsInspector'
import {DocumentInspectorMenuItem, defineDocumentInspector, useTranslation} from 'sanity'

function useMenuItem(): DocumentInspectorMenuItem {
  const isEnabled = useCommentsEnabled()
  const {t} = useTranslation(commentsLocaleNamespace)

  return {
    hidden: !isEnabled,
    icon: CommentIcon,
    showAsAction: true,
    title: t('document-inspector-title'),
  }
}

export const commentsInspector = defineDocumentInspector({
  name: COMMENTS_INSPECTOR_NAME,
  component: CommentsInspector,
  useMenuItem,
})
