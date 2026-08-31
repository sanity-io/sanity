import {type SanityClient} from '@sanity/client'
import {LaunchIcon} from '@sanity/icons/Launch'
import {Avatar, Button, Card, Flex, Spinner, Stack, Text, TextArea} from '@sanity/ui'
import {
  type ReactNode,
  type SubmitEvent,
  Suspense,
  use,
  useId,
  useState,
  useTransition,
} from 'react'
import {Box} from 'ui5'

import {
  fetchAccessRequestStatus,
  listMyAccessRequests,
  MAX_ACCESS_REQUEST_NOTE_LENGTH,
  submitAccessRequest,
} from './accessRequests'
import {deriveAccessRequestState} from './deriveAccessRequestState'
import {defaultLabels, type RequestAccessLabels} from './labels'
import {getProviderTitle} from './providerTitle'
import {
  type AccessRequest,
  type AccessRequestStatus,
  type AccessResourceType,
  type AccessUser,
  type SubmitAccessRequestResult,
} from './types'

/** @public */
export interface RequestAccessFormProps {
  /** Client authenticated as the requesting user. The Access API version is applied internally. */
  client: SanityClient
  resourceType?: AccessResourceType
  /** Project or organization id to request access to. */
  resourceId: string
  /** The signed-in user, rendered in the description and account footer. */
  currentUser?: AccessUser | null
  /**
   * Called when the user chooses "Sign out". The account footer's sign-out
   * action is only rendered when provided; hosts own the actual sign-out
   * mechanism (studio: `auth.logout()`, dashboard: logout route navigation).
   */
  onSignOut?: () => void
  /** Called after a request is successfully submitted, e.g. for analytics. */
  onRequestSubmitted?: (details: {note?: string}) => void
  /** Optional slot rendered above the title, e.g. a resource preview. */
  preview?: ReactNode
  /**
   * Renders an optional action area at the bottom of the card's content, e.g.
   * a navigation CTA. Called with the current view so the action can differ
   * per state (or be omitted for some); return null to render nothing.
   */
  renderAction?: (context: {view: RequestAccessView}) => ReactNode
  /** Label overrides for hosts with their own i18n stack. */
  labels?: Partial<RequestAccessLabels>
}

/**
 * The shared request-access screen: explains that the signed-in account lacks
 * access, lets the user request it with an optional note, and reflects the
 * request lifecycle (pending, denied, expired, over-limit, SSO-enforced).
 *
 * Fetches the caller's existing requests on mount and suspends while loading;
 * an internal `Suspense` boundary renders a spinner, so hosts can mount it
 * directly. Remount with a `key` when `client` or `resourceId` change.
 *
 * @public
 */
export function RequestAccessForm(props: RequestAccessFormProps) {
  const {client, resourceType = 'project', resourceId} = props

  // Created once (lazy init): recreating the promise per render would refetch
  // and re-suspend forever. Callers remount with `key` to reset.
  const [requestsPromise] = useState(() =>
    listMyAccessRequests(client).catch((): AccessRequest[] | null => null),
  )
  const [statusPromise] = useState(() =>
    fetchAccessRequestStatus({
      client,
      resourceType,
      resourceId,
      origin: getRequestUrl(),
    }),
  )

  return (
    <Card border height="fill" overflow="hidden" radius={3} tone="default">
      <Suspense
        fallback={
          <Flex align="center" height="fill" justify="center" padding={5}>
            <Spinner muted />
          </Flex>
        }
      >
        <RequestAccessFormContent
          {...props}
          requestsPromise={requestsPromise}
          statusPromise={statusPromise}
        />
      </Suspense>
    </Card>
  )
}

/**
 * The view the request-access card is currently showing.
 *
 * @public
 */
export type RequestAccessView = 'form' | 'sent' | 'pending' | 'blocked' | 'sso-enforced'

type ViewState =
  | {view: 'form'; expired: boolean}
  | {view: 'sent'}
  | {view: 'pending'}
  | {view: 'blocked'; title: ReactNode; message: ReactNode}
  | {view: 'sso-enforced'; redirectUrl?: string}

/**
 * The server's verdict. `null` hands the decision back to the caller's own
 * request history, which resolves the states this endpoint does not.
 */
