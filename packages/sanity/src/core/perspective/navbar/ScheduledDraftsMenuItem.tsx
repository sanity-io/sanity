import {CalendarIcon} from '@sanity/icons/Calendar'
import {useTelemetry} from '@sanity/telemetry/react'
import {type ComponentType, useCallback} from 'react'
import {useIntentLink} from 'sanity/router'

import {MenuItem} from '../../../ui-components/menuItem/MenuItem'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {NavigatedToScheduledDrafts} from '../../releases/__telemetry__/navigation.telemetry'
import {RELEASES_SCHEDULED_DRAFTS_INTENT} from '../../singleDocRelease/plugin'
import {useScheduledDraftsAvailable} from './useScheduledDraftsAvailable'

export const ScheduledDraftsMenuItem: ComponentType = () => {
  const {t} = useTranslation()
  const telemetry = useTelemetry()
  const isAvailable = useScheduledDraftsAvailable()

  const logNavigationTelemetry = useCallback(() => {
    telemetry.log(NavigatedToScheduledDrafts, {source: 'menu'})
  }, [telemetry])

  const {href, onClick} = useIntentLink({
    intent: RELEASES_SCHEDULED_DRAFTS_INTENT,
    params: {view: 'drafts'},
    onClick: logNavigationTelemetry,
  })

  if (!isAvailable) return null

  // 8px against the wrapper's hardcoded 12px: this puts the icon 12px from the panel edge (4px
  // from the action card, 8px from here), where every release row's icon and every section heading
  // already sits. The design aligns the action icons with the rest of the column (PopoverMenu node
  // 7576:27957).
  return (
    <MenuItem
      paddingLeft={2}
      as="a"
      href={href}
      onClick={onClick}
      icon={CalendarIcon}
      text={t('release.menu.scheduled-drafts')}
      data-testid="scheduled-drafts-menu-item"
    />
  )
}
