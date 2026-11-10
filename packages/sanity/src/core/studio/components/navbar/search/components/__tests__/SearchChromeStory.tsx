import {Card} from '@sanity/ui'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../../test/browser/TestWrapper'
import {DateIncludeTimeFooter} from '../filters/filter/inputs/date/dateIncludeTimeFooter/DateIncludeTimeFooter'
import {Instructions} from '../Instructions'
import {NoResults} from '../NoResults'

const NOOP = () => undefined

/**
 * Chromatic sentinel for the post-migration ui5 search chrome: the empty-state
 * instructions row (icon + muted copy), the no-results message (two centered
 * muted lines whose Stack padding becomes ui5 Flex padding) and the calendar
 * include-time footer (label + switch). Flex alignment against muted
 * Text/Switch is a mix TypeScript will not catch. Copy comes from the studio
 * locale bundle (no live queries, no dates).
 */
export function SearchChromeStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 420}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              instructions
            </Text>
            <Instructions />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              no results
            </Text>
            <NoResults />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              include time off
            </Text>
            <DateIncludeTimeFooter onChange={NOOP} value={false} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              include time on
            </Text>
            <DateIncludeTimeFooter onChange={NOOP} value />
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
