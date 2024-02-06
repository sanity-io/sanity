import {CommentIcon} from '@sanity/icons'
import {COMMENTS_INSPECTOR_NAME} from '../../../panes/document/constants'
import {commentsLocaleNamespace} from '../../i18n'
import {useCommentsEnabled} from '../../src'
import {CommentsInspector} from './CommentsInspector'
import {DocumentInspectorMenuItem, defineDocumentInspector, useTranslation} from 'sanity'

function useMenuItem(): DocumentInspectorMenuItem {
  const {t} = useTranslation(commentsLocaleNamespace)
  const {enabled} = useCommentsEnabled()

  return {
    hidden: !enabled,
    icon: CommentIcon,
    showAsAction: true,
    title: t('feature-name'),
  }
}

export const commentsInspector = defineDocumentInspector({
  name: COMMENTS_INSPECTOR_NAME,
  component: CommentsInspector,
  useMenuItem,
})
