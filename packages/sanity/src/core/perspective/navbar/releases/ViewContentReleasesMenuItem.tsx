import {CalendarIcon} from '@sanity/icons/Calendar'
import {useTelemetry} from '@sanity/telemetry/react'
import {type ComponentType, useCallback} from 'react'
import {useIntentLink} from 'sanity/router'

import {MenuItem} from '../../../../ui-components/menuItem/MenuItem'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {NavigatedToReleasesOverview} from '../../../releases/__telemetry__/navigation.telemetry'
import {RELEASES_INTENT} from '../../../releases/plugin'

export const ViewContentReleasesMenuItem: ComponentType<{
  /** Replaces the default label. The variants beta's menu uses its own copy. */
  text?: string
}> = ({text}) => {
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

  return (
    <MenuItem
      as="a"
      href={href}
      onClick={onClick}
      icon={CalendarIcon}
      text={text ?? t('release.menu.view-releases')}
      data-testid="view-content-releases-menu-item"
    />
  )
}