function deriveServerViewState(
  status: AccessRequestStatus,
  labels: RequestAccessLabels,
): ViewState | null {
  switch (status.state) {
    case 'saml-required':
      return {view: 'sso-enforced', redirectUrl: status.redirectUrl}
    case 'resource-not-available':
      // Nothing was submitted, so the submit-failure copy would misdescribe it.
      return {
        view: 'blocked',
        title: labels.resourceNotAvailableTitle,
        message: labels.resourceNotAvailableMessage,
      }
    case 'eligible':
      return null
    default:
      return null
  }
}

function deriveViewState(options: {
  fetchedRequests: AccessRequest[] | null
  status: AccessRequestStatus
  resourceId: string
  submitResult: SubmitAccessRequestResult | null
  labels: RequestAccessLabels
}): ViewState {
  const {fetchedRequests, status, resourceId, submitResult, labels} = options

  if (submitResult) {
    switch (submitResult.type) {
      case 'submitted':
        return {view: 'sent'}
      case 'sso-enforced':
        return {view: 'sso-enforced', redirectUrl: submitResult.redirectUrl}
      case 'denied':
        return {
          view: 'blocked',
          title: labels.errorTitle,
          message: labels.deniedMessage({message: submitResult.message}),
        }
      case 'over-limit':
        return {
          view: 'blocked',
          title: labels.errorTitle,
          message: labels.overLimitMessage({message: submitResult.message}),
        }
      case 'email-domain-blocked':
      case 'requests-disabled':
        return {view: 'blocked', title: labels.errorTitle, message: submitResult.message}
      case 'error':
        // Fall through to the fetched state; the form stays up with an inline error.
        break
      default:
    }
  }

  // The server's verdict outranks the request history: a pending request in an
  // enforced org is already dead, so "pending approval" would be a false
  // promise. It answers `eligible` when it has nothing to say.
  const serverState = deriveServerViewState(status, labels)
  if (serverState) return serverState

  const state = deriveAccessRequestState(fetchedRequests, resourceId)
  if (state === 'pending') return {view: 'pending'}
  // Derived from prefetch: the user hasn't submitted anything this session,
  // so the title must describe the prior decline, not a failed send.
  if (state === 'denied') {
    return {view: 'blocked', title: labels.deniedTitle, message: labels.deniedMessage({})}
  }
  return {view: 'form', expired: state === 'expired'}
}

