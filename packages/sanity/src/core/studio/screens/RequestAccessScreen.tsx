/* eslint-disable i18next/no-literal-string,@sanity/i18n/no-attribute-string-literals */
import {Box, Card, Flex, Stack, Text, TextInput, useToast} from '@sanity/ui'
import {addWeeks, isAfter, isBefore} from 'date-fns'
import {useCallback, useEffect, useState} from 'react'
import {
  type CurrentUser,
  getProviderTitle,
  LoadingBlock,
  type SanityClient,
  useActiveWorkspace,
} from 'sanity'

import {Button, Dialog} from '../../../ui-components'
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

  const [hasPendingRequest, setHasPendingRequest] = useState<boolean>(false)
  const [hasExpiredPendingRequest, setExpiredHasPendingRequest] = useState<boolean>(false)
  const [hasTooManyRequests, setHasTooManyRequests] = useState<boolean>(false)
  const [hasBeenDenied, setHasBeenDenied] = useState<boolean>(false)

  const [note, setNote] = useState<string | undefined>()

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
          const projectRequests = requests.filter((request) => request.resourceId === projectId)
          const declinedRequest = projectRequests.find((request) => request.status === 'declined')
          if (declinedRequest) {
            setHasBeenDenied(true)
            return
          }
          const pendingRequest = projectRequests.find(
            (request) =>
              request.status === 'pending' &&
              // Access request is less than 2 weeks old
              isAfter(addWeeks(new Date(request.createdAt), 2), new Date()),
          )
          if (pendingRequest) {
            setHasPendingRequest(true)
            return
          }
          const oldPendingRequest = projectRequests.find(
            (request) =>
              request.status === 'pending' &&
              // Access request is more than 2 weeks old
              isBefore(addWeeks(new Date(request.createdAt), 2), new Date()),
          )
          if (oldPendingRequest) {
            setExpiredHasPendingRequest(true)
          }
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
        body: {note, requestUrl: window?.location.href},
      })
      .then((request) => {
        if (request) setHasPendingRequest(true)
      })
      .catch((err) => {
        const statusCode = err && err.response && err.response.statusCode
        if (statusCode === 429) {
          // User is over their cross-project request limit
          setHasTooManyRequests(true)
        }
        if (statusCode === 409) {
          // If we get a 409, user has been denied on this project or has a valid pending request
          // valid pending request should be handled by GET request above
          setHasBeenDenied(true)
        } else {
          toast.push({
            title: 'There was a problem submitting your request.',
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
      <Dialog id="not-authorized-dialog" header="Not authorized" width={1}>
        <Box>
          <Stack padding={4} space={4}>
            <Text>
              You are not authorized to access this studio (currently signed in as{' '}
              <strong>
                {currentUser?.name} ({currentUser?.email})
              </strong>
              {providerHelp}
              ).
            </Text>
            {hasTooManyRequests || hasPendingRequest || hasBeenDenied ? (
              <Card
                tone={hasPendingRequest ? 'transparent' : 'caution'}
                padding={3}
                radius={2}
                shadow={1}
              >
                <Text size={1}>
                  {hasTooManyRequests && !hasPendingRequest && (
                    <>
                      You've reached the limit for access requests across all projects. Please wait
                      before submitting more requests or contact an admin for assistance.
                    </>
                  )}
                  {hasPendingRequest && (
                    <>Your request to access this project is pending approval.</>
                  )}
                  {hasBeenDenied && <>Your request to access this project has been declined.</>}
                </Text>
              </Card>
            ) : (
              <>
                <Text>
                  {hasExpiredPendingRequest ? (
                    <>
                      Your previous request has expired. You may again request access below with an
                      optional note. The administrator(s) will receive an email letting them know
                      that you are requesting access.
                    </>
                  ) : (
                    <>
                      You can request access below with an optional note. The administrator(s) will
                      receive an email letting them know that you are requesting access.
                    </>
                  )}
                </Text>
                <TextInput
                  maxLength={150}
                  disabled={isSubmitting}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubmitRequest()
                  }}
                  onChange={(e) => setNote(e.currentTarget.value)}
                  value={note}
                  placeholder="Add your note…"
                />
              </>
            )}
          </Stack>
          <Flex align={'center'} justify={'space-between'} paddingY={3} paddingX={4}>
            <Button mode="bleed" text={'Sign out'} tone="default" onClick={handleLogout} />
            {!hasTooManyRequests && (
              <Button
                mode="default"
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
