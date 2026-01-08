import {CalendarIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {type ComponentType, useCallback} from 'react'
import {useRouter} from 'sanity/router'

import {MenuItem} from '../../../ui-components/menuItem/MenuItem'
import {FEATURES, useFeatureEnabled} from '../../hooks/useFeatureEnabled'
import {useTranslation} from '../../i18n'
import {NavigatedToScheduledDrafts} from '../../releases/__telemetry__/navigation.telemetry'
import {useScheduledDraftsEnabled} from '../../singleDocRelease/hooks/useScheduledDraftsEnabled'
import {RELEASES_SCHEDULED_DRAFTS_INTENT} from '../../singleDocRelease/plugin'
import {useWorkspace} from '../../studio/workspace'

export const ScheduledDraftsMenuItem: ComponentType = () => {
  const router = useRouter()
  const {t} = useTranslation()
  const telemetry = useTelemetry()
  const isScheduledDraftsEnabled = useScheduledDraftsEnabled()
  const {enabled: isSingleDocReleaseEnabled} = useFeatureEnabled(FEATURES.singleDocRelease)
  const {
    document: {
      drafts: {enabled: isDraftModelEnabled},
    },
  } = useWorkspace()

  const scheduledDraftsUrl = router.resolveIntentLink(RELEASES_SCHEDULED_DRAFTS_INTENT, {
    view: 'drafts',
  })

  const handleClick = useCallback(() => {
    telemetry.log(NavigatedToScheduledDrafts, {source: 'menu'})
  }, [telemetry])

  if (!isScheduledDraftsEnabled || !isSingleDocReleaseEnabled || !isDraftModelEnabled) return null

  return (
    <MenuItem
      as="a"
      href={scheduledDraftsUrl}
      onClick={handleClick}
      icon={CalendarIcon}
      text={t('release.menu.scheduled-drafts')}
      data-testid="scheduled-drafts-menu-item"
    />
  )
}
