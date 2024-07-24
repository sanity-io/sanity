/* eslint-disable i18next/no-literal-string,@sanity/i18n/no-attribute-string-literals */
import {Box, Button, Card, Dialog, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'
import {
  type CurrentUser,
  getProviderTitle,
  LoadingBlock,
  type SanityClient,
  useActiveWorkspace,
} from 'sanity'

import {NotAuthenticatedScreen} from './NotAuthenticatedScreen'

interface AccessRequest {
  id: string
  status: 'pending' | 'accepted' | 'declined'
  resourceId: string
  resourceType: 'project'
  createdAt: string
  updatedAt: string
  updatedByUserId: string
  requestedByUserId: string
  note: string
}

export function RequestAccessScreen() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [error, setError] = useState<unknown>(null)

  const [projectId, setProjectId] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [hasPendingRequest, setHasPendingRequest] = useState<boolean | undefined>()
  const [hasTooManyRequests, setHasTooManyRequests] = useState<boolean | undefined>()
  const [client, setClient] = useState<SanityClient | undefined>()
  const [note, setNote] = useState<string>('')

  const {activeWorkspace} = useActiveWorkspace()

  const handleLogout = useCallback(() => {
    activeWorkspace.auth.logout?.()
  }, [activeWorkspace])

  const handleSubmitRequest = useCallback(() => {
    if (!client || !projectId) return
    client
      .request<AccessRequest | null>({
        url: `/access/project/${projectId}/requests`,
        method: 'post',
        body: {note},
      })
      .then((request) => {
        if (request) setHasPendingRequest(true)
      })
      .catch((err) => {
        const statusCode = err && err.response && err.response.statusCode
        // If we get a 403, that means the user
        // is over their cross-project request limit
        if (statusCode === 403) {
          setHasTooManyRequests(true)
        } else {
          setError(true)
        }
      })
      .finally(() => {
        setLoading(false)
      })
  }, [note, projectId, client])

  // Get the active workspace client
  useEffect(() => {
    const subscription = activeWorkspace.auth.state.subscribe({
      next: ({client: sanityClient}) => {
        setProjectId(sanityClient.config().projectId)
        setClient(sanityClient)
      },
      error: setError,
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [activeWorkspace])

  // Check if user currently has a pending access request
  // for this project
  useEffect(() => {
    if (!client || !projectId) return
    client
      .request<AccessRequest[] | null>({
        url: `/access/requests/me`,
      })
      .then((requests) => {
        if (requests && requests?.length) {
          const pendingRequests = requests.filter(
            (request) =>
              // Access request is for this project
              request.resourceId === projectId &&
              // Access request is still pending
              request.status === 'pending' &&
              // Access request is less than 2 weeks old
              new Date(request.createdAt).getTime() < Date.now() - 2 * 1000 * 60 * 60 * 24 * 7,
          )
          if (pendingRequests.length) setHasPendingRequest(true)
        }
      })
      .catch((err) => {
        console.error(err)
        setError(true)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [client, projectId])

  useEffect(() => {
    const subscription = activeWorkspace.auth.state.subscribe({
      next: ({currentUser: user}) => {
        setCurrentUser(user)
      },
      error: setError,
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [activeWorkspace])

  const providerTitle = getProviderTitle(currentUser?.provider)
  const providerHelp = providerTitle ? ` through ${providerTitle}` : ''

  if (loading) return <LoadingBlock />
  if (error) return <NotAuthenticatedScreen />
  return (
    <Card height="fill">
      <Dialog id="not-authorized-dialog" header="Not authorized" width={1} animate>
        <Box>
          <Stack padding={4} space={4}>
            <Text>
              You are not authorized to access this studio. You are currently signed in as{' '}
              <strong>
                {currentUser?.name} ({currentUser?.email})
              </strong>
              {providerHelp}.
            </Text>
            {hasTooManyRequests || hasPendingRequest ? (
              <Card tone={hasPendingRequest ? 'primary' : 'caution'} padding={3} border>
                <Text size={1}>
                  {hasTooManyRequests && !hasPendingRequest && (
                    <>
                      You've reached the limit for access requests across all projects. Please wait
                      before submitting more requests or contact an admin for assistance.
                    </>
                  )}
                  {hasPendingRequest && (
                    <>
                      Your request to access this project is pending. We'll send you an email when
                      your request has been approved.
                    </>
                  )}
                </Text>
              </Card>
            ) : (
              <>
                <Text>
                  You can request access to collaborate on this project. If you'd like, you can
                  include a note.
                </Text>
                <TextInput onChange={(e) => setNote(e.currentTarget.value)} value={note} />
              </>
            )}
          </Stack>
          <Flex align={'center'} justify={'space-between'} padding={3}>
            <Button
              mode="bleed"
              padding={2}
              text={'Sign out'}
              tone="default"
              onClick={handleLogout}
            />
            <Button
              mode="default"
              padding={3}
              text={'Request access'}
              disabled={hasTooManyRequests || hasPendingRequest}
              tone="default"
              onClick={handleSubmitRequest}
            />
          </Flex>
        </Box>
      </Dialog>
    </Card>
  )
}
