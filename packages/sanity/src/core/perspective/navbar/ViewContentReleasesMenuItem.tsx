import {CalendarIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {
  type ComponentProps,
  type ComponentType,
  type ForwardedRef,
  forwardRef,
  useCallback,
  useMemo,
} from 'react'
import {IntentLink, useRouter} from 'sanity/router'
import {styled} from 'styled-components'

import {MenuItem} from '../../../ui-components/menuItem/MenuItem'
import {useTranslation} from '../../i18n'
import {NavigatedToReleasesOverview} from '../../releases/__telemetry__/navigation.telemetry'
import {RELEASES_INTENT} from '../../releases/plugin'
import {SCHEDULES_TOOL_NAME} from '../../schedules/plugin'

const StyledLinkComponent = styled(IntentLink)`
  text-decoration: none;
`
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

  const LinkComponent = useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-shadow
      forwardRef(function LinkComponent(
        restProps: ComponentProps<typeof IntentLink>,
        ref: ForwardedRef<HTMLAnchorElement>,
      ) {
        return (
          <StyledLinkComponent
            {...restProps}
            intent={RELEASES_INTENT}
            params={{source: 'menu'}}
            ref={ref}
          />
        )
      }),
    [],
  )

  return (
    <MenuItem
      as={LinkComponent}
      href={releasesUrl}
      onClick={handleClick}
      icon={CalendarIcon}
      text={t('release.menu.view-releases')}
      data-testid="view-content-releases-menu-item"
    />
  )
}
