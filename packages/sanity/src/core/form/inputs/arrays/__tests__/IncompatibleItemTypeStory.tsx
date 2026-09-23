import {Card, Text} from '@sanity/ui'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {IncompatibleItemType} from '../ArrayOfObjectsInput/List/IncompatibleItemType'

/**
 * Chromatic sentinel for incompatible array-item chrome after the ui5 Box
 * migration. The closed prompt pairs a Box icon gutter with a growing
 * zero-basis Box holding ellipsis text — if the migrated Box loses its
 * min-width semantics the ellipsis silently turns into overflow, so one
 * state narrows the card until the prompt actually truncates. Values are
 * fixtures (popover stays closed; Menu/Popover animate).
 */
export function IncompatibleItemTypeStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 420}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              object value
            </Text>
            <IncompatibleItemType value={{_type: 'legacyBlock', title: 'Legacy block'}} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              string value
            </Text>
            <IncompatibleItemType value="legacy-string-item" />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              long type name (ellipsis)
            </Text>
            <div style={{maxWidth: 240}}>
              <IncompatibleItemType
                value={{_type: 'legacyMarketingHeroBannerWithCallToActionBlock', title: 'Legacy'}}
              />
            </div>
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
