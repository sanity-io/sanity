/* oxlint-disable i18next/no-literal-string,@sanity/i18n/no-attribute-string-literals */
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

type AccessRequestStatus = {
  loading: boolean
  hasBeenDenied: boolean
  hasPendingRequest: boolean
  hasExpiredPendingRequest: boolean
  /** The Access API could not be reached; the screen falls back to `NotAuthenticatedScreen`. */
  error: boolean
}

const INITIAL_ACCESS_REQUEST_STATUS: AccessRequestStatus = {
  loading: true,
  hasBeenDenied: false,
  hasPendingRequest: false,
  hasExpiredPendingRequest: false,
  error: false,
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

  // Set by submitting the form; the observable below only reports what the API already knows.
  const [msgError, setMsgError] = useState<string | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedRequest, setSubmittedRequest] = useState(false)
  const [hasTooManyRequests, setHasTooManyRequests] = useState(false)
  const [submitDenied, setSubmitDenied] = useState(false)
  const [note, setNote] = useState<string | undefined>()

  const {activeWorkspace} = useActiveWorkspace()

  const handleLogout = useCallback(() => {
    void activeWorkspace.auth.logout?.()
  }, [activeWorkspace])

  // The client, projectId and user come from the workspace because this screen
  // renders outside the SourceContext.
  const auth = useObservable(activeWorkspace.auth.state, null)
  const currentUser = auth?.currentUser
  const projectId = auth?.client.config().projectId
  const client = useMemo(() => auth?.client.withConfig({apiVersion: '2024-07-01'}), [auth?.client])

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
            error: false,
            ...deriveAccessRequestStatus(requests, projectId),
          }),
        ),
        // A failing Access API is not fatal: fall back to the plain not-authorized screen
        // rather than throwing to an error boundary.
        catchError((err) => {
          console.error(err)
          return of<AccessRequestStatus>({
            ...INITIAL_ACCESS_REQUEST_STATUS,
            loading: false,
            error: true,
          })
        }),
        startWith(INITIAL_ACCESS_REQUEST_STATUS),
      )
  }, [client, projectId])

  const {loading, error, hasExpiredPendingRequest, ...fetched} = useObservable(
    accessRequests$,
    INITIAL_ACCESS_REQUEST_STATUS,
  )

  const hasPendingRequest = fetched.hasPendingRequest || submittedRequest
  const hasBeenDenied = fetched.hasBeenDenied || submitDenied
  const noteLength = note?.length ?? 0

  const handleSubmitRequest = useCallback(() => {
    // If we haven't loaded the client or projectId from
    // current workspace, return early
    if (!client || !projectId) return

    setIsSubmitting(true)

    client
      .request<AccessRequest | null>({
        url: `/access/project/${projectId}/requests`,
        method: 'post',
        body: {note, requestUrl: window?.location.href, type: 'access'},
      })
      .then((request) => {
        if (request) setSubmittedRequest(true)
      })
      .catch((err) => {
        const statusCode = err?.response?.statusCode
        const errMessage = err?.response?.body?.message
        if (statusCode === 429) {
          // User is over their cross-project request limit
          setHasTooManyRequests(true)
          setMsgError(errMessage)
        } else if (statusCode === 409) {
          // If we get a 409, user has been denied on this project or has a valid pending request
          // valid pending request should be handled by GET request above
          setSubmitDenied(true)
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
  if (error) return <NotAuthenticatedScreen />
  return (
    <Card height="fill">
      <Dialog id="not-authorized-dialog" header="Not authorized" width={1}>
        <Box>
          <Stack gap={4}>
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
                      {msgError ??
                        `You've reached the limit for access requests across all projects. Please wait
                      before submitting more requests or contact an admin for assistance.`}
                    </>
                  )}
                  {hasPendingRequest && (
                    <>Your request to access this project is pending approval.</>
                  )}
                  {hasBeenDenied && (
                    <>{msgError ?? `Your request to access this project has been declined.`}</>
                  )}
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
                <Stack gap={3} paddingBottom={0}>
                  <TextInput
                    maxLength={MAX_NOTE_LENGTH}
                    disabled={isSubmitting}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSubmitRequest()
                    }}
                    onChange={(e) => setNote(e.currentTarget.value)}
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
            {!hasTooManyRequests && !hasBeenDenied && (
              <Button
                mode="default"
                text={hasPendingRequest ? 'Request sent' : 'Request access'}
                disabled={hasPendingRequest || isSubmitting}
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
