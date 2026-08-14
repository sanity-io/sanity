import {LaunchIcon} from '@sanity/icons/Launch'
import {LeaveIcon} from '@sanity/icons/Leave'
import {Card, Stack} from '@sanity/ui'
import {MenuDivider} from '@sanity/ui/menu'
import {useCallback, useState} from 'react'

import {Button} from '../../../../../ui-components/button/Button'
import {MenuItem} from '../../../../../ui-components/menuItem/MenuItem'
import {isDev} from '../../../../environment'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {useUnclaimedProject} from '../../../unclaimedProject/useUnclaimedProject'
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
  const {projectId} = useWorkspace()
  const [claimAttempt, setClaimAttempt] = useState<{projectId: string; startedAt: number}>()
  const claimAttemptedAt =
    claimAttempt && claimAttempt.projectId === projectId ? claimAttempt.startedAt : undefined
  const state = useUnclaimedProject({claimAttemptedAt})
  const claimUrl = state?.status === 'unclaimed' ? state.claimUrl : undefined
  const handleClaim = useCallback(
    () => setClaimAttempt({projectId, startedAt: Date.now()}),
    [projectId],
  )

  return <UserMenuAuthActionInner claimUrl={claimUrl} layout={layout} onClaim={handleClaim} />
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
