import {Card, Stack, Text} from '@sanity/ui'

import {TestWrapper} from '../../../../../../../../test/browser/TestWrapper'
import {DateIncludeTimeFooter} from '../filters/filter/inputs/date/dateIncludeTimeFooter/DateIncludeTimeFooter'
import {Instructions} from '../Instructions'

const NOOP = () => undefined

/**
 * Chromatic sentinel for navbar search chrome that main already moved to
 * ui5 Flex: the empty-state instructions row (icon + muted copy) and the
 * calendar include-time footer (label + switch). Flex alignment against
 * muted Text/Switch is a mix TypeScript will not catch. Copy comes from
 * the studio locale bundle (no live queries, no dates).
 */
export function SearchChromeStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 420}}>
        <Stack gap={5}>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              instructions
            </Text>
            <Instructions />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              include time off
            </Text>
            <DateIncludeTimeFooter onChange={NOOP} value={false} />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              include time on
            </Text>
            <DateIncludeTimeFooter onChange={NOOP} value />
          </Stack>
        </Stack>
      </Card>
    </TestWrapper>
  )
}
