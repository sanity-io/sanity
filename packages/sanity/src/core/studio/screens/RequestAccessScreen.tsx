/* eslint-disable i18next/no-literal-string,@sanity/i18n/no-attribute-string-literals */
import {Box, Button, Card, Dialog, Flex, Stack, Text, TextInput, useToast} from '@sanity/ui'
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
  const [client, setClient] = useState<SanityClient | undefined>()
  const [projectId, setProjectId] = useState<string | undefined>()
  const toast = useToast()

  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [hasPendingRequest, setHasPendingRequest] = useState<boolean | undefined>()
  const [hasTooManyRequests, setHasTooManyRequests] = useState<boolean | undefined>()

  const [note, setNote] = useState<string>('')

  const {activeWorkspace} = useActiveWorkspace()

  const handleLogout = useCallback(() => {
    activeWorkspace.auth.logout?.()
  }, [activeWorkspace])

  // Get config info from active workspace
  useEffect(() => {
    const subscription = activeWorkspace.auth.state.subscribe({
      next: ({client: sanityClient, currentUser: user}) => {
        // Need to get the client, projectId, and user from workspace
        // because this screen is outside the SourceContext
        setProjectId(sanityClient.config().projectId)
        setClient(sanityClient.withConfig({apiVersion: '2024-07-01'}))
        setCurrentUser(user)
      },
      error: setError,
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [activeWorkspace])

  // Check if user has a pending
  // access request for this project
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
              new Date(request.createdAt).getTime() > Date.now() - 2 * 1000 * 60 * 60 * 24 * 7,
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

  const handleSubmitRequest = useCallback(() => {
    // If we haven't loaded the client or projectId from
    // current worspace, return early
    if (!client || !projectId) return

    setIsSubmitting(true)

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
          toast.push({
            title: 'There was a problem submitting your request. Please try again later.',
            status: 'error',
          })
        }
      })
      .finally(() => {
        setIsSubmitting(false)
      })
  }, [note, projectId, client, toast])

  const providerTitle = getProviderTitle(currentUser?.provider)
  const providerHelp = providerTitle ? ` through ${providerTitle}` : ''

  if (loading) return <LoadingBlock />
  // Fallback to the old not authorized screen
  // if error communicating with Access API
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
              <Card
                tone={hasPendingRequest ? 'transparent' : 'caution'}
                padding={3}
                radius={2}
                shadow={1}
              >
                <Text size={1} muted>
                  {hasTooManyRequests && !hasPendingRequest && (
                    <>
                      You've reached the limit for access requests across all projects. Please wait
                      before submitting more requests or contact an admin for assistance.
                    </>
                  )}
                  {hasPendingRequest && (
                    <>Your request to access this project is pending approval.</>
                  )}
                </Text>
              </Card>
            ) : (
              <>
                <Text>
                  You can request access to collaborate on this project. If you'd like, you can
                  include a note.
                </Text>
                <TextInput
                  disabled={isSubmitting}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubmitRequest()
                  }}
                  onChange={(e) => setNote(e.currentTarget.value)}
                  value={note}
                />
              </>
            )}
          </Stack>
          <Flex align={'center'} justify={'space-between'} paddingY={3} paddingX={4}>
            <Button
              mode="bleed"
              padding={3}
              text={'Sign out'}
              tone="default"
              onClick={handleLogout}
            />
            {!hasTooManyRequests && (
              <Button
                mode="default"
                padding={3}
                text={hasPendingRequest ? 'Request sent' : 'Request access'}
                disabled={hasPendingRequest || isSubmitting}
                loading={isSubmitting}
                tone="default"
                onClick={handleSubmitRequest}
              />
            )}
          </Flex>
        </Box>
      </Dialog>
    </Card>
  )
}
