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
  type AccessRequestEligibilityState,
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

/**
 * Everything the card renders, copy included: the same state that picks a view
 * is the only thing that knows which words that view needs. Keying copy off
 * `view` alone cannot work, because `blocked` covers a prior decline, a gone
 * resource and four submit failures, each with its own copy.
 */
type ViewState = {title: ReactNode; description: ReactNode | null} & (
  | {view: 'form'; expired: boolean}
  | {view: 'sent'}
  | {view: 'pending'}
  | {view: 'blocked'; message: ReactNode}
  | {view: 'sso-enforced'; message: ReactNode; redirectUrl?: string}
)

/**
 * The server's verdict. `null` hands the decision back to the caller's own
 * request history, which resolves the states this endpoint does not.
 */
function deriveServerViewState(
  status: AccessRequestEligibilityState,
  labels: RequestAccessLabels,
  providerTitle?: string,
): ViewState | null {
  switch (status.state) {
    case 'saml-required':
      return ssoEnforcedState({labels, providerTitle, redirectUrl: status.redirectUrl})
    case 'resource-not-available':
      // Nothing was submitted, so the submit-failure copy would misdescribe it.
      return {
        view: 'blocked',
        title: labels.resourceNotAvailableTitle,
        description: null,
        message: labels.resourceNotAvailableMessage,
      }
    case 'eligible':
      return null
    default:
      return null
  }
}

// Reached on mount and after a submit 403, so the title claims neither.
function ssoEnforcedState(options: {
  labels: RequestAccessLabels
  providerTitle?: string
  redirectUrl?: string
}): ViewState {
  const {labels, providerTitle, redirectUrl} = options
  return {
    view: 'sso-enforced',
    title: labels.ssoEnforcedTitle,
    description: null,
    message: labels.ssoEnforcedMessage({providerTitle}),
    redirectUrl,
  }
}

function deriveViewState(options: {
  accessRequestsHistory: AccessRequest[] | null
  accessRequestEligibilityState: AccessRequestEligibilityState
  resourceId: string
  submitAccessRequestResult: SubmitAccessRequestResult | null
  currentUser?: AccessUser | null
  providerTitle?: string
  labels: RequestAccessLabels
}): ViewState {
  const {
    accessRequestsHistory,
    accessRequestEligibilityState,
    resourceId,
    submitAccessRequestResult,
    currentUser,
    providerTitle,
    labels,
  } = options
  const submitFailure = (message: ReactNode): ViewState => ({
    view: 'blocked',
    title: labels.errorTitle,
    description: null,
    message,
  })

  if (submitAccessRequestResult) {
    switch (submitAccessRequestResult.type) {
      case 'submitted':
        return {view: 'sent', title: labels.sentTitle, description: labels.sentDescription}
      case 'sso-enforced':
        return ssoEnforcedState({
          labels,
          providerTitle,
          redirectUrl: submitAccessRequestResult.redirectUrl,
        })
      case 'denied':
        return submitFailure(labels.deniedMessage({message: submitAccessRequestResult.message}))
      case 'over-limit':
        return submitFailure(labels.overLimitMessage({message: submitAccessRequestResult.message}))
      case 'email-domain-blocked':
      case 'requests-disabled':
        return submitFailure(submitAccessRequestResult.message)
      case 'error':
        // Fall through to the fetched state; the form stays up with an inline error.
        break
      default:
    }
  }

  // The server's verdict outranks the request history: a pending request in an
  // enforced org is already dead, so "pending approval" would be a false
  // promise. It answers `eligible` when it has nothing to say.
  const serverState = deriveServerViewState(accessRequestEligibilityState, labels, providerTitle)
  if (serverState) return serverState

  // TODO: `pending` and `denied` will be replaced by future content in `accessRequestEligibilityState`
  const state = deriveAccessRequestState(accessRequestsHistory, resourceId)
  if (state === 'pending') {
    return {view: 'pending', title: labels.sentTitle, description: labels.pendingMessage}
  }
  // Derived from prefetch: the user hasn't submitted anything this session,
  // so the title must describe the prior decline, not a failed send.
  if (state === 'denied') {
    return {
      view: 'blocked',
      title: labels.deniedTitle,
      description: null,
      message: labels.deniedMessage({}),
    }
  }
  return {
    view: 'form',
    title: labels.title,
    description: labels.describeNoAccess({email: currentUser?.email}),
    expired: state === 'expired',
  }
}

function RequestAccessFormContent(
  props: RequestAccessFormProps & {
    requestsPromise: Promise<AccessRequest[] | null>
    statusPromise: Promise<AccessRequestEligibilityState>
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
  const accessRequestsHistory = use(requestsPromise)
  const accessRequestEligibilityState = use(statusPromise)
  const titleId = useId()

  const [note, setNote] = useState('')
  const [submitAccessRequestResult, setSubmitAccessRequestResult] =
    useState<SubmitAccessRequestResult | null>(null)
  const [isSubmitting, startSubmit] = useTransition()

  const providerTitle = getProviderTitle(currentUser?.provider)
  const state = deriveViewState({
    accessRequestsHistory,
    accessRequestEligibilityState,
    resourceId,
    submitAccessRequestResult,
    currentUser,
    providerTitle,
    labels,
  })

  const submitFailed = submitAccessRequestResult?.type === 'error'

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
      setSubmitAccessRequestResult(result)
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
          {state.title}
        </Text>

        {state.description !== null ? (
          <Text as="p" muted size={1}>
            {state.description}
          </Text>
        ) : null}

        {state.view === 'blocked' || state.view === 'sso-enforced' ? (
          <Stack gap={4}>
            <Card border padding={3} radius={2} role="alert" tone="caution">
              <Text as="p" muted size={1}>
                {state.message}
              </Text>
            </Card>
            {state.view === 'sso-enforced' && state.redirectUrl ? (
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
