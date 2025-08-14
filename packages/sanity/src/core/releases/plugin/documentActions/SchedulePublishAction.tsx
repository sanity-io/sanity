import {CalendarIcon} from '@sanity/icons'
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
export const SchedulePublishAction: DocumentActionComponent = (
  props: DocumentActionProps,
): DocumentActionDescription | null => {
  const {id} = props
  const {t} = useTranslation(releasesLocaleNamespace)

  const handleSchedulePublish = useCallback(() => {
    console.log('Schedule publish action triggered for document ID:', id)
  }, [id])

  return {
    disabled: false,
    icon: CalendarIcon,
    label: t('action.schedule-publish'),
    title: t('action.schedule-publish'),
    onHandle: handleSchedulePublish,
  }
}

SchedulePublishAction.action = 'schedule'
SchedulePublishAction.displayName = 'SchedulePublishAction'
