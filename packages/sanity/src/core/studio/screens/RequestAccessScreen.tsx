/* oxlint-disable i18next/no-literal-string,@sanity/i18n/no-attribute-string-literals */
import {type SanityClient} from '@sanity/client'
import {type CurrentUser} from '@sanity/types'
import {Box, Card, Flex, Stack, Text, TextInput, useToast} from '@sanity/ui'
import {addWeeks} from 'date-fns/addWeeks'
import {isAfter} from 'date-fns/isAfter'
import {isBefore} from 'date-fns/isBefore'
import {useCallback, useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {catchError, map, of, startWith} from 'rxjs'

import {Button} from '../../../ui-components/button/Button'
import {Dialog} from '../../../ui-components/dialog/Dialog'
import {LoadingBlock} from '../../components/loadingBlock/LoadingBlock'
import {getProviderTitle} from '../../store/authStore/providerTitle'
import {useActiveWorkspace} from '../activeWorkspaceMatcher/useActiveWorkspace'
import {NotAuthenticatedScreen} from './NotAuthenticatedScreen'

/** @internal */
export interface AccessRequest {
  id: string
  status: 'pending' | 'accepted' | 'declined'
  resourceId: string
  resourceType: 'project'
  createdAt: string
  updatedAt: string
  updatedByUserId: string
  requestedByUserId: string
  requestedRole: string
  type: 'access' | 'role'
  note: string
}

const MAX_NOTE_LENGTH = 150

type AuthStateResult =
  | {
      type: 'value'
      projectId: string | undefined
      client: SanityClient | undefined
      currentUser: CurrentUser | null
    }
  | {type: 'error'; error: unknown}

const INITIAL_AUTH_RESULT: AuthStateResult = {
  type: 'value',
  projectId: undefined,
  client: undefined,
  currentUser: null,
}

type AccessRequestStatus = {
  loading: boolean
  hasBeenDenied: boolean
  hasPendingRequest: boolean
  hasExpiredPendingRequest: boolean
  error?: unknown
}

const INITIAL_ACCESS_REQUEST_STATUS: AccessRequestStatus = {
  loading: true,
  hasBeenDenied: false,
  hasPendingRequest: false,
  hasExpiredPendingRequest: false,
}

function deriveAccessRequestStatus(
  requests: AccessRequest[] | null,
  projectId: string,
): Omit<AccessRequestStatus, 'loading' | 'error'> {
  if (!requests || !requests.length) {
    return {
      hasBeenDenied: false,
      hasPendingRequest: false,
      hasExpiredPendingRequest: false,
    }
  }

  const projectRequests = requests.filter((request) => request.resourceId === projectId)
  const declinedRequest = projectRequests.find((request) => request.status === 'declined')
  if (declinedRequest && isAfter(addWeeks(new Date(declinedRequest.createdAt), 2), new Date())) {
    return {
      hasBeenDenied: true,
      hasPendingRequest: false,
      hasExpiredPendingRequest: false,
    }
  }

  const pendingRequest = projectRequests.find(
    (request) =>
      request.status === 'pending' &&
      // Access request is less than 2 weeks old
      isAfter(addWeeks(new Date(request.createdAt), 2), new Date()),
  )
  if (pendingRequest) {
    return {
      hasBeenDenied: false,
      hasPendingRequest: true,
      hasExpiredPendingRequest: false,
    }
  }

  const oldPendingRequest = projectRequests.find(
    (request) =>
      request.status === 'pending' &&
      // Access request is more than 2 weeks old
      isBefore(addWeeks(new Date(request.createdAt), 2), new Date()),
  )
  if (oldPendingRequest) {
    return {
      hasBeenDenied: false,
      hasPendingRequest: false,
      hasExpiredPendingRequest: true,
    }
  }

  return {
    hasBeenDenied: false,
    hasPendingRequest: false,
    hasExpiredPendingRequest: false,
  }
}

export function RequestAccessScreen() {
  const toast = useToast()

  const [msgError, setMsgError] = useState<string | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [hasPendingRequest, setHasPendingRequest] = useState<boolean>(false)
  const [hasTooManyRequests, setHasTooManyRequests] = useState<boolean>(false)
  const [hasBeenDenied, setHasBeenDenied] = useState<boolean>(false)

  const [note, setNote] = useState<string | undefined>()
  const [noteLength, setNoteLength] = useState<number>(0)

  const {activeWorkspace} = useActiveWorkspace()

  const handleLogout = useCallback(() => {
    void activeWorkspace.auth.logout?.()
  }, [activeWorkspace])

  const auth$ = useMemo(
    () =>
      activeWorkspace.auth.state.pipe(
        map(({client: sanityClient, currentUser: user}): AuthStateResult => {
          // Need to get the client, projectId, and user from workspace
          // because this screen is outside the SourceContext
          return {
            type: 'value',
            projectId: sanityClient.config().projectId,
            client: sanityClient.withConfig({apiVersion: '2024-07-01'}),
            currentUser: user,
          }
        }),
        catchError((authError: unknown) => of({type: 'error' as const, error: authError})),
      ),
    [activeWorkspace],
  )

  const authResult = useObservable(auth$, INITIAL_AUTH_RESULT)

  const client = authResult.type === 'value' ? authResult.client : undefined
  const projectId = authResult.type === 'value' ? authResult.projectId : undefined
  const currentUser = authResult.type === 'value' ? authResult.currentUser : null
  const authError = authResult.type === 'error' ? authResult.error : null

  const accessRequests$ = useMemo(() => {
    if (!client || !projectId) {
      return of(INITIAL_ACCESS_REQUEST_STATUS)
    }

    return client.observable
      .request<AccessRequest[] | null>({
        url: '/access/requests/me',
        tag: 'request-access',
      })
      .pipe(
        map(
          (requests): AccessRequestStatus => ({
            loading: false,
            ...deriveAccessRequestStatus(requests, projectId),
          }),
        ),
        catchError((err) => {
          console.error(err)
          return of<AccessRequestStatus>({
            loading: false,
            hasBeenDenied: false,
            hasPendingRequest: false,
            hasExpiredPendingRequest: false,
            error: true,
          })
        }),
        startWith(INITIAL_ACCESS_REQUEST_STATUS),
      )
  }, [client, projectId])

  const accessRequestStatus = useObservable(accessRequests$, INITIAL_ACCESS_REQUEST_STATUS)

  const loading = accessRequestStatus.loading
  const fetchedHasPendingRequest = accessRequestStatus.hasPendingRequest
  const fetchedHasExpiredPendingRequest = accessRequestStatus.hasExpiredPendingRequest
  const fetchedHasBeenDenied = accessRequestStatus.hasBeenDenied
  const accessError = accessRequestStatus.error ?? null

  const resolvedError = authError || accessError
  const resolvedHasPendingRequest = fetchedHasPendingRequest || hasPendingRequest
  const resolvedHasBeenDenied = fetchedHasBeenDenied || hasBeenDenied
  const resolvedHasExpiredPendingRequest = fetchedHasExpiredPendingRequest

  const handleSubmitRequest = useCallback(() => {
    // If we haven't loaded the client or projectId from
    // current worspace, return early
    if (!client || !projectId) return

    setIsSubmitting(true)

    client
      .request<AccessRequest | null>({
        url: `/access/project/${projectId}/requests`,
        method: 'post',
        body: {note, requestUrl: window?.location.href, type: 'access'},
      })
      .then((request) => {
        if (request) setHasPendingRequest(true)
      })
      .catch((err) => {
        const statusCode = err?.response?.statusCode
        const errMessage = err?.response?.body?.message
        if (statusCode === 429) {
          // User is over their cross-project request limit
          setHasTooManyRequests(true)
          setMsgError(errMessage)
        }
        if (statusCode === 409) {
          // If we get a 409, user has been denied on this project or has a valid pending request
          // valid pending request should be handled by GET request above
          setHasBeenDenied(true)
          setMsgError(errMessage)
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
  if (resolvedError) return <NotAuthenticatedScreen />
  return (
    <Card height="fill">
      <Dialog id="not-authorized-dialog" header="Not authorized" width={1}>
        <Box>
          <Stack space={4}>
            <Text>
              You are not authorized to access this studio (currently signed in as{' '}
              <strong>
                {currentUser?.name} ({currentUser?.email})
              </strong>
              {providerHelp}
              ).
            </Text>
            {hasTooManyRequests || resolvedHasPendingRequest || resolvedHasBeenDenied ? (
              <Card
                tone={resolvedHasPendingRequest ? 'transparent' : 'caution'}
                padding={3}
                radius={2}
                shadow={1}
              >
                <Text size={1}>
                  {hasTooManyRequests && !resolvedHasPendingRequest && (
                    <>
                      {msgError ??
                        `You've reached the limit for access requests across all projects. Please wait
                      before submitting more requests or contact an admin for assistance.`}
                    </>
                  )}
                  {resolvedHasPendingRequest && (
                    <>Your request to access this project is pending approval.</>
                  )}
                  {resolvedHasBeenDenied && (
                    <>{msgError ?? `Your request to access this project has been declined.`}</>
                  )}
                </Text>
              </Card>
            ) : (
              <>
                <Text>
                  {resolvedHasExpiredPendingRequest ? (
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
                <Stack space={3} paddingBottom={0}>
                  <TextInput
                    maxLength={MAX_NOTE_LENGTH}
                    disabled={isSubmitting}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSubmitRequest()
                    }}
                    onChange={(e) => {
                      setNote(e.currentTarget.value)
                      setNoteLength(e.currentTarget.value.length)
                    }}
                    value={note}
                    placeholder="Add your note…"
                  />
                  <Text align="right" muted size={1}>{`${noteLength}/${MAX_NOTE_LENGTH}`}</Text>
                </Stack>
              </>
            )}
          </Stack>
          <Flex align={'center'} justify={'space-between'} paddingTop={4}>
            <Button
              mode="bleed"
              text={'Sign out'}
              tone="default"
              onClick={handleLogout}
              size="large"
            />
            {!hasTooManyRequests && !resolvedHasBeenDenied && (
              <Button
                mode="default"
                text={resolvedHasPendingRequest ? 'Request sent' : 'Request access'}
                disabled={resolvedHasPendingRequest || isSubmitting}
                loading={isSubmitting}
                tone="default"
                onClick={handleSubmitRequest}
                size="large"
              />
            )}
          </Flex>
        </Box>
      </Dialog>
    </Card>
  )
}
