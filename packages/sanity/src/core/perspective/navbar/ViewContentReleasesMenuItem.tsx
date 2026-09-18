import {CalendarIcon} from '@sanity/icons/Calendar'
import {useTelemetry} from '@sanity/telemetry/react'
import {type ComponentType, useCallback} from 'react'
import {useIntentLink} from 'sanity/router'

import {MenuItem} from '../../../ui-components/menuItem/MenuItem'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {NavigatedToReleasesOverview} from '../../releases/__telemetry__/navigation.telemetry'
import {RELEASES_INTENT} from '../../releases/plugin'

export const ViewContentReleasesMenuItem: ComponentType = () => {
  const {t} = useTranslation()
  const telemetry = useTelemetry()

  const logNavigationTelemetry = useCallback(() => {
    telemetry.log(NavigatedToReleasesOverview, {source: 'menu'})
  }, [telemetry])

  const {href, onClick} = useIntentLink({
    intent: RELEASES_INTENT,
    params: {source: 'menu'},
    onClick: logNavigationTelemetry,
  })

  // 12px, aligning ink rather than boxes — same value and reason as `ScheduledDraftsMenuItem`,
  // which carries the measurements: a small release avatar's dot sits ~9px inside its 25px svg
  // while these @sanity/icons glyphs nearly fill theirs, so equal boxes left the action ink 3.4px
  // left of the dots'. The design aligns the action icons with the rest of the column (PopoverMenu
  // node 7576:27957).
  return (
    <MenuItem
      paddingLeft={3}
      as="a"
      href={href}
      onClick={onClick}
      icon={CalendarIcon}
      text={t('release.menu.view-releases')}
      data-testid="view-content-releases-menu-item"
    />
  )
}
