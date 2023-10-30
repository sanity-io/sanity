import {CurrentUser} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import React, {useCallback, useEffect, useState} from 'react'
import {Dialog} from '../../../ui'
import {getProviderTitle} from '../../store'
import {useActiveWorkspace} from '../activeWorkspaceMatcher'

export function NotAuthenticatedScreen() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [error, handleError] = useState<unknown>(null)

  if (error) throw error

  const {activeWorkspace} = useActiveWorkspace()

  const handleLogout = useCallback(() => {
    activeWorkspace.auth.logout?.()
  }, [activeWorkspace])

  useEffect(() => {
    const subscription = activeWorkspace.auth.state.subscribe({
      next: ({currentUser: user}) => {
        setCurrentUser(user)
      },
      error: handleError,
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [activeWorkspace])

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
        <Stack paddingX={4} paddingY={5} space={4}>
          <Text>
            You are not authorized to access this studio. Maybe you could ask someone to invite you
            to collaborate on this project?
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
