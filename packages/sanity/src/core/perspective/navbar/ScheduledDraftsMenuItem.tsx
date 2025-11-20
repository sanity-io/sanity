import {CalendarIcon} from '@sanity/icons'
import {type ComponentType} from 'react'
import {useRouter} from 'sanity/router'

import {MenuItem} from '../../../ui-components/menuItem/MenuItem'
import {useTranslation} from '../../i18n'
import {useScheduledDraftsEnabled} from '../../singleDocRelease/hooks/useScheduledDraftsEnabled'
import {RELEASES_SCHEDULED_DRAFTS_INTENT} from '../../singleDocRelease/plugin'

export const ScheduledDraftsMenuItem: ComponentType = () => {
  const router = useRouter()
  const {t} = useTranslation()
  const isScheduledDraftsEnabled = useScheduledDraftsEnabled()

  if (!isScheduledDraftsEnabled) return null

  const scheduledDraftsUrl = router.resolveIntentLink(RELEASES_SCHEDULED_DRAFTS_INTENT, {
    view: 'drafts',
  })

  return (
    <MenuItem
      as="a"
      href={scheduledDraftsUrl}
      icon={CalendarIcon}
      text={t('release.menu.scheduled-drafts')}
      data-testid="scheduled-drafts-menu-item"
    />
  )
}
