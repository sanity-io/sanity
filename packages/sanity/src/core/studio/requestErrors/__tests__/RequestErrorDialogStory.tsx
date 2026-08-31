import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {RequestErrorDialog} from '../RequestErrorDialog'
import {type RequestErrorClaim} from '../types'

const NOOP = () => undefined

const NETWORK_CLAIM: Extract<RequestErrorClaim, {type: 'networkError'}> = {
  type: 'networkError',
  error: new Error('Failed to fetch'),
  retryable: true,
}

/**
 * Chromatic sentinel for the request-error dialog after the ui5 Flex/Box
 * migration. Network troubleshooting Box-as-list items sit next to Dialog
 * footer button rows — a mix TypeScript will not catch. Retryable network
 * only: no Retry-After countdown (would churn).
 */
export function RequestErrorDialogStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <RequestErrorDialog claim={NETWORK_CLAIM} onRetry={NOOP} />
    </TestWrapper>
  )
}
