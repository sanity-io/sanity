import {UnpublishIcon} from '@sanity/icons'
import {useCallback} from 'react'

import {
  type DocumentActionComponent,
  type DocumentActionDescription,
  type DocumentActionProps,
} from '../../../config/document/actions'
import {useTranslation} from '../../../i18n'
import {releasesLocaleNamespace} from '../../i18n'

/**
 * @internal
 */
export const ScheduleUnpublishAction: DocumentActionComponent = (
  props: DocumentActionProps,
): DocumentActionDescription | null => {
  const {id, published} = props
  const {t} = useTranslation(releasesLocaleNamespace)
  const isPublished = published !== null

  const handleScheduleUnpublish = useCallback(() => {
    console.warn('Schedule unpublish action triggered for document ID:', id)
  }, [id])

  return {
    disabled: !isPublished,
    tone: 'critical',
    icon: UnpublishIcon,
    label: t('action.schedule-unpublish'),
    title: isPublished ? undefined : t('action.schedule-unpublish.disabled.not-published'),
    onHandle: handleScheduleUnpublish,
  }
}

ScheduleUnpublishAction.action = 'schedule'
ScheduleUnpublishAction.displayName = 'ScheduleUnpublishAction'
