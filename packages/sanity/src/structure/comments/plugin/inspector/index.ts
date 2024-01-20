import {CommentIcon} from '@sanity/icons'
import {defineDocumentInspector, type DocumentInspectorMenuItem, useTranslation} from 'sanity'

import {COMMENTS_INSPECTOR_NAME} from '../../../panes/document/constants'
import {commentsLocaleNamespace} from '../../i18n'
import {useCommentsEnabled} from '../../src'
import {CommentsInspector} from './CommentsInspector'

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