function RequestAccessFormContent(
  props: RequestAccessFormProps & {
    requestsPromise: Promise<AccessRequest[] | null>
    statusPromise: Promise<AccessRequestStatus>
  },
) {
  const {
    client,
    resourceType = 'project',
    resourceId,
    currentUser,
    onSignOut,
    onRequestSubmitted,
    preview,
    renderAction,
    requestsPromise,
    statusPromise,
  } = props

  const labels = {...defaultLabels, ...props.labels}
  const fetchedRequests = use(requestsPromise)
  const status = use(statusPromise)
  const titleId = useId()

  const [note, setNote] = useState('')
  const [submitResult, setSubmitResult] = useState<SubmitAccessRequestResult | null>(null)
  const [isSubmitting, startSubmit] = useTransition()

  const state = deriveViewState({
    fetchedRequests,
    status,
    resourceId,
    submitResult,
    labels,
  })
  const providerTitle = getProviderTitle(currentUser?.provider)
  const submitFailed = submitResult?.type === 'error'

  const heading: Record<
    Exclude<ViewState['view'], 'blocked'>,
    {title: ReactNode; description: ReactNode | null}
  > = {
    'form': {
      title: labels.title,
      description: labels.describeNoAccess({email: currentUser?.email}),
    },
    'sent': {title: labels.sentTitle, description: labels.sentDescription},
    'pending': {title: labels.sentTitle, description: labels.pendingMessage},
    'sso-enforced': {title: labels.errorTitle, description: null},
  }
  const {title, description} =
    state.view === 'blocked' ? {title: state.title, description: null} : heading[state.view]

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return
    startSubmit(async () => {
      const trimmedNote = note.trim() || undefined
      const result = await submitAccessRequest({
        client,
        resourceType,
        resourceId,
        note: trimmedNote,
        requestUrl: getRequestUrl(),
      })
      setSubmitResult(result)
      if (result.type === 'submitted') onRequestSubmitted?.({note: trimmedNote})
    })
  }

  return (
    <Flex direction="column" height="fill">
      <Flex direction="column" flex={1} gap={4} padding={4}>
        {preview ? (
          <Flex justify="center" padding={2}>
            {preview}
          </Flex>
        ) : null}

        <Text as="h1" id={titleId} size={2} weight="semibold">
          {title}
        </Text>

        {description !== null ? (
          <Text as="p" muted size={1}>
            {description}
          </Text>
        ) : null}

        {state.view === 'blocked' ? (
          <Card border padding={3} radius={2} role="alert" tone="caution">
            <Text as="p" muted size={1}>
              {state.message}
            </Text>
          </Card>
        ) : null}

        {state.view === 'sso-enforced' ? (
          <Stack gap={4}>
            <Card border padding={3} radius={2} role="alert" tone="caution">
              <Text as="p" muted size={1}>
                {labels.ssoEnforcedMessage({providerTitle})}
              </Text>
            </Card>
            {state.redirectUrl ? (
              <Button
                as="a"
                href={state.redirectUrl}
                iconRight={LaunchIcon}
                mode="ghost"
                text={labels.ssoSignInCta}
                width="fill"
              />
            ) : null}
          </Stack>
        ) : null}

        {state.view === 'form' ? (
          <Stack as="form" aria-labelledby={titleId} onSubmit={handleSubmit} gap={4}>
            <Text as="p" size={1}>
              {state.expired
                ? labels.expiredMessage
                : resourceType === 'organization'
                  ? labels.promptOrganization
                  : labels.promptProject}
            </Text>
            <Stack gap={2}>
              <TextArea
                aria-label={labels.noteAriaLabel}
                disabled={isSubmitting}
                fontSize={1}
                maxLength={MAX_ACCESS_REQUEST_NOTE_LENGTH}
                onChange={(event) => setNote(event.currentTarget.value)}
                placeholder={labels.notePlaceholder}
                rows={3}
                value={note}
              />
              <Text align="right" muted size={0}>
                {`${note.length}/${MAX_ACCESS_REQUEST_NOTE_LENGTH}`}
              </Text>
            </Stack>
            {submitFailed ? (
              <Card border padding={3} radius={2} role="alert" tone="critical">
                <Text as="p" muted size={1}>
                  {labels.submitFailedMessage}
                </Text>
              </Card>
            ) : null}
            <Button
              disabled={isSubmitting}
              loading={isSubmitting}
              text={labels.submit}
              type="submit"
              width="fill"
            />
          </Stack>
        ) : null}

        {renderAction?.({view: state.view})}
      </Flex>

      {currentUser ? (
        <Card borderTop padding={3}>
          <Flex align="center" direction="column" gap={3}>
            <Flex align="center" gap={2} justify="center">
              <Avatar initials={getInitials(currentUser)} size={0} src={currentUser.profileImage} />
              <Box>
                <Text muted size={1} textOverflow="ellipsis">
                  {currentUser.email ?? currentUser.name}
                  {providerTitle ? ` · ${providerTitle}` : ''}
                </Text>
              </Box>
            </Flex>
            {onSignOut ? (
              <Button
                fontSize={0}
                mode="bleed"
                onClick={onSignOut}
                padding={2}
                textWeight="regular"
              >
                <Text muted size={1}>
                  {labels.wrongAccount} <strong>{labels.signOut}</strong>
                </Text>
              </Button>
            ) : null}
          </Flex>
        </Card>
      ) : null}
    </Flex>
  )
}

// The URL fragment can carry auth tokens (e.g. the #token= login handoff),
// so it must never reach the Access API's logs.
function getRequestUrl(): string | undefined {
  if (typeof window === 'undefined') return undefined
  const url = new URL(window.location.href)
  url.hash = ''
  return url.toString()
}

function getInitials(user: AccessUser): string | undefined {
  const source = user.name ?? user.email
  if (!source) return undefined
  const parts = source.trim().split(/\s+/)
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
  return initials ? initials.toUpperCase() : undefined
}
