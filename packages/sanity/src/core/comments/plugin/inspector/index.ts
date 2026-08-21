import {CommentIcon} from '@sanity/icons/Comment'
import {lazy} from 'react'

import {
  defineDocumentInspector,
  type DocumentInspectorMenuItem,
} from '../../../config/document/inspector'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {COMMENTS_INSPECTOR_NAME} from '../../constants'
import {useCommentsEnabled} from '../../hooks/useCommentsEnabled'
import {commentsLocaleNamespace} from '../../i18n'

const CommentsInspector = lazy(() => import('./CommentsInspector.lazy'))

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
