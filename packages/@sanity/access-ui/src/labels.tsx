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
  ssoEnforcedMessage: (context: {providerTitle?: string}) => ReactNode
  ssoSignInCta: ReactNode
  submitFailedMessage: ReactNode
  wrongAccount: ReactNode
  signOut: ReactNode
}

/** @internal */
export const defaultLabels: RequestAccessLabels = {
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
  ssoEnforcedMessage: ({providerTitle}) =>
    providerTitle ? (
      <>
        You’re signed in with <strong>{providerTitle}</strong>, but this organization requires
        signing in with SSO. Access can’t be requested with this account.
      </>
    ) : (
      <>
        This organization requires signing in with SSO. Access can’t be requested with this account.
      </>
    ),
  ssoSignInCta: 'Sign in with SSO',
  submitFailedMessage: 'There was a problem submitting your request. Please try again.',
  wrongAccount: 'Wrong account?',
  signOut: 'Sign out',
}
