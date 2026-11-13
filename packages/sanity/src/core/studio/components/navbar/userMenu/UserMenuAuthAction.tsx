import {LaunchIcon} from '@sanity/icons/Launch'
import {LeaveIcon} from '@sanity/icons/Leave'
import {Card} from '@sanity/ui'
import {MenuDivider} from '@sanity/ui/menu'
import {useCallback, useMemo} from 'react'
import {VStack} from 'ui5'

import {Button} from '../../../../../ui-components/button/Button'
import {MenuItem} from '../../../../../ui-components/menuItem/MenuItem'
import {isDev} from '../../../../environment'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {isDashboardAuthStore} from '../../../../store/auth/legacy/createLegacyAuthStore'
import {type AuthStore} from '../../../../store/auth/types'
import {useUnclaimedProjectContext} from '../../../unclaimedProject/UnclaimedProjectProvider'
import {useUnclaimedProjectClock} from '../../../unclaimedProject/useUnclaimedProjectClock'
import {useWorkspace} from '../../../workspace'
import {useWorkspaces} from '../../../workspaces/useWorkspaces'

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
  const signOut = useSignOutOfAllWorkspaces()
  const {t} = useTranslation()

  if (!claimUrl && !signOut) return null

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
    : {onClick: signOut}

  if (layout === 'drawer') {
    return (
      <Card flex="none" padding={2} borderTop>
        <VStack>
          <Button
            iconRight={icon}
            justify="flex-start"
            mode="bleed"
            size="large"
            text={text}
            {...actionProps}
          />
        </VStack>
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

/**
 * Returns a function that signs out of every workspace in the Studio, hidden ones included, or
 * `undefined` when the active workspace cannot be signed out of.
 *
 * Several workspaces can share one auth store (stores are memoized per config), so each store is
 * signed out once. A store's `logout` clears its own credentials, tells other tabs and revokes
 * them on the server, so this only has to call each one.
 *
 * Stores of a Studio hosted in the dashboard are skipped: the dashboard owns sign-in, and their
 * `logout` only asks the dashboard for a new token, which signs no one out.
 */
function useSignOutOfAllWorkspaces(): (() => void) | undefined {
  const {auth: activeStore} = useWorkspace()
  const workspaces = useWorkspaces()
  const otherStores = useMemo(
    () =>
      getSignOutStores(workspaces.map(({auth}) => auth)).filter((store) => store !== activeStore),
    [activeStore, workspaces],
  )

  const signOut = useCallback(async () => {
    if (!canSignOut(activeStore)) return
    // The active store goes last: once it signs out the Studio shows the login screen, and a
    // custom store may navigate away, which would cut the other stores' requests short.
    const results = await Promise.allSettled(otherStores.map(callLogout))
    results.push(...(await Promise.allSettled([callLogout(activeStore)])))
    for (const result of results) {
      if (result.status === 'rejected') console.warn('[sanity] Sign out failed:', result.reason)
    }
  }, [activeStore, otherStores])

  // Only offer sign out when it signs the user out of the workspace they are looking at.
  if (!canSignOut(activeStore)) return undefined
  return () => void signOut()
}

type SignOutStore = AuthStore & Required<Pick<AuthStore, 'logout'>>

function getSignOutStores(stores: AuthStore[]): SignOutStore[] {
  return [...new Set(stores.filter(canSignOut))]
}

function canSignOut(store: AuthStore): store is SignOutStore {
  return typeof store.logout === 'function' && !isDashboardAuthStore(store)
}

/**
 * Calls `logout` without arguments: it takes options, and a click event is not one of them. Being
 * `async`, it turns a custom store's synchronous throw into a rejection, so one failing store does
 * not keep the others signed in.
 */
async function callLogout(store: SignOutStore): Promise<void> {
  await store.logout()
}
