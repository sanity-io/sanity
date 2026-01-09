import {CalendarIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {type ComponentType, useCallback} from 'react'
import {useRouter} from 'sanity/router'

import {MenuItem} from '../../../ui-components/menuItem/MenuItem'
import {useTranslation} from '../../i18n'
import {NavigatedToReleasesOverview} from '../../releases/__telemetry__/navigation.telemetry'
import {SCHEDULES_TOOL_NAME} from '../../schedules/plugin'

export const ViewContentReleasesMenuItem: ComponentType = () => {
  const router = useRouter()
  const {t} = useTranslation()
  const telemetry = useTelemetry()

  const releasesUrl = router.resolvePathFromState({
    tool: SCHEDULES_TOOL_NAME,
  })

  const handleClick = useCallback(() => {
    telemetry.log(NavigatedToReleasesOverview, {source: 'menu'})
  }, [telemetry])

  return (
    <MenuItem
      as="a"
      href={releasesUrl}
      onClick={handleClick}
      icon={CalendarIcon}
      text={t('release.menu.view-releases')}
      data-testid="view-content-releases-menu-item"
    />
  )
}
