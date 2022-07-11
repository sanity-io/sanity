import {CurrentUser} from '@sanity/types'
import {Button, Card, Dialog, Stack, Text} from '@sanity/ui'
import React, {useCallback, useEffect, useState} from 'react'
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
    activeWorkspace.auth.handleCallbackUrl?.().catch(handleError)
  }, [activeWorkspace.auth])

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

  return (
    <Card height="fill">
      <Dialog
        id="not-authorized-dialog"
        header="Not authorized"
        width={1}
        footer={
          <Stack paddingX={3} paddingY={2}>
            <Button text="Sign out" onClick={handleLogout} />
          </Stack>
        }
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
            .
          </Text>
        </Stack>
      </Dialog>
    </Card>
  )
}
