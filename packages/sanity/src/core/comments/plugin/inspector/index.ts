import {CommentIcon} from '@sanity/icons'

import {
  defineDocumentInspector,
  type DocumentInspectorMenuItem,
} from '../../../config/document/inspector'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useCommentsEnabled} from '../..'
import {COMMENTS_INSPECTOR_NAME} from '../../constants'
import {commentsLocaleNamespace} from '../../i18n'
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
