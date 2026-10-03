import {Card, Text} from '@sanity/ui'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {ArrayItemsToggle} from '../ArrayItemsToggle'

const NOOP = () => undefined

/**
 * Chromatic sentinel for the array "show all / show fewer" divider after the
 * ui5 Flex migration. The bleed button sits between two 1px rules that read
 * `--card-border-color`; a Flex gap or Rule height drift would collapse or
 * thicken that chrome without a type error. Studio-namespace copy only.
 */
export function ArrayItemsToggleStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 480}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              collapsed, one item
            </Text>
            <ArrayItemsToggle expanded={false} onToggle={NOOP} totalCount={1} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              collapsed, many items
            </Text>
            <ArrayItemsToggle expanded={false} onToggle={NOOP} totalCount={12} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              expanded
            </Text>
            <ArrayItemsToggle expanded onToggle={NOOP} totalCount={12} />
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
