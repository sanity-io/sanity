import {type ReactNode} from 'react'

/**
 * All user-facing strings in the request-access screen. Every label can be
 * overridden, so hosts with their own i18n stack (studio i18n, react-i18next)
 * inject translated copy while standalone hosts get the English defaults.
 *
 * @public
 */
export interface RequestAccessLabels {
  title: ReactNode
  sentTitle: ReactNode
  deniedTitle: ReactNode
  errorTitle: ReactNode
  describeNoAccess: (context: {email?: string}) => ReactNode
  promptProject: ReactNode
  promptOrganization: ReactNode
  notePlaceholder: string
  noteAriaLabel: string
  submit: ReactNode
  sentDescription: ReactNode
  pendingMessage: ReactNode
  deniedMessage: (context: {message?: string}) => ReactNode
  overLimitMessage: (context: {message?: string}) => ReactNode
  expiredMessage: ReactNode
  ssoEnforcedTitle: ReactNode
  ssoEnforcedMessage: (context: {providerTitle?: string; signedInWithSso?: boolean}) => ReactNode
  ssoSignInCta: ReactNode
  resourceNotAvailableTitle: ReactNode
  resourceNotAvailableMessage: ReactNode
  alreadyMemberTitle?: ReactNode
  alreadyMemberMessage?: ReactNode
  requestsDisabledTitle?: ReactNode
  requestsDisabledMessage?: ReactNode
  requestLimitReachedTitle?: ReactNode
  requestLimitReachedMessage?: ReactNode
  emailDomainBlockedTitle?: ReactNode
  emailDomainBlockedMessage?: ReactNode
  temporarilyUnavailableTitle?: ReactNode
  temporarilyUnavailableMessage?: ReactNode
  retry?: ReactNode
  samlRolesManagedTitle?: ReactNode
  samlRolesManagedMessage?: () => ReactNode
  submitFailedMessage: ReactNode
  wrongAccount: ReactNode
  signOut: ReactNode
}

/** @internal */
export type ResolvedRequestAccessLabels = RequestAccessLabels &
  Required<
    Pick<
      RequestAccessLabels,
      | 'alreadyMemberTitle'
      | 'alreadyMemberMessage'
      | 'requestsDisabledTitle'
      | 'requestsDisabledMessage'
      | 'requestLimitReachedTitle'
      | 'requestLimitReachedMessage'
      | 'emailDomainBlockedTitle'
      | 'emailDomainBlockedMessage'
      | 'temporarilyUnavailableTitle'
      | 'temporarilyUnavailableMessage'
      | 'retry'
      | 'samlRolesManagedTitle'
      | 'samlRolesManagedMessage'
    >
  >

/** @internal */
export const defaultLabels: ResolvedRequestAccessLabels = {
  title: 'Request access',
  sentTitle: 'Access request sent',
  deniedTitle: 'Access request declined',
  errorTitle: 'Access request couldn’t be sent',
  describeNoAccess: ({email}) =>
    email ? (
      <>
        Your account <strong>({email})</strong> doesn’t have access to this content.
      </>
    ) : (
      <>Your account doesn’t have access to this content.</>
    ),
  promptProject: 'Send a request to the project admin(s).',
  promptOrganization: 'Send a request to the organization admin(s).',
  notePlaceholder: 'Message (optional)',
  noteAriaLabel: 'Message',
  submit: 'Request access',
  sentDescription:
    'Your request has been sent. You will receive a notification if access is approved.',
  pendingMessage: 'Your request to access this content is pending approval.',
  deniedMessage: ({message}) => message ?? 'Your request to access this content has been declined.',
  overLimitMessage: ({message}) =>
    message ??
    'You’ve reached the limit for access requests across all projects. Please wait before submitting more requests, or contact an admin.',
  expiredMessage: 'Your previous request has expired. You may request access again below.',
  // Reached both before and after a submit, so it must not claim a send failed.
  ssoEnforcedTitle: 'Organization SSO required',
  ssoEnforcedMessage: () =>
    'This organization requires you to sign in with its SSO. Sign out, then sign in again with your organization’s SSO. If that still doesn’t work, contact your organization’s administrator.',
  ssoSignInCta: 'Sign in with SSO',
  resourceNotAvailableTitle: 'Access can’t be requested',
  resourceNotAvailableMessage: 'The resource currently being requested is no longer available.',
  alreadyMemberTitle: 'You’re already a member',
  alreadyMemberMessage:
    'Your account is already a member, but it may not have access to this content. Check that you’re using the right account, or contact an administrator for help.',
  requestsDisabledTitle: 'Access requests are disabled',
  requestsDisabledMessage:
    'This organization does not accept access requests. Contact an administrator for help.',
  requestLimitReachedTitle: 'Access request limit reached',
  requestLimitReachedMessage:
    'You’ve reached the limit for access requests. Please wait before trying again, or contact an administrator.',
  emailDomainBlockedTitle: 'Access can’t be requested',
  emailDomainBlockedMessage:
    'Accounts with this email domain can’t request access. Contact an administrator for help.',
  temporarilyUnavailableTitle: 'Access request unavailable',
  temporarilyUnavailableMessage:
    'We couldn’t check whether access can be requested. Please try again later.',
  retry: 'Try again',
  samlRolesManagedTitle: 'Access is managed through SSO',
  samlRolesManagedMessage: () =>
    `Your roles are managed through your organization’s SSO. Signing in through SSO again may reapply mapped roles, but it does not guarantee access. If you still can’t access this content, contact your organization’s administrator.`,
  submitFailedMessage: 'There was a problem submitting your request. Please try again.',
  wrongAccount: 'Wrong account?',
  signOut: 'Sign out',
}
