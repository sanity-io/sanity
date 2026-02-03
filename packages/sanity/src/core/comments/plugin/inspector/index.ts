import {defineDocumentInspector, type DocumentInspectorMenuItem} from '../../../config'
import {useTranslation} from '../../../i18n'
import {COMMENTS_INSPECTOR_NAME} from '../../constants'
import {useCommentsEnabled} from '../../hooks'
import {commentsLocaleNamespace} from '../../i18n'
import {CommentsInspector} from './CommentsInspector'
import {CommentIcon} from '@sanity/icons'

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
