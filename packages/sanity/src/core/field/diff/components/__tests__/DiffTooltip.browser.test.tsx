import {diffInput, wrap} from '@sanity/diff'
import {Card, Text} from '@sanity/ui'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {settleOpenTooltip} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {LocaleProvider} from '../../../../i18n/components/LocaleProvider'
import {type AnnotationDetails, type StringDiff} from '../../../types'
import {DiffTooltip} from '../DiffTooltip'

// A fixed past timestamp: `useRelativeTime` renders dates in another year as
// a plain date ("Jun 15, 2020") and never schedules a refresh.
const ANNOTATION: AnnotationDetails = {author: 'doug', timestamp: '2020-06-15T12:00:00.000Z'}

const STRING_DIFF = diffInput(
  wrap('Old title', ANNOTATION),
  wrap('New title', ANNOTATION),
) as StringDiff

// `TestWrapper` mounts no locale provider, and `useRelativeTime` reads the
// current locale for its date formatter.
function DiffTooltipHarness() {
  return (
    <TestWrapper schemaTypes={[]}>
      <LocaleProvider>
        <Card padding={4} style={{maxWidth: 480}}>
          <DiffTooltip diff={STRING_DIFF}>
            <Card border data-testid="diff-tooltip-trigger" padding={3} radius={2}>
              <Text size={1}>Hover me</Text>
            </Card>
          </DiffTooltip>
        </Card>
      </LocaleProvider>
    </TestWrapper>
  )
}

describe('DiffTooltip', () => {
  it('shows the change description, author and timestamp of the diff annotation on hover', async () => {
    void render(<DiffTooltipHarness />)

    const trigger = page.getByTestId('diff-tooltip-trigger')
    await expect.element(trigger).toBeVisible()
    await userEvent.hover(trigger)

    await expect.element(page.getByText('Changed', {exact: true})).toBeVisible()
    await expect.element(page.getByText('Doug', {exact: true})).toBeVisible()
    await expect.element(page.getByText('Jun 15, 2020', {exact: true})).toBeVisible()

    await settleOpenTooltip()
  })
})
