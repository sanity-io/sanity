/* oxlint-disable i18next/no-literal-string */
import {Card, Stack, Text} from '@sanity/ui'
import {useCallback} from 'react'

import {Dialog} from '../../../ui-components/dialog/Dialog'
import {getProviderTitle} from '../../store/authStore/providerTitle'
import {useDeferredObservableValue} from '../../util/useDeferredObservableValue'
import {useActiveWorkspace} from '../activeWorkspaceMatcher/useActiveWorkspace'

export function NotAuthenticatedScreen() {
  const {activeWorkspace} = useActiveWorkspace()

  const handleLogout = useCallback(() => {
    void activeWorkspace.auth.logout?.()
  }, [activeWorkspace])

  const currentUser = useDeferredObservableValue(activeWorkspace.auth.state, null)?.currentUser

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
        <Stack gap={4}>
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
