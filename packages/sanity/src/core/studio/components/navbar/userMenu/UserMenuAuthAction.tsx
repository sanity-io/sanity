import {LaunchIcon} from '@sanity/icons/Launch'
import {LeaveIcon} from '@sanity/icons/Leave'
import {Card, Stack} from '@sanity/ui'
import {MenuDivider} from '@sanity/ui/menu'

import {Button} from '../../../../../ui-components/button/Button'
import {MenuItem} from '../../../../../ui-components/menuItem/MenuItem'
import {isDev} from '../../../../environment'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {useUnclaimedProjectContext} from '../../../unclaimedProject/UnclaimedProjectProvider'
import {useUnclaimedProjectClock} from '../../../unclaimedProject/useUnclaimedProjectClock'
import {useWorkspace} from '../../../workspace'

interface UserMenuAuthActionProps {
  layout: 'drawer' | 'menu'
}

/** @internal */
export function UserMenuAuthAction({layout}: UserMenuAuthActionProps) {
  if (isDev) return <DevUserMenuAuthAction layout={layout} />

  return <UserMenuAuthActionInner layout={layout} />
}

function DevUserMenuAuthAction({layout}: UserMenuAuthActionProps) {
  const {onClaim, state} = useUnclaimedProjectContext()
  const unclaimed = state?.status === 'unclaimed' ? state : undefined
  const now = useUnclaimedProjectClock(Boolean(unclaimed), unclaimed?.expiresAt)
  const claimUrl = unclaimed && unclaimed.expiresAt.getTime() > now ? unclaimed.claimUrl : undefined

  return <UserMenuAuthActionInner claimUrl={claimUrl} layout={layout} onClaim={onClaim} />
}

function UserMenuAuthActionInner({
  claimUrl,
  layout,
  onClaim,
}: UserMenuAuthActionProps & {claimUrl?: string; onClaim?: () => void}) {
  const {auth} = useWorkspace()
  const {t} = useTranslation()

  if (!claimUrl && !auth.logout) return null

  const text = claimUrl ? t('user-menu.action.claim-project') : t('user-menu.action.sign-out')
  const icon = claimUrl ? LaunchIcon : LeaveIcon
  const actionProps = claimUrl
    ? {
        as: 'a' as const,
        href: claimUrl,
        onClick: onClaim,
        rel: 'noopener noreferrer',
        target: '_blank',
      }
    : {onClick: auth.logout}

  if (layout === 'drawer') {
    return (
      <Card flex="none" padding={2} borderTop>
        <Stack>
          <Button
            iconRight={icon}
            justify="flex-start"
            mode="bleed"
            size="large"
            text={text}
            {...actionProps}
          />
        </Stack>
      </Card>
    )
  }

  return (
    <>
      <MenuDivider />
      <MenuItem iconRight={icon} text={text} {...actionProps} />
    </>
  )
}
