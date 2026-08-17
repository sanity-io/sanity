import {type ComponentProps} from 'react'

import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {Dialog} from '../Dialog'

/**
 * Studio Dialog wrapper. TestWrapper supplies i18n for default footer labels.
 */
export function DialogStory(props: ComponentProps<typeof Dialog>) {
  return (
    <TestWrapper schemaTypes={[]}>
      <Dialog {...props} />
    </TestWrapper>
  )
}
