import {CalendarIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {type ComponentType, useCallback} from 'react'
import {useIntentLink} from 'sanity/router'

import {MenuItem} from '../../../ui-components/menuItem/MenuItem'
import {FEATURES, useFeatureEnabled} from '../../hooks/useFeatureEnabled'
import {useTranslation} from '../../i18n'
import {NavigatedToScheduledDrafts} from '../../releases/__telemetry__/navigation.telemetry'
import {useScheduledDraftsEnabled} from '../../singleDocRelease/hooks/useScheduledDraftsEnabled'
import {RELEASES_SCHEDULED_DRAFTS_INTENT} from '../../singleDocRelease/plugin'
import {useWorkspace} from '../../studio/workspace'

export const ScheduledDraftsMenuItem: ComponentType = () => {
  const {t} = useTranslation()
  const telemetry = useTelemetry()
  const isScheduledDraftsEnabled = useScheduledDraftsEnabled()
  const {enabled: isSingleDocReleaseEnabled} = useFeatureEnabled(FEATURES.singleDocRelease)
  const {
    document: {
      drafts: {enabled: isDraftModelEnabled},
    },
  } = useWorkspace()

  const logNavigationTelemetry = useCallback(() => {
    telemetry.log(NavigatedToScheduledDrafts, {source: 'menu'})
  }, [telemetry])

  const {href, onClick} = useIntentLink({
    intent: RELEASES_SCHEDULED_DRAFTS_INTENT,
    params: {view: 'drafts'},
    onClick: logNavigationTelemetry,
  })

  if (!isScheduledDraftsEnabled || !isSingleDocReleaseEnabled || !isDraftModelEnabled) return null

  return (
    <MenuItem
      as="a"
      href={href}
      onClick={onClick}
      icon={CalendarIcon}
      text={t('release.menu.scheduled-drafts')}
      data-testid="scheduled-drafts-menu-item"
    />
  )
}
