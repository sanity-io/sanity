import {Card, Stack, Text} from '@sanity/ui'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {IncompatibleItemType} from '../ArrayOfObjectsInput/List/IncompatibleItemType'

/**
 * Chromatic sentinel for incompatible array-item chrome after the ui5 Box
 * migration. The closed prompt pairs Box icon gutter with Flex ellipsis
 * text — a mix TypeScript will not catch. Values are fixtures (popover
 * stays closed; Menu/Popover animate).
 */
export function IncompatibleItemTypeStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 420}}>
        <Stack gap={5}>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              object value
            </Text>
            <IncompatibleItemType value={{_type: 'legacyBlock', title: 'Legacy block'}} />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              string value
            </Text>
            <IncompatibleItemType value="legacy-string-item" />
          </Stack>
        </Stack>
      </Card>
    </TestWrapper>
  )
}
