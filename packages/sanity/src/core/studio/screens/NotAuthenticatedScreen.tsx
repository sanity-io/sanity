/* oxlint-disable i18next/no-literal-string */
import {type CurrentUser} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import {useCallback, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {catchError, map, of} from 'rxjs'

import {Dialog} from '../../../ui-components/dialog/Dialog'
import {getProviderTitle} from '../../store/authStore/providerTitle'
import {useActiveWorkspace} from '../activeWorkspaceMatcher/useActiveWorkspace'

export function NotAuthenticatedScreen() {
  const {activeWorkspace} = useActiveWorkspace()

  const handleLogout = useCallback(() => {
    void activeWorkspace.auth.logout?.()
  }, [activeWorkspace])

  const currentUser$ = useMemo(
    () =>
      activeWorkspace.auth.state.pipe(
        map(({currentUser}): {type: 'value'; user: CurrentUser | null} => ({
          type: 'value',
          user: currentUser,
        })),
        catchError((error: unknown) => of({type: 'error' as const, error})),
      ),
    [activeWorkspace],
  )

  const result = useObservable(currentUser$, {type: 'value' as const, user: null})
  if (result.type === 'error') throw result.error
  const currentUser = result.user

  const providerTitle = getProviderTitle(currentUser?.provider)
  const providerHelp = providerTitle ? ` through ${providerTitle}` : ''

  return (
    <Card height="fill">
      <Dialog
        id="not-authorized-dialog"
        header="Not authorized"
        width={1}
        footer={{
          confirmButton: {
            text: 'Sign out',
            onClick: handleLogout,
            tone: 'default',
          },
        }}
      >
        <Stack space={4}>
          <Text>
            You are not authorized to access this studio. Please contact someone with access to
            invite you to this project.
          </Text>

          <Text>
            If you think this is an error, verify that you are signed in with the correct account.
            You are currently signed in as{' '}
            <strong>
              {currentUser?.name} ({currentUser?.email})
            </strong>
            {providerHelp}.
          </Text>
        </Stack>
      </Dialog>
    </Card>
  )
}
