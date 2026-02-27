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
import {FEATURES, useFeatureEnabled} from '../../hooks/useFeatureEnabled'
import {useTranslation} from '../../i18n'
import {NavigatedToScheduledDrafts} from '../../releases/__telemetry__/navigation.telemetry'
import {useScheduledDraftsEnabled} from '../../singleDocRelease/hooks/useScheduledDraftsEnabled'
import {RELEASES_SCHEDULED_DRAFTS_INTENT} from '../../singleDocRelease/plugin'
import {useWorkspace} from '../../studio/workspace'

const StyledLinkComponent = styled(IntentLink)`
  text-decoration: none;
`

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
            intent={RELEASES_SCHEDULED_DRAFTS_INTENT}
            params={{view: 'drafts'}}
            ref={ref}
          />
        )
      }),
    [],
  )

  if (!isScheduledDraftsEnabled || !isSingleDocReleaseEnabled || !isDraftModelEnabled) return null

  return (
    <MenuItem
      as={LinkComponent}
      href={scheduledDraftsUrl}
      onClick={handleClick}
      icon={CalendarIcon}
      text={t('release.menu.scheduled-drafts')}
      data-testid="scheduled-drafts-menu-item"
    />
  )
}
