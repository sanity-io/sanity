import {ChannelError} from '@sanity/client'
import noop from 'lodash-es/noop.js'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {RequestErrorDialog} from '../RequestErrorDialog'
import {type RequestErrorClaim} from '../types'

const CLAIMS = {
  network: {
    type: 'networkError',
    error: new Error('Failed to fetch'),
    retryable: true,
  },
  listener: {
    type: 'listenerError',
    error: new ChannelError('Permission denied', {
      error: {type: 'permissionDeniedError', description: 'Permission denied'},
    }),
    retryable: false,
  },
} satisfies Record<string, Exclude<RequestErrorClaim, {type: 'unauthorized'}>>

/**
 * Chromatic sentinel for the request-error dialog after the ui5 Flex/Box
 * migration. Network troubleshooting Box-as-list items sit next to Dialog
 * footer button rows — a mix TypeScript will not catch. Retryable network
 * only: no Retry-After countdown (would churn). The `listener` variant is the
 * connection error shown when a listener fails for good: reload-only footer and
 * the status link. Harness for the co-located Storybook CSF file, which waits
 * for the dialog and blurs auto-focus.
 */
export function RequestErrorDialogStory(props: {variant?: keyof typeof CLAIMS}) {
  const {variant = 'network'} = props
  return (
    <TestWrapper schemaTypes={[]}>
      <RequestErrorDialog claim={CLAIMS[variant]} onRetry={noop} />
    </TestWrapper>
  )
}
