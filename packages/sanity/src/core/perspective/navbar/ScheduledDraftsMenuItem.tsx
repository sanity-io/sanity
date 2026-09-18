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

  // 12px, aligning ink rather than boxes. `ReleaseAvatarIcon size="small"` draws a 7px dot centred
  // in a 25px svg, so the row icons' ink starts ~9px inside their box; the @sanity/icons glyphs
  // here nearly fill theirs. Matching the boxes (both at 12px from the panel edge) therefore left
  // the action ink 3.4px short of the dots'. Measured in the release-menu story: with this value
  // the calendar ink lands at 14.6px from the panel edge against the Published dot's 14.0px and
  // the Drafts ring's 14.6px. The design aligns the action icons with the rest of the column
  // (PopoverMenu node 7576:27957).
  return (
    <MenuItem
      paddingLeft={3}
      as="a"
      href={href}
      onClick={onClick}
      icon={CalendarIcon}
      text={t('release.menu.scheduled-drafts')}
      data-testid="scheduled-drafts-menu-item"
    />
  )
}
