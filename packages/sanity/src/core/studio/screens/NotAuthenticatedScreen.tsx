import i18n from 'i18next'
import k from './../../../i18n/keys'
import {CurrentUser} from '@sanity/types'
import {Button, Card, Dialog, Stack, Text} from '@sanity/ui'
import React, {useCallback, useEffect, useState} from 'react'
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
        footer={
          <Stack paddingX={3} paddingY={2}>
            <Button text="Sign out" onClick={handleLogout} />
          </Stack>
        }
      >
        <Stack paddingX={4} paddingY={5} space={4}>
          <Text>{i18n.t(k.YOU_ARE_NOT_AUTHORIZED_TO_ACCE)}</Text>

          <Text>
            {i18n.t(k.IF_YOU_THINK_THIS_IS_AN_ERROR)}{' '}
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
