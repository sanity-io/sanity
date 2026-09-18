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

  // 11px, aligning ink rather than boxes, and off the 4px scale deliberately.
  //
  // `ReleaseAvatarIcon size="small"` draws a 7px dot centred in a 25px svg, so the status dots' ink
  // starts ~9px inside their box, while the @sanity/icons glyphs here nearly fill theirs. Matching
  // the boxes left the action ink 3.4px short of the dots'. Matching the dots exactly (a 12px
  // inset) then put it 2px right of the bolt and clock row icons, whose wider glyphs sit at 12.6px.
  // No scale step lands between the two, so this is an explicit value: 11px puts the action ink at
  // 13.6px, between the dots' 14.0-14.6px and the release icons' 12.6px, which is where the design
  // review settled it. The design aligns the action icons with the rest of the column (PopoverMenu
  // node 7576:27957).
  return (
    <MenuItem
      style={{paddingLeft: '11px'}}
      as="a"
      href={href}
      onClick={onClick}
      icon={CalendarIcon}
      text={t('release.menu.scheduled-drafts')}
      data-testid="scheduled-drafts-menu-item"
    />
  )
}
